// ============================================================
// Saba Store — D4 Safe Custom CSS: Server Actions
// Three-action draft/publish/discard cycle, independent of D1.
// CSS flows: saveCssDraftAction → publishCssDraftAction (live).
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId } from "./store-utils";
import type { ExtendedThemeSettings } from "@/lib/themes/customization-types";
import type { Json } from "@/lib/types/database";
import {
  sanitizeCustomCss,
  MAX_CUSTOM_CSS_CHARS,
} from "@/lib/themes/css-sanitizer";

// ── Internal helpers ──────────────────────────────────────────

async function readCssSettings(storeId: string): Promise<{
  rowId: string | null;
  extended: ExtendedThemeSettings;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_theme_settings")
    .select("id, settings")
    .eq("store_id", storeId)
    .maybeSingle();

  const extended = (data?.settings as ExtendedThemeSettings | null) ?? {};
  return { rowId: data?.id ?? null, extended };
}

// Writes only the JSONB settings column atomically (draft management).
async function writeCssSettings(
  storeId: string,
  rowId: string | null,
  extended: ExtendedThemeSettings
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const settingsObj: Record<string, any> = {};
  const keys: (keyof ExtendedThemeSettings)[] = [
    "sections_config",
    "header_config",
    "footer_config",
    "homepage_config",
    "draft_config",
    "published_at",
    "draft_saved_at",
    "custom_css_draft",
    "css_published_at",
  ];

  for (const key of keys) {
    const val = extended[key];
    settingsObj[key] = val === undefined ? null : val;
  }

  const { error: mergeError } = await (supabase as any).rpc("merge_theme_settings", {
    p_store_id: storeId,
    p_settings: settingsObj,
  });

  return { error: mergeError?.message ?? null };
}

// Writes sanitized CSS to the live top-level column (single source of truth).
async function writeLiveCss(
  storeId: string,
  css: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("store_theme_settings")
    .update({ custom_css: css || null })
    .eq("store_id", storeId);
  return { error: error?.message ?? null };
}

// ── 1. Save CSS Draft ─────────────────────────────────────────
// Sanitizes input and writes to settings.custom_css_draft.
// Does NOT affect the live storefront CSS.
export async function saveCssDraftAction(rawCss: string): Promise<{
  success: boolean;
  error: string | null;
  violations: string[];
}> {
  try {
    if (rawCss.length > MAX_CUSTOM_CSS_CHARS) {
      return {
        success: false,
        error: `CSS طويل جداً — الحد الأقصى ${MAX_CUSTOM_CSS_CHARS.toLocaleString("ar-EG")} حرف`,
        violations: [],
      };
    }

    const { css, violations } = sanitizeCustomCss(rawCss);

    const storeId = await getMerchantStoreId();
    const { rowId, extended } = await readCssSettings(storeId);

    const next: ExtendedThemeSettings = { ...extended, custom_css_draft: css };
    const { error } = await writeCssSettings(storeId, rowId, next);

    if (error) {
      return { success: false, error: "فشل حفظ مسودة CSS: " + error, violations };
    }

    revalidatePath("/dashboard/themes/customize");
    return { success: true, error: null, violations };
  } catch (err) {
    console.error("saveCssDraftAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع", violations: [] };
  }
}

// ── 2. Publish CSS Draft ──────────────────────────────────────
// Promotes custom_css_draft → store_theme_settings.custom_css (top-level column).
// The top-level column is the single source of truth for live CSS — the same
// pattern used by publishThemeDraftAction for colors/font.
// Also clears custom_css_draft from JSONB to signal no pending draft.
export async function publishCssDraftAction(): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const storeId = await getMerchantStoreId();
    const { rowId, extended } = await readCssSettings(storeId);

    if (extended.custom_css_draft === undefined) {
      return { success: false, error: "لا توجد مسودة CSS للنشر" };
    }

    const livecss = extended.custom_css_draft;

    // 1. Write to top-level column — this is what the storefront reads
    const { error: liveError } = await writeLiveCss(storeId, livecss);
    if (liveError) return { success: false, error: "فشل نشر CSS: " + liveError };

    // 2. Clear draft from JSONB and record publish timestamp for cache-busting
    const next: ExtendedThemeSettings = {
      ...extended,
      custom_css_draft: undefined,
      css_published_at: new Date().toISOString(),
    };
    const { error: draftError } = await writeCssSettings(storeId, rowId, next);
    if (draftError) return { success: false, error: "فشل مسح مسودة CSS: " + draftError };

    revalidatePath("/dashboard/themes/customize");

    const supabase = await createClient();
    const { data } = await supabase
      .from("stores")
      .select("slug")
      .eq("id", storeId)
      .single();
    if (data?.slug) {
      revalidatePath(`/store/${data.slug}`);
      revalidatePath(`/store/${data.slug}/theme.css`);
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("publishCssDraftAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

// ── 3. Discard CSS Draft ──────────────────────────────────────
// Clears custom_css_draft without touching live custom_css.
export async function discardCssDraftAction(): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const storeId = await getMerchantStoreId();
    const { rowId, extended } = await readCssSettings(storeId);

    if (!extended.custom_css_draft) {
      return { success: true, error: null };
    }

    const next: ExtendedThemeSettings = {
      ...extended,
      custom_css_draft: undefined,
    };

    const { error } = await writeCssSettings(storeId, rowId, next);
    if (error) return { success: false, error: "فشل تجاهل مسودة CSS" };

    revalidatePath("/dashboard/themes/customize");
    return { success: true, error: null };
  } catch (err) {
    console.error("discardCssDraftAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}
