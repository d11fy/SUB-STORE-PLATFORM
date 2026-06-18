// ============================================================
// Saba Store — Themes & Customization Server Actions
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMerchantStoreId, getMerchantStoreWithPackage } from "./store-utils";
import { themeSettingsSchema, type ThemeSettingsInput } from "@/lib/validations/theme";
import type { Theme, StoreThemeSettings } from "@/lib/types/database";

// Helper to get all themes
export async function getThemesList(): Promise<Theme[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("themes")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.error("Error fetching themes:", error);
    return [];
  }
  return data;
}

// Get the merchant's active theme and customization settings
export async function getStoreThemeSettings(): Promise<{
  activeTheme: Theme | null;
  settings: StoreThemeSettings | null;
  error: string | null;
}> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    // 1. Fetch store's current active theme
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select("current_theme_id")
      .eq("id", storeId)
      .single();

    if (storeError || !storeData) {
      return { activeTheme: null, settings: null, error: "المتجر غير موجود" };
    }

    let activeTheme: Theme | null = null;
    if (storeData.current_theme_id) {
      const adminDb = createAdminClient();
      const { data: themeData } = await adminDb
        .from("themes")
        .select("*")
        .eq("id", storeData.current_theme_id)
        .single();
      activeTheme = themeData;
    }

    // 2. Fetch or initialize theme settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("store_theme_settings")
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle();

    if (settingsError) {
      console.error("Fetch settings error:", settingsError);
    }

    // If no settings exist yet, return defaults but don't insert until saved
    const defaultSettings: StoreThemeSettings = {
      id: "",
      store_id: storeId,
      theme_id: storeData.current_theme_id || "",
      primary_color: "#1B4FD8",
      secondary_color: "#7C3AED",
      accent_color: "#F59E0B",
      font_family: "Cairo",
      hero_title: "",
      hero_subtitle: "",
      hero_image_url: "",
      logo_url: "",
      favicon_url: "",
      sections_order: ["hero", "categories", "featured", "banner", "products"],
      hidden_sections: [],
      footer_content: "",
      custom_css: null,
      custom_html: {},
      settings: {},
      updated_at: new Date().toISOString(),
    };

    return {
      activeTheme,
      settings: settingsData || defaultSettings,
      error: null,
    };
  } catch (err: any) {
    console.error("Error fetching theme settings:", err);
    return { activeTheme: null, settings: null, error: "حدث خطأ غير متوقع أثناء جلب الإعدادات" };
  }
}

// Set active theme for merchant store with package gating
export async function setActiveThemeAction(
  themeId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const store = await getMerchantStoreWithPackage();
    const supabase = await createClient();

    // 1. Fetch target theme
    const adminDb = createAdminClient();
    const { data: theme, error: themeError } = await adminDb
      .from("themes")
      .select("*")
      .eq("id", themeId)
      .single();

    if (themeError || !theme) {
      return { success: false, error: "الثيم المحدد غير متوفر" };
    }

    // 2. Validate package constraints
    const pkgSlug = store.packages?.slug || "starter";
    if (pkgSlug === "starter") {
      const allowedSlugs = ["fashion", "blank"];
      if (!allowedSlugs.includes(theme.slug)) {
        return {
          success: false,
          error: "باقة الانطلاقة تسمح فقط بقالب الملابس وقالب التخصيص الفارغ. يرجى الترقية لتفعيل قوالب مميزة.",
        };
      }
    }

    // 3. Update store theme ID
    const { error: updateError } = await supabase
      .from("stores")
      .update({ current_theme_id: themeId })
      .eq("id", store.id);

    if (updateError) throw updateError;

    // 4. Upsert or update store_theme_settings theme_id
    const { data: existingSettings } = await supabase
      .from("store_theme_settings")
      .select("id")
      .eq("store_id", store.id)
      .maybeSingle();

    if (existingSettings) {
      await supabase
        .from("store_theme_settings")
        .update({ theme_id: themeId })
        .eq("store_id", store.id);
    } else {
      await supabase.from("store_theme_settings").insert({
        store_id: store.id,
        theme_id: themeId,
      });
    }

    // Revalidate paths
    revalidatePath("/dashboard/themes");
    revalidatePath("/dashboard/themes/customize");
    revalidatePath(`/store/${store.slug}`);
    
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error setting active theme:", err);
    return { success: false, error: "فشل تفعيل الثيم، يرجى المحاولة لاحقاً" };
  }
}

// Update customization settings
export async function updateStoreThemeSettingsAction(
  formData: ThemeSettingsInput
): Promise<{ success: boolean; error: string | null }> {
  try {
    const validated = themeSettingsSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message ?? "بيانات غير صالحة" };
    }

    const store = await getMerchantStoreWithPackage();
    const supabase = await createClient();

    // Fetch store theme id
    const { data: storeData } = await supabase
      .from("stores")
      .select("current_theme_id")
      .eq("id", store.id)
      .single();

    const themeId = storeData?.current_theme_id;
    if (!themeId) {
      return { success: false, error: "يرجى تحديد ثيم نشط للمتجر أولاً قبل التخصيص" };
    }

    // Upsert the settings
    const { data: existingSettings } = await supabase
      .from("store_theme_settings")
      .select("id")
      .eq("store_id", store.id)
      .maybeSingle();

    const payload = {
      primary_color: validated.data.primary_color,
      secondary_color: validated.data.secondary_color,
      accent_color: validated.data.accent_color,
      font_family: validated.data.font_family,
      hero_title: validated.data.hero_title || null,
      hero_subtitle: validated.data.hero_subtitle || null,
      hero_image_url: validated.data.hero_image_url || null,
      logo_url: validated.data.logo_url || null,
      favicon_url: validated.data.favicon_url || null,
      footer_content: validated.data.footer_content || null,
      sections_order: validated.data.sections_order || ["hero", "categories", "featured", "banner", "products"],
      hidden_sections: validated.data.hidden_sections || [],
    };

    let error = null;
    if (existingSettings) {
      const { error: updateError } = await supabase
        .from("store_theme_settings")
        .update(payload)
        .eq("store_id", store.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("store_theme_settings")
        .insert({
          ...payload,
          store_id: store.id,
          theme_id: themeId,
        });
      error = insertError;
    }

    if (error) throw error;

    // Update store details logo if custom logo is provided
    if (validated.data.logo_url) {
      await supabase
        .from("stores")
        .update({ logo_url: validated.data.logo_url })
        .eq("id", store.id);
    }

    // Revalidate paths
    revalidatePath("/dashboard/themes");
    revalidatePath("/dashboard/themes/customize");
    revalidatePath(`/store/${store.slug}`);

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error updating theme settings:", err);
    return { success: false, error: "فشل حفظ إعدادات تخصيص المظهر" };
  }
}
