// ============================================================
// Saba Store — Store Server Actions
// Create store, check slug availability, activate trial
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createStoreSchema,
  checkSlugSchema,
  storeSettingsSchema,
  type CreateStoreInput,
  type StoreSettingsInput,
} from "@/lib/validations/store";
import { generateSlug } from "@/lib/utils";
import { getMerchantStoreId } from "./store-utils";

// ============================================================
// CHECK SLUG AVAILABILITY
// ============================================================
export async function checkSlugAvailability(
  slug: string
): Promise<{ available: boolean; error?: string }> {
  const validated = checkSlugSchema.safeParse({ slug });
  if (!validated.success) {
    return { available: false, error: validated.error.issues[0]?.message };
  }

  // Use admin client to bypass RLS — slug uniqueness must be checked globally
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", validated.data.slug)
    .maybeSingle();

  if (error) {
    return { available: false, error: "خطأ في التحقق من الرابط" };
  }

  return { available: !data };
}

// ============================================================
// CREATE STORE + ACTIVATE TRIAL
// ============================================================
export async function createStore(
  formData: CreateStoreInput
): Promise<{ data: { store_id: string } | null; error: string | null }> {
  const validated = createStoreSchema.safeParse(formData);
  if (!validated.success) {
    return { data: null, error: validated.error.issues[0]?.message ?? "خطأ في البيانات" };
  }

  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check user doesn't already have a store
  const { data: existingStore } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingStore) {
    return { data: null, error: "لديك متجر مسبقاً" };
  }

  // Verify slug is still available
  const { available } = await checkSlugAvailability(validated.data.slug);
  if (!available) {
    return {
      data: null,
      error: "هذا الرابط محجوز بالفعل، يرجى اختيار رابط آخر",
    };
  }

  // Create the store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .insert({
      owner_id: user.id,
      name: validated.data.name,
      slug: validated.data.slug,
      subdomain: validated.data.slug, // prepare for future subdomain
      description: validated.data.description ?? null,
      country: validated.data.country,
      currency: validated.data.currency,
      package_id: validated.data.package_id,
      status: "trial",
    })
    .select("id")
    .single();

  if (storeError || !store) {
    console.error("Store creation error:", storeError);
    return { data: null, error: "فشل إنشاء المتجر، يرجى المحاولة مرة أخرى" };
  }

  // Create 3-day trial subscription
  const trialStartsAt = new Date();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 3);

  const { error: subError } = await supabase.from("subscriptions").insert({
    store_id: store.id,
    package_id: validated.data.package_id,
    status: "trialing",
    trial_starts_at: trialStartsAt.toISOString(),
    trial_ends_at: trialEndsAt.toISOString(),
  });

  if (subError) {
    console.error("Subscription creation error:", subError);
    // Store created but subscription failed — non-critical for now
  }

  // Initialize AI credits based on package
  const adminSupabase = createAdminClient();

  const { data: pkg } = await adminSupabase
    .from("packages")
    .select("max_ai_credits")
    .eq("id", validated.data.package_id)
    .single();

  if (pkg) {
    await supabase.from("ai_credits").insert({
      store_id: store.id,
      credits_total: pkg.max_ai_credits,
      credits_used: 0,
    });
  }

  revalidatePath("/dashboard");
  return { data: { store_id: store.id }, error: null };
}

// ============================================================
// GET PACKAGES (for onboarding wizard)
// ============================================================
export async function getPackages() {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from("packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error in getPackages:", error);
      return [];
    }
    console.log("getPackages fetched:", data?.length, "packages");
    return data || [];
  } catch (err) {
    console.error("Caught exception in getPackages:", err);
    return [];
  }
}

// ============================================================
// UPDATE STORE SETTINGS
// ============================================================
export async function updateStoreSettings(
  formData: StoreSettingsInput
): Promise<{ success: boolean; error: string | null }> {
  try {
    const validated = storeSettingsSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message ?? "بيانات غير صالحة" };
    }

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    // Map store settings
    const { error: updateError } = await supabase
      .from("stores")
      .update({
        name: validated.data.name,
        description: validated.data.description ?? null,
        email: validated.data.email ?? null,
        phone: validated.data.phone ?? null,
        whatsapp: validated.data.whatsapp ?? null,
        address: validated.data.address ?? null,
        city: validated.data.city ?? null,
        country: validated.data.country,
        currency: validated.data.currency,
        logo_url: validated.data.logo_url ?? null,
        cover_url: validated.data.cover_url ?? null,
      })
      .eq("id", storeId);

    if (updateError) throw updateError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error updating store settings:", err);
    return { success: false, error: "فشل تحديث إعدادات المتجر، يرجى المحاولة لاحقاً" };
  }
}
