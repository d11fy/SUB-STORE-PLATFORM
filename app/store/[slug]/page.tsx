import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ThemeRenderer } from "@/components/storefront/themes/theme-renderer";

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

const SAFE_THEME_SETTINGS_FALLBACK = {
  id: "",
  primary_color: "#1B4FD8",
  secondary_color: "#7C3AED",
  accent_color: "#F59E0B",
  font_family: "Cairo",
  hero_title: "",
  hero_subtitle: "",
  hero_image_url: "",
  logo_url: null,
  favicon_url: null,
  sections_order: ["hero", "categories", "featured", "banner", "products"],
  hidden_sections: [],
  footer_content: "",
  custom_css: null,
  custom_html: {},
  settings: {},
  updated_at: new Date().toISOString(),
};

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // Fetch store, active theme, and theme settings
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*, themes (*), store_theme_settings (*)")
    .eq("slug", slug)
    .maybeSingle();

  if (storeError || !store) {
    notFound();
  }

  // Fetch categories and products in parallel — both depend on store.id but not each other
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("store_id", store.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select(`*, product_images (*)`)
      .eq("store_id", store.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // Parse theme settings safely — never let a bad JSONB crash the storefront
  const rawThemeSettings = store.store_theme_settings;
  const settingsData = Array.isArray(rawThemeSettings)
    ? rawThemeSettings[0]
    : rawThemeSettings;

  const themeSettings = settingsData
    ? { ...SAFE_THEME_SETTINGS_FALLBACK, store_id: store.id, ...settingsData }
    : { ...SAFE_THEME_SETTINGS_FALLBACK, store_id: store.id };

  return (
    <ThemeRenderer
      store={store as any}
      categories={categories || []}
      products={(products as any) || []}
      settings={themeSettings as any}
    />
  );
}
