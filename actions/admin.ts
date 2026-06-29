"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/monitoring/logger";
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
    logger.error("getAdminStores", error);
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
    logger.error("getAdminStoreDetails", error);
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
    logger.error("getAdminMerchants", error);
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

export async function approveSubscription(subscriptionId: string, storeId: string) {
  const adminId = await requireAdmin();
  const supabase = createAdminClient();

  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      admin_note: null,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq("id", subscriptionId);

  if (error) throw new Error("فشل تفعيل الاشتراك");

  // Also update store status to active
  await supabase.from("stores").update({ status: "active" }).eq("id", storeId);

  await logAdminAction(adminId, "approve_subscription", "تم تفعيل اشتراك المتجر", storeId, { subscriptionId });
  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/stores/${storeId}`);
  return { success: true };
}

export async function rejectSubscription(subscriptionId: string, storeId: string, note: string) {
  const adminId = await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "rejected", admin_note: note || "تم رفض طلب الدفع" })
    .eq("id", subscriptionId);

  if (error) throw new Error("فشل رفض الاشتراك");

  await logAdminAction(adminId, "reject_subscription", `تم رفض اشتراك المتجر: ${note}`, storeId, { subscriptionId, note });
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

// ============================================================
// USERS MANAGEMENT
// ============================================================
export async function getAdminAllUsers(roleFilter?: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  let query = supabase
    .from("users")
    .select(`*, stores!owner_id(id, status)`)
    .order("created_at", { ascending: false });

  if (roleFilter && roleFilter !== "all") {
    query = query.eq("role", roleFilter as Database["public"]["Enums"]["user_role"]);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("getAdminAllUsers", error);
    return [];
  }
  return data as any[];
}

export async function suspendMerchantStores(userId: string) {
  const adminId = await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("stores")
    .update({ status: "suspended" })
    .eq("owner_id", userId)
    .neq("status", "suspended");

  if (error) throw new Error("فشل تعليق متاجر المستخدم");

  await logAdminAction(adminId, "suspend_user_stores", `تم تعليق جميع متاجر المستخدم ${userId}`, undefined, { userId });
  revalidatePath("/admin/users");
  revalidatePath("/admin/stores");
  return { success: true };
}

export async function reactivateMerchantStores(userId: string) {
  const adminId = await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("stores")
    .update({ status: "active" })
    .eq("owner_id", userId)
    .eq("status", "suspended");

  if (error) throw new Error("فشل تفعيل متاجر المستخدم");

  await logAdminAction(adminId, "reactivate_user_stores", `تم إعادة تفعيل متاجر المستخدم ${userId}`, undefined, { userId });
  revalidatePath("/admin/users");
  revalidatePath("/admin/stores");
  return { success: true };
}

// ============================================================
// REVENUE ANALYTICS
// ============================================================
export async function getRevenueOverview() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [
    { data: activeSubs },
    { data: orderRevenue },
    { data: monthlyOrders },
  ] = await Promise.all([
    // Active subscriptions joined with packages for MRR
    supabase
      .from("subscriptions")
      .select("id, status, packages(price_monthly, name)")
      .in("status", ["active", "trialing"]),
    // All confirmed/completed order revenue
    supabase
      .from("orders")
      .select("total_amount, created_at")
      .in("status", ["تم_تأكيد_الدفع", "مكتمل", "تم_الشحن"]),
    // Orders this month
    supabase
      .from("orders")
      .select("total_amount, created_at")
      .in("status", ["تم_تأكيد_الدفع", "مكتمل", "تم_الشحن"])
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const mrr = (activeSubs ?? []).reduce((sum, sub) => {
    const pkg = sub.packages as any;
    return sum + (pkg?.price_monthly ?? 0);
  }, 0);

  const totalRevenue = (orderRevenue ?? []).reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
  const monthRevenue = (monthlyOrders ?? []).reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

  // Revenue by package
  const revenueByPackage: Record<string, { name: string; count: number; mrr: number }> = {};
  for (const sub of activeSubs ?? []) {
    const pkg = sub.packages as any;
    if (!pkg) continue;
    if (!revenueByPackage[pkg.name]) {
      revenueByPackage[pkg.name] = { name: pkg.name, count: 0, mrr: 0 };
    }
    revenueByPackage[pkg.name].count++;
    revenueByPackage[pkg.name].mrr += pkg.price_monthly ?? 0;
  }

  return {
    mrr,
    arr: mrr * 12,
    totalRevenue,
    monthRevenue,
    activeSubscriptions: activeSubs?.length ?? 0,
    revenueByPackage: Object.values(revenueByPackage),
  };
}

export async function getMonthlyRevenueTrend() {
  await requireAdmin();
  const supabase = createAdminClient();

  // Last 6 months of order revenue
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data } = await supabase
    .from("orders")
    .select("total_amount, created_at")
    .in("status", ["تم_تأكيد_الدفع", "مكتمل", "تم_الشحن"])
    .gte("created_at", sixMonthsAgo.toISOString())
    .order("created_at", { ascending: true });

  // Group by month
  const byMonth: Record<string, number> = {};
  for (const order of data ?? []) {
    const d = new Date(order.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + (order.total_amount ?? 0);
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue }));
}

// ============================================================
// AI USAGE MONITOR
// ============================================================
export async function getAiUsageOverview() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [
    { data: credits },
    { data: generationsCount },
    { data: typeBreakdown },
  ] = await Promise.all([
    supabase.from("ai_credits").select("credits_total, credits_used, stores(name, slug)").order("credits_used", { ascending: false }),
    supabase.from("ai_generations").select("id", { count: "exact", head: true }),
    supabase.from("ai_generations").select("type, credits_used"),
  ]);

  const totalCreditsUsed = (credits ?? []).reduce((sum, c) => sum + (c.credits_used ?? 0), 0);
  const totalCreditsIssued = (credits ?? []).reduce((sum, c) => sum + (c.credits_total ?? 0), 0);

  // By type
  const byType: Record<string, number> = {};
  for (const g of typeBreakdown ?? []) {
    byType[g.type] = (byType[g.type] ?? 0) + (g.credits_used ?? 1);
  }

  return {
    totalCreditsUsed,
    totalCreditsIssued,
    totalGenerations: (generationsCount as any)?.count ?? 0,
    perStore: (credits ?? []).map((c) => ({
      storeName: (c.stores as any)?.name ?? "—",
      storeSlug: (c.stores as any)?.slug ?? "",
      creditsUsed: c.credits_used,
      creditsTotal: c.credits_total,
    })),
    byType: Object.entries(byType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count })),
  };
}

// ============================================================
// PLATFORM SETTINGS (stored via admin_logs metadata)
// ============================================================
export async function getPlatformSettings(): Promise<Record<string, unknown>> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("admin_logs")
    .select("metadata, created_at")
    .eq("action", "platform_settings_update")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.metadata) {
    return {
      maintenance_mode: false,
      freeze_registrations: false,
      ai_features_enabled: true,
      announcement: "",
    };
  }
  return data.metadata as Record<string, unknown>;
}

export async function savePlatformSettings(settings: Record<string, unknown>) {
  const adminId = await requireAdmin();
  const supabase = createAdminClient();

  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action: "platform_settings_update",
    description: "تم تحديث إعدادات المنصة",
    metadata: settings as Record<string, unknown> as import("@/lib/types/database").Json,
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

// ============================================================
// SMTP SETTINGS (stored in platform_settings table)
// ============================================================
export async function getSmtpSettings(): Promise<{
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  configured: boolean;
}> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"]);

  const kv: Record<string, string> = {};
  data?.forEach(({ key, value }: { key: string; value: string | null }) => {
    if (value) kv[key] = value;
  });

  return {
    smtp_host: kv.smtp_host ?? "",
    smtp_port: kv.smtp_port ?? "587",
    smtp_user: kv.smtp_user ?? "",
    smtp_pass: kv.smtp_pass ? "••••••••" : "",
    smtp_from: kv.smtp_from ?? "",
    configured: !!(kv.smtp_host && kv.smtp_user && kv.smtp_pass),
  };
}

export async function saveSmtpSettings(settings: {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
}) {
  const adminId = await requireAdmin();
  const supabase = createAdminClient();

  // Only update password if it wasn't masked (i.e. user typed a new one)
  const entries = Object.entries(settings)
    .filter(([, v]) => v && v !== "••••••••")
    .map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: adminId,
    }));

  if (entries.length === 0) return { success: true };

  const { error } = await supabase.from("platform_settings").upsert(entries, { onConflict: "key" });
  if (error) return { success: false, error: "فشل حفظ إعدادات البريد" };

  // Log to admin_logs (without password)
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action: "smtp_settings_update",
    description: "تم تحديث إعدادات البريد الإلكتروني",
    metadata: {
      smtp_host: settings.smtp_host,
      smtp_from: settings.smtp_from,
      updated_fields: entries.map((e) => e.key),
    } as import("@/lib/types/database").Json,
  });

  // Invalidate in-memory SMTP cache so next email uses new settings
  const { invalidateSmtpCache } = await import("@/lib/email/sender");
  invalidateSmtpCache();

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function testSmtpSettings(toEmail: string) {
  await requireAdmin();
  const { sendEmail } = await import("@/lib/email/sender");
  const { invalidateSmtpCache } = await import("@/lib/email/sender");
  invalidateSmtpCache(); // Force re-read from DB

  const result = await sendEmail({
    to: toEmail,
    subject: "اختبار إعدادات البريد — سبأ ستور",
    html: `<div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #10b981;">✓ إعدادات البريد تعمل بشكل صحيح</h2>
      <p>هذا إيميل اختباري من لوحة تحكم سبأ ستور.</p>
      <p style="color: #6b7280; font-size: 12px;">إذا وصلك هذا الإيميل، فإن إعدادات SMTP مضبوطة بشكل صحيح.</p>
    </div>`,
  });

  return result;
}

// ============================================================
// SECURITY CENTER
// ============================================================
export async function getSecurityOverview() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [
    { data: recentActions },
    { count: suspendedStores },
    { count: totalUsers },
    { data: roleDistrib },
  ] = await Promise.all([
    supabase
      .from("admin_logs")
      .select("action, description, created_at, admin_id")
      .in("action", ["update_store_status", "suspend_user_stores", "add_ai_credits", "platform_settings_update", "extend_trial"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("stores")
      .select("*", { count: "exact", head: true })
      .eq("status", "suspended"),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("role"),
  ]);

  const roleCounts: Record<string, number> = {};
  for (const u of roleDistrib ?? []) {
    roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1;
  }

  return {
    recentActions: recentActions ?? [],
    suspendedStores: suspendedStores ?? 0,
    totalUsers: totalUsers ?? 0,
    roleCounts,
  };
}

// ============================================================
// PLATFORM AUDIT LOGS (paginated)
// ============================================================
const LOGS_PER_PAGE = 25;

export async function getAdminLogsPage(page: number = 1, actionFilter?: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const from = (page - 1) * LOGS_PER_PAGE;
  const to = from + LOGS_PER_PAGE - 1;

  let query = supabase
    .from("admin_logs")
    .select("*, users!admin_id(full_name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (actionFilter && actionFilter !== "all") {
    query = query.eq("action", actionFilter);
  }

  const { data, count, error } = await query;
  if (error) {
    logger.error("getAdminLogsPage", error);
    return { logs: [], total: 0, totalPages: 0 };
  }

  return {
    logs: (data ?? []) as any[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / LOGS_PER_PAGE),
  };
}

export async function getLogActionTypes() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data } = await supabase.from("admin_logs").select("action");
  const unique = [...new Set((data ?? []).map((d) => d.action))].sort();
  return unique;
}

// ============================================================
// ENHANCED DASHBOARD STATS
// ============================================================
export async function getEnhancedDashboardStats() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [
    { count: storesCount },
    { count: activeStoresCount },
    { count: merchantsCount },
    { count: ordersCount },
    { count: subscriptionsCount },
    { data: activeSubs },
    { data: recentOrders },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from("stores").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "merchant"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("subscriptions").select("packages(price_monthly)").in("status", ["active", "trialing"]),
    supabase
      .from("orders")
      .select("total_amount, created_at, store_id, stores(name)")
      .in("status", ["تم_تأكيد_الدفع", "مكتمل", "تم_الشحن"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("admin_logs")
      .select("action, description, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const totalSales = (recentOrders ?? []).reduce((acc: number, o: any) => acc + (o.total_amount ?? 0), 0);
  const mrr = (activeSubs ?? []).reduce((sum: number, sub: any) => sum + (sub.packages?.price_monthly ?? 0), 0);

  return {
    storesCount: storesCount ?? 0,
    activeStoresCount: activeStoresCount ?? 0,
    merchantsCount: merchantsCount ?? 0,
    ordersCount: ordersCount ?? 0,
    subscriptionsCount: subscriptionsCount ?? 0,
    totalSales,
    mrr,
    arr: mrr * 12,
    recentOrders: (recentOrders ?? []) as any[],
    recentLogs: (recentLogs ?? []) as any[],
  };
}
