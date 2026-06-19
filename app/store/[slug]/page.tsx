import { notFound } from "next/navigation";
import { ThemeRenderer } from "@/components/storefront/themes/theme-renderer";
import {
  getStorefrontStore,
  getStorefrontProducts,
  getStorefrontCategories,
} from "@/lib/storefront/store-data";

// ISR: revalidate every 60 seconds — serves cached HTML to most visitors
export const revalidate = 60;

const THEME_SETTINGS_FALLBACK = {
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

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;

  // getStorefrontStore is memoized with React.cache() — layout.tsx already called it,
  // so this returns the cached result with zero additional DB queries.
  const store = await getStorefrontStore(slug);
  if (!store) notFound();

  // Parallel fetch: categories and products — both only need store.id
  const [categories, products] = await Promise.all([
    getStorefrontCategories(store.id),
    // Homepage shows ~20 products — the theme slices to featured/latest subsets
    getStorefrontProducts(store.id, 20),
  ]);

  const rawThemeSettings = store.store_theme_settings;
  const settingsData = Array.isArray(rawThemeSettings) ? rawThemeSettings[0] : rawThemeSettings;
  const themeSettings = settingsData
    ? { ...THEME_SETTINGS_FALLBACK, store_id: store.id, ...settingsData }
    : { ...THEME_SETTINGS_FALLBACK, store_id: store.id };

  return (
    <ThemeRenderer
      store={store as any}
      categories={categories}
      products={products}
      settings={themeSettings as any}
    />
  );
}
