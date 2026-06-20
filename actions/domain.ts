"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMerchantStoreId } from "./store-utils";
import { revalidatePath } from "next/cache";
import { normalizeDomain, validateDomain } from "@/lib/domain/utils";
import {
  isVercelConfigured,
  vercelAddDomain,
  vercelCheckDomain,
  vercelRemoveDomain,
} from "@/lib/domain/vercel-api";
import type { StoreDomain, Json } from "@/lib/types/database";
import { promises as dns } from "dns";

// Extended status stored in dns_records JSONB
type DomainDnsRecords = {
  status: "pending_dns" | "verifying" | "active" | "invalid" | "failed";
  normalized_domain?: string;
  last_checked_at?: string;
  error_message?: string;
  verification_type?: "cname" | "a_record";
  vercel_added?: boolean;
};

// Perform real DNS verification
async function checkDnsPointsToVercel(domain: string): Promise<{
  verified: boolean;
  type: "cname" | "a_record" | null;
  error?: string;
}> {
  const VERCEL_IP = "76.76.21.21";

  // Try CNAME first
  try {
    const cnames = await dns.resolveCname(domain);
    if (cnames.some((c) => c.endsWith("vercel-dns.com") || c.endsWith("vercel.app"))) {
      return { verified: true, type: "cname" };
    }
  } catch {
    // Not a CNAME or DNS error — fall through to A record check
  }

  // Try A record
  try {
    const addresses = await dns.resolve4(domain);
    if (addresses.includes(VERCEL_IP)) {
      return { verified: true, type: "a_record" };
    }
    return {
      verified: false,
      type: "a_record",
      error: `سجل A يشير إلى ${addresses[0]} وليس إلى خوادم Vercel (${VERCEL_IP})`,
    };
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return { verified: false, type: null, error: "النطاق غير موجود في DNS — تأكد من إعداد السجلات أولاً" };
    }
    return { verified: false, type: null, error: "تعذّر التحقق من DNS — حاول لاحقاً" };
  }
}

export async function getDomainsAction(): Promise<{ data: StoreDomain[]; error: string | null }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("domains")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch {
    return { data: [], error: "فشل جلب النطاقات" };
  }
}

export async function addDomainAction(
  rawDomain: string
): Promise<{ data: StoreDomain | null; error: string | null; vercel_status?: string }> {
  const validation = validateDomain(rawDomain);
  if (!validation.valid) {
    return { data: null, error: validation.error };
  }
  const { normalized } = validation;

  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    // Check if domain is already used by another store
    const { data: existing } = await supabase
      .from("domains")
      .select("store_id")
      .eq("domain", normalized)
      .maybeSingle();

    if (existing && existing.store_id !== storeId) {
      return { data: null, error: "هذا النطاق مستخدم بالفعل من متجر آخر" };
    }
    if (existing && existing.store_id === storeId) {
      return { data: null, error: "هذا النطاق مضاف بالفعل لمتجرك" };
    }

    // Build initial dns_records
    const dnsRecords: DomainDnsRecords = {
      status: "pending_dns",
      normalized_domain: normalized,
    };

    // Optionally add to Vercel
    let vercel_status = "";
    if (isVercelConfigured()) {
      const vercelResult = await vercelAddDomain(normalized);
      if (vercelResult.error) {
        dnsRecords.error_message = `Vercel: ${vercelResult.error}`;
        vercel_status = "فشل إضافة الدومين إلى Vercel: " + vercelResult.error;
      } else {
        dnsRecords.vercel_added = true;
        vercel_status = "تم إضافة الدومين إلى مشروع Vercel";
      }
    }

    const { data, error } = await supabase
      .from("domains")
      .insert({
        store_id: storeId,
        domain: normalized,
        is_verified: false,
        is_primary: false,
        dns_records: dnsRecords as unknown as Json,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return { data: null, error: "هذا النطاق مستخدم بالفعل" };
      throw error;
    }

    revalidatePath("/dashboard/domain");
    return { data, error: null, vercel_status };
  } catch {
    return { data: null, error: "فشل إضافة النطاق" };
  }
}

export async function verifyDomainAction(
  domainId: string
): Promise<{ success: boolean; is_verified: boolean; status: string; error: string | null; error_detail?: string }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    const { data: domainRow, error: fetchErr } = await supabase
      .from("domains")
      .select("*")
      .eq("id", domainId)
      .eq("store_id", storeId)
      .single();

    if (fetchErr || !domainRow) {
      return { success: false, is_verified: false, status: "failed", error: "النطاق غير موجود" };
    }

    const normalized =
      (domainRow.dns_records as Record<string, unknown>)?.normalized_domain as string | undefined ??
      domainRow.domain;

    // 1. Check DNS
    const dnsCheck = await checkDnsPointsToVercel(normalized);

    // 2. If DNS points correctly, check Vercel (if configured)
    let vercelVerified = false;
    if (dnsCheck.verified && isVercelConfigured()) {
      const vercelStatus = await vercelCheckDomain(normalized);
      vercelVerified = vercelStatus.verified;
    } else if (dnsCheck.verified && !isVercelConfigured()) {
      // Without Vercel API, DNS pointing correctly is sufficient for "active" status
      vercelVerified = true;
    }

    const isVerified = dnsCheck.verified && vercelVerified;
    const status: DomainDnsRecords["status"] = isVerified
      ? "active"
      : dnsCheck.verified
      ? "verifying"
      : "pending_dns";

    const newDnsRecords: DomainDnsRecords = {
      status,
      normalized_domain: normalized,
      last_checked_at: new Date().toISOString(),
      error_message: dnsCheck.error,
      verification_type: dnsCheck.type ?? undefined,
      vercel_added: (domainRow.dns_records as Record<string, unknown>)?.vercel_added as boolean | undefined,
    };

    await supabase
      .from("domains")
      .update({
        is_verified: isVerified,
        verified_at: isVerified ? new Date().toISOString() : null,
        dns_records: newDnsRecords as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", domainId)
      .eq("store_id", storeId);

    revalidatePath("/dashboard/domain");
    return {
      success: true,
      is_verified: isVerified,
      status,
      error: null,
      error_detail: dnsCheck.error,
    };
  } catch {
    return { success: false, is_verified: false, status: "failed", error: "فشل التحقق من النطاق" };
  }
}

export async function removeDomainAction(
  domainId: string
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    const { data: domainRow } = await supabase
      .from("domains")
      .select("domain, dns_records")
      .eq("id", domainId)
      .eq("store_id", storeId)
      .single();

    if (!domainRow) return { success: false, error: "النطاق غير موجود" };

    // Remove from Vercel if it was added
    const dnsRec = domainRow.dns_records as Record<string, unknown>;
    if (isVercelConfigured() && dnsRec?.vercel_added) {
      await vercelRemoveDomain(domainRow.domain);
    }

    const { error } = await supabase
      .from("domains")
      .delete()
      .eq("id", domainId)
      .eq("store_id", storeId);

    if (error) throw error;

    revalidatePath("/dashboard/domain");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "فشل حذف النطاق" };
  }
}

export async function setPrimaryDomainAction(
  domainId: string
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    // Verify the target domain is active before setting primary
    const { data: target } = await supabase
      .from("domains")
      .select("is_verified")
      .eq("id", domainId)
      .eq("store_id", storeId)
      .single();

    if (!target?.is_verified) {
      return { success: false, error: "يجب التحقق من النطاق أولاً قبل تعيينه رئيسياً" };
    }

    // Clear all primaries
    await supabase
      .from("domains")
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq("store_id", storeId);

    // Set chosen as primary
    const { error } = await supabase
      .from("domains")
      .update({ is_primary: true, updated_at: new Date().toISOString() })
      .eq("id", domainId)
      .eq("store_id", storeId);

    if (error) throw error;

    revalidatePath("/dashboard/domain");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "فشل تعيين النطاق الرئيسي" };
  }
}

// Admin-only: get all domains across all stores
export async function adminGetAllDomainsAction(filters?: {
  status?: string;
  search?: string;
}): Promise<{ data: (StoreDomain & { stores: { name: string; slug: string } | null })[]; error: string | null }> {
  try {
    const adminDb = createAdminClient();

    let query = adminDb
      .from("domains")
      .select("*, stores(name, slug)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filters?.search) {
      query = query.ilike("domain", `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data: (data ?? []) as unknown as (StoreDomain & { stores: { name: string; slug: string } | null })[], error: null };
  } catch {
    return { data: [], error: "فشل جلب النطاقات" };
  }
}

// Admin-only: retry verification for any domain
export async function adminRetryVerificationAction(
  domainId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const adminDb = createAdminClient();
    const { data: domainRow } = await adminDb
      .from("domains")
      .select("*")
      .eq("id", domainId)
      .single();

    if (!domainRow) return { success: false, error: "النطاق غير موجود" };

    const normalized =
      (domainRow.dns_records as Record<string, unknown>)?.normalized_domain as string | undefined ??
      domainRow.domain;

    const dnsCheck = await checkDnsPointsToVercel(normalized);
    const isVerified = dnsCheck.verified;
    const status: DomainDnsRecords["status"] = isVerified ? "active" : "pending_dns";

    const newDnsRecords: DomainDnsRecords = {
      ...((domainRow.dns_records as Record<string, unknown>) ?? {}),
      status,
      last_checked_at: new Date().toISOString(),
      error_message: dnsCheck.error,
      verification_type: dnsCheck.type ?? undefined,
    };

    await adminDb
      .from("domains")
      .update({
        is_verified: isVerified,
        verified_at: isVerified ? new Date().toISOString() : null,
        dns_records: newDnsRecords as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", domainId);

    return { success: true, error: null };
  } catch {
    return { success: false, error: "فشل إعادة التحقق" };
  }
}

// Admin-only: force remove domain
export async function adminRemoveDomainAction(
  domainId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const adminDb = createAdminClient();
    const { data: domainRow } = await adminDb
      .from("domains")
      .select("domain, dns_records")
      .eq("id", domainId)
      .single();

    if (!domainRow) return { success: false, error: "النطاق غير موجود" };

    const dnsRec = domainRow.dns_records as Record<string, unknown>;
    if (isVercelConfigured() && dnsRec?.vercel_added) {
      await vercelRemoveDomain(domainRow.domain);
    }

    const { error } = await adminDb.from("domains").delete().eq("id", domainId);
    if (error) throw error;

    return { success: true, error: null };
  } catch {
    return { success: false, error: "فشل حذف النطاق" };
  }
}

// Keep backward-compatible normalizeDomain export for any existing usage
export { normalizeDomain };
