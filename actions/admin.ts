"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/types/database";

// ============================================================
// SECURITY HELPERS
// ============================================================

/**
 * Validates that the caller is a platform_admin.
 * Returns the admin user's ID if successful, throws error otherwise.
 */
async function requireAdmin(): Promise<string> {
  const user = await getCurrentUser();
  if (!user || user.role !== "platform_admin") {
    throw new Error("غير مصرح: هذه العملية تتطلب صلاحيات مدير المنصة");
  }
  return user.id;
}

/**
 * Logs an administrative action to the admin_logs table.
 */
async function logAdminAction(
  adminId: string,
  action: string,
  description: string,
  storeId?: string,
  metadata?: any
) {
  const supabase = createAdminClient();
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    store_id: storeId || null,
    action,
    description,
    metadata: metadata || {},
  });
}

// ============================================================
// DASHBOARD STATS
// ============================================================
export async function getDashboardStats() {
  await requireAdmin();
  const supabase = createAdminClient();

  // Basic parallel fetching of counts
  const [
    { count: storesCount },
    { count: activeStoresCount },
    { count: merchantsCount },
    { count: ordersCount },
    { count: subscriptionsCount },
  ] = await Promise.all([
    supabase.from("stores").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "merchant"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  // Aggregate total sales
  const { data: salesData } = await supabase
    .from("orders")
    .select("total_amount")
    .in("status", ["تم_تأكيد_الدفع", "مكتمل", "تم_الشحن"]);
    
  const totalSales = salesData?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0;

  return {
    storesCount: storesCount || 0,
    activeStoresCount: activeStoresCount || 0,
    merchantsCount: merchantsCount || 0,
    ordersCount: ordersCount || 0,
    subscriptionsCount: subscriptionsCount || 0,
    totalSales,
  };
}

// ============================================================
// STORES MANAGEMENT
// ============================================================
export async function getAdminStores() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("stores")
    .select(`
      *,
      packages (name, slug),
      subscriptions (status, trial_ends_at),
      users!owner_id (full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAdminStores Error:", error);
    return [];
  }
  return data as any[];
}

export async function getAdminStoreDetails(storeId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("stores")
    .select(`
      *,
      packages (*),
      subscriptions (*),
      users!owner_id (*)
    `)
    .eq("id", storeId)
    .single();

  if (error) {
    console.error("getAdminStoreDetails Error:", error);
    return null;
  }
  return data as any;
}

export async function updateStoreStatus(storeId: string, newStatus: "active" | "suspended" | "pending") {
  const adminId = await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("stores")
    .update({ status: newStatus })
    .eq("id", storeId);

  if (error) throw new Error("فشل في تحديث حالة المتجر");

  await logAdminAction(adminId, "update_store_status", `تم تغيير حالة المتجر إلى ${newStatus}`, storeId, { status: newStatus });
  revalidatePath("/admin/stores");
  revalidatePath(`/admin/stores/${storeId}`);
  
  return { success: true };
}

// ============================================================
// MERCHANTS MANAGEMENT
// ============================================================
export async function getAdminMerchants() {
  await requireAdmin();
  const supabase = createAdminClient();

  // Custom query to get merchants with store counts
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      stores (id)
    `)
    .eq("role", "merchant")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAdminMerchants Error:", error);
    return [];
  }
  return data as any[];
}

// ============================================================
// PACKAGES MANAGEMENT
// ============================================================
export async function getAdminPackages() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data;
}

export async function updatePackageLimits(packageId: string, limits: { max_products: number | null, max_ai_credits: number }) {
  const adminId = await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("packages")
    .update({ 
      max_products: limits.max_products,
      max_ai_credits: limits.max_ai_credits
    })
    .eq("id", packageId);

  if (error) throw new Error("فشل تحديث حدود الباقة");

  await logAdminAction(adminId, "update_package", `تم تحديث حدود الباقة`, undefined, limits);
  revalidatePath("/admin/packages");
  return { success: true };
}

// ============================================================
// SUBSCRIPTIONS & TRIALS
// ============================================================
export async function getAdminSubscriptions() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      stores (name, slug),
      packages (name)
    `)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as any[];
}

export async function extendTrial(subscriptionId: string, storeId: string, daysToAdd: number) {
  const adminId = await requireAdmin();
  const supabase = createAdminClient();

  // Get current trial end
  const { data: sub } = await supabase.from("subscriptions").select("trial_ends_at").eq("id", subscriptionId).single();
  
  const currentEnd = sub?.trial_ends_at ? new Date(sub.trial_ends_at) : new Date();
  currentEnd.setDate(currentEnd.getDate() + daysToAdd);

  const { error } = await supabase
    .from("subscriptions")
    .update({ 
      trial_ends_at: currentEnd.toISOString(),
      status: "trialing"
    })
    .eq("id", subscriptionId);

  if (error) throw new Error("فشل تمديد التجربة");

  await logAdminAction(adminId, "extend_trial", `تم تمديد التجربة المجانية لمدة ${daysToAdd} أيام`, storeId, { days: daysToAdd });
  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/stores/${storeId}`);
  return { success: true };
}

// ============================================================
// AI CREDITS MANAGEMENT
// ============================================================
export async function getAdminAiCredits() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ai_credits")
    .select(`
      *,
      stores (name, slug)
    `)
    .order("updated_at", { ascending: false });

  if (error) return [];
  return data as any[];
}

export async function addManualAiCredits(storeId: string, amount: number) {
  const adminId = await requireAdmin();
  const supabase = createAdminClient();

  const { data: creditRow } = await supabase
    .from("ai_credits")
    .select("credits_total")
    .eq("store_id", storeId)
    .single();

  if (!creditRow) throw new Error("سجل الأرصدة غير موجود للمتجر");

  const newBalance = creditRow.credits_total + amount;

  const { error } = await supabase
    .from("ai_credits")
    .update({ credits_total: newBalance })
    .eq("store_id", storeId);

  if (error) throw new Error("فشل إضافة الأرصدة");

  await logAdminAction(adminId, "add_ai_credits", `تمت إضافة ${amount} رصيد AI`, storeId, { amount, newBalance });
  revalidatePath("/admin/ai-credits");
  revalidatePath(`/admin/stores/${storeId}`);
  return { success: true };
}
