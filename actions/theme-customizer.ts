// ============================================================
// Saba Store — D1 Theme Customizer Server Actions
// Draft/Publish/Discard + Image Upload
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId } from "./store-utils";
import {
  themeDraftConfigSchema,
  type ThemeDraftConfigInput,
} from "@/lib/validations/theme-d1";
import type { ExtendedThemeSettings, SectionConfig } from "@/lib/themes/customization-types";
import type { Json } from "@/lib/types/database";
import { validateD1SectionsConstraints } from "@/lib/themes/platform-constraints";

// ── Helper: get active theme slug for constraint checks ───────
async function getActiveThemeSlug(storeId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("themes(slug)")
    .eq("id", storeId)
    .single();
  return (data?.themes as any)?.slug ?? "general";
}

// ── Helper: read current settings JSONB ──────────────────────
async function readSettings(
  storeId: string
): Promise<{ rowId: string | null; extended: ExtendedThemeSettings }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_theme_settings")
    .select("id, settings")
    .eq("store_id", storeId)
    .maybeSingle();

  if (!data) return { rowId: null, extended: {} };
  const extended = (data.settings as ExtendedThemeSettings | null) ?? {};
  return { rowId: data.id, extended };
}

// ── Helper: write settings JSONB ─────────────────────────────
async function writeSettings(
  storeId: string,
  rowId: string | null,
  extended: ExtendedThemeSettings,
  extraCols?: Record<string, unknown>
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  // ExtendedThemeSettings is a typed POJO but Supabase expects Json which requires
  // a recursive index signature. The runtime shape is valid JSON so this cast is safe.
  const settingsJson = extended as unknown as Json;
  const payload = { settings: settingsJson, ...(extraCols ?? {}) };

  if (rowId) {
    const { error } = await supabase
      .from("store_theme_settings")
      .update(payload)
      .eq("store_id", storeId);
    return { error: error?.message ?? null };
  } else {
    const { data: storeData } = await supabase
      .from("stores")
      .select("current_theme_id")
      .eq("id", storeId)
      .single();
    const themeId = storeData?.current_theme_id || null;
    const { error } = await supabase.from("store_theme_settings").insert({
      store_id: storeId,
      theme_id: themeId ?? "",
      settings: settingsJson,
      ...(extraCols ?? {}),
    } as any);
    return { error: error?.message ?? null };
  }
}

// ── 1. Save Draft ─────────────────────────────────────────────
// Writes the entire form state into settings.draft_config
// Does NOT affect live columns — draft only
export async function saveThemeDraftAction(
  draft: ThemeDraftConfigInput
): Promise<{ success: boolean; error: string | null }> {
  try {
    const validated = themeDraftConfigSchema.safeParse(draft);
    if (!validated.success) {
      const msg = validated.error.issues[0]?.message ?? "بيانات غير صالحة";
      return { success: false, error: msg };
    }

    const storeId = await getMerchantStoreId();
    const { rowId, extended } = await readSettings(storeId);

    const nextSettings: ExtendedThemeSettings = {
      ...extended,
      draft_config: validated.data,
    };

    const { error } = await writeSettings(storeId, rowId, nextSettings);
    if (error) return { success: false, error: "فشل حفظ المسودة: " + error };

    revalidatePath("/dashboard/themes/customize");
    revalidatePath("/dashboard/themes");
    return { success: true, error: null };
  } catch (err) {
    console.error("saveThemeDraftAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع أثناء حفظ المسودة" };
  }
}

// ── 2. Publish Draft ──────────────────────────────────────────
// Copies draft_config to live columns + settings sub-keys
// Clears draft_config + sets published_at
export async function publishThemeDraftAction(): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const storeId = await getMerchantStoreId();
    const { rowId, extended } = await readSettings(storeId);

    const draft = extended.draft_config;
    if (!draft) {
      return { success: false, error: "لا توجد مسودة للنشر" };
    }

    // D3.6: Validate sections against platform constraints before publish
    const activeThemeSlug = await getActiveThemeSlug(storeId);
    const sectionsCheck = validateD1SectionsConstraints(
      draft.sections_config ?? [],
      activeThemeSlug
    );
    if (!sectionsCheck.valid) {
      return {
        success: false,
        error: "لا يمكن النشر — مخالفة قواعد المنصة: " + sectionsCheck.violations[0],
      };
    }

    // Build live top-level columns
    const liveColumns: Record<string, unknown> = {
      primary_color: draft.primary_color,
      secondary_color: draft.secondary_color,
      accent_color: draft.accent_color,
      font_family: draft.font_family,
      hero_title: draft.hero_title || null,
      hero_subtitle: draft.hero_subtitle || null,
      hero_image_url: draft.hero_image_url || null,
      logo_url: draft.logo_url || null,
      favicon_url: draft.favicon_url || null,
      footer_content: draft.footer_config?.text || draft.footer_content || null,
      // Sync sections to legacy columns for backward compat
      sections_order: draft.sections_config
        .filter((s) => s.enabled)
        .sort((a, b) => a.order - b.order)
        .map((s) => s.type),
      hidden_sections: draft.sections_config
        .filter((s) => !s.enabled)
        .map((s) => s.type),
    };

    // Build extended settings (drop draft, keep config)
    const nextSettings: ExtendedThemeSettings = {
      ...extended,
      sections_config: draft.sections_config,
      header_config: draft.header_config,
      footer_config: draft.footer_config,
      homepage_config: draft.homepage_config,
      draft_config: undefined,
      published_at: new Date().toISOString(),
    };

    const { error } = await writeSettings(
      storeId,
      rowId,
      nextSettings,
      liveColumns
    );
    if (error) return { success: false, error: "فشل نشر التعديلات: " + error };

    // Also update store logo if provided
    if (draft.logo_url) {
      const supabase = await createClient();
      await supabase
        .from("stores")
        .update({ logo_url: draft.logo_url })
        .eq("id", storeId);
    }

    revalidatePath("/dashboard/themes/customize");
    revalidatePath("/dashboard/themes");

    // Revalidate the entire store subtree so all cached pages reflect the new theme
    const supabase = await createClient();
    const { data: storeData } = await supabase
      .from("stores")
      .select("slug")
      .eq("id", storeId)
      .single();
    if (storeData?.slug) {
      const base = `/store/${storeData.slug}`;
      // Revalidate the layout for every sub-route (header/footer config changes)
      revalidatePath(base, "layout");
      // Revalidate specific page caches
      revalidatePath(base);
      revalidatePath(`${base}/products`);
      revalidatePath(`${base}/product`, "page");
      revalidatePath(`${base}/category`, "page");
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("publishThemeDraftAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع أثناء النشر" };
  }
}

// ── 3. Discard Draft ─────────────────────────────────────────
// Clears settings.draft_config without touching live
export async function discardThemeDraftAction(): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const storeId = await getMerchantStoreId();
    const { rowId, extended } = await readSettings(storeId);

    if (!extended.draft_config) {
      return { success: true, error: null }; // nothing to discard
    }

    const nextSettings: ExtendedThemeSettings = {
      ...extended,
      draft_config: undefined,
    };

    const { error } = await writeSettings(storeId, rowId, nextSettings);
    if (error) return { success: false, error: "فشل تجاهل المسودة" };

    revalidatePath("/dashboard/themes/customize");
    return { success: true, error: null };
  } catch (err) {
    console.error("discardThemeDraftAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

// ── 4. Update Sections Config (direct live) ──────────────────
// Used for quick reorder/toggle without going through draft.
// Only Zod schema validity is required here — theme-level constraint
// rules (e.g. product sections blocked on subscription themes) are
// enforced at publish time, not on every quick save. This lets merchants
// arrange their sections freely in the customizer without being blocked.
export async function updateSectionsConfigAction(
  sections: SectionConfig[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const storeId = await getMerchantStoreId();
    const { rowId, extended } = await readSettings(storeId);

    const nextSettings: ExtendedThemeSettings = {
      ...extended,
      sections_config: sections,
    };

    const liveSync = {
      sections_order: sections
        .filter((s) => s.enabled)
        .sort((a, b) => a.order - b.order)
        .map((s) => s.type),
      hidden_sections: sections.filter((s) => !s.enabled).map((s) => s.type),
    };

    const { error } = await writeSettings(storeId, rowId, nextSettings, liveSync);
    if (error) return { success: false, error: "فشل تحديث الأقسام" };

    revalidatePath("/dashboard/themes/customize");
    return { success: true, error: null };
  } catch (err) {
    console.error("updateSectionsConfigAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

// ── 5. Upload Theme Asset ─────────────────────────────────────
// Uploads logo / hero / banner image to store-assets bucket
// Returns public URL
export async function uploadThemeAssetAction(
  fileBase64: string,
  fileName: string,
  fileType: string,
  assetType: "logo" | "hero" | "banner" | "favicon"
): Promise<{ url: string | null; error: string | null }> {
  try {
    if (!fileBase64 || !fileName) {
      return { url: null, error: "بيانات الملف غير مكتملة" };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(fileType)) {
      return { url: null, error: "صيغة الصورة غير مدعومة (JPG, PNG, WEBP فقط)" };
    }

    const base64Data = fileBase64.split(";base64,").pop();
    if (!base64Data) return { url: null, error: "محتوى الصورة غير صالح" };

    const fileBuffer = Buffer.from(base64Data, "base64");

    // Size limits per asset type
    const maxSizes: Record<string, number> = {
      logo: 2 * 1024 * 1024,    // 2MB
      favicon: 512 * 1024,      // 512KB
      hero: 5 * 1024 * 1024,    // 5MB
      banner: 4 * 1024 * 1024,  // 4MB
    };
    if (fileBuffer.length > (maxSizes[assetType] ?? 5 * 1024 * 1024)) {
      return { url: null, error: `حجم الصورة كبير جداً للـ ${assetType}` };
    }

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    const fileExt = fileName.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${storeId}/theme/${assetType}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("store-assets")
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Theme asset upload error:", uploadError);
      return { url: null, error: "فشل رفع الصورة: " + uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("store-assets").getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (err) {
    console.error("uploadThemeAssetAction error:", err);
    return { url: null, error: "حدث خطأ غير متوقع أثناء الرفع" };
  }
}

// ── 6. Get Extended Settings (for page.tsx) ──────────────────
export async function getExtendedThemeSettings(): Promise<{
  extended: ExtendedThemeSettings;
  hasDraft: boolean;
}> {
  try {
    const storeId = await getMerchantStoreId();
    const { extended } = await readSettings(storeId);
    return { extended, hasDraft: !!extended.draft_config };
  } catch {
    return { extended: {}, hasDraft: false };
  }
}
