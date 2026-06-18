"use server";

import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId } from "./store-utils";
import { revalidatePath } from "next/cache";
import type { StoreDomain } from "@/lib/types/database";

function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(domain);
}

function cleanDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
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
  domain: string
): Promise<{ data: StoreDomain | null; error: string | null }> {
  const trimmed = cleanDomain(domain);

  if (!isValidDomain(trimmed)) {
    return { data: null, error: "صيغة النطاق غير صحيحة. مثال: mystore.com" };
  }

  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("domains")
      .insert({
        store_id: storeId,
        domain: trimmed,
        is_verified: false,
        is_primary: false,
        dns_records: {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return { data: null, error: "هذا النطاق مستخدم بالفعل" };
      throw error;
    }

    revalidatePath("/dashboard/domain");
    return { data, error: null };
  } catch {
    return { data: null, error: "فشل إضافة النطاق" };
  }
}

export async function verifyDomainAction(
  domainId: string
): Promise<{ success: boolean; is_verified: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    const { data: domainRow, error: fetchErr } = await supabase
      .from("domains")
      .select("domain")
      .eq("id", domainId)
      .eq("store_id", storeId)
      .single();

    if (fetchErr || !domainRow) throw fetchErr ?? new Error("not found");

    // Attempt HTTP reachability check — passes once DNS CNAME is pointing correctly
    let verified = false;
    try {
      const res = await fetch(`https://${domainRow.domain}/`, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(6000),
        headers: { "User-Agent": "SabaStoreVerify/1.0" },
      });
      verified = res.ok || res.status === 301 || res.status === 302;
    } catch {
      // DNS not pointing yet or network unreachable
    }

    const { error: updateErr } = await supabase
      .from("domains")
      .update({
        is_verified: verified,
        verified_at: verified ? new Date().toISOString() : null,
        dns_records: { last_check: new Date().toISOString(), verified },
        updated_at: new Date().toISOString(),
      })
      .eq("id", domainId)
      .eq("store_id", storeId);

    if (updateErr) throw updateErr;

    revalidatePath("/dashboard/domain");
    return { success: true, is_verified: verified, error: null };
  } catch {
    return { success: false, is_verified: false, error: "فشل التحقق من النطاق" };
  }
}

export async function removeDomainAction(
  domainId: string
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

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

    // Clear all primaries for this store
    await supabase
      .from("domains")
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq("store_id", storeId);

    // Set the chosen domain as primary
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
