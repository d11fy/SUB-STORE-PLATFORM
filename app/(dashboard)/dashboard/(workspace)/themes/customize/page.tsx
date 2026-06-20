import { getStoreThemeSettings } from "@/actions/themes";
import { getMerchantStoreWithPackage } from "@/actions/store-utils";
import { getExtendedThemeSettings } from "@/actions/theme-customizer";
import { getAiCredits } from "@/actions/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomizeClient } from "./customize-client";
import type { StoreWithTheme, ProductWithImages } from "@/components/storefront/themes/theme-types";
import type { Category } from "@/lib/types/database";

export const metadata = {
  title: "تخصيص المظهر",
};

export default async function CustomizePage() {
  const [store, { activeTheme, settings }, { extended, hasDraft }, creditsData] =
    await Promise.all([
      getMerchantStoreWithPackage(),
      getStoreThemeSettings(),
      getExtendedThemeSettings(),
      getAiCredits(),
    ]);

  const availableCredits = creditsData?.data?.remaining ?? 0;

  const storeWithTheme: StoreWithTheme = {
    ...store,
    themes: activeTheme,
  };

  const adminDb = createAdminClient();

  // Fetch real categories and products with images for the live preview
  const [{ data: rawCategories }, { data: rawProducts }] = await Promise.all([
    adminDb
      .from("categories")
      .select("id, name, slug, description, image_url, is_active, parent_id, sort_order, store_id, created_at, updated_at")
      .eq("store_id", store.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(8),
    adminDb
      .from("products")
      .select("id, name, description, price, compare_price, slug, is_featured, is_active, track_inventory, stock_quantity, product_type, store_id, category_id, tags, created_at, updated_at, product_images (id, url, is_primary)")
      .eq("store_id", store.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const categories: Category[] =
    rawCategories && rawCategories.length > 0
      ? (rawCategories as Category[])
      : [
          {
            id: "mock-1",
            name: "ملابس",
            slug: "clothes",
            description: null,
            image_url: null,
            is_active: true,
            parent_id: null,
            sort_order: 0,
            store_id: store.id,
            created_at: "",
            updated_at: "",
          },
          {
            id: "mock-2",
            name: "إكسسوارات",
            slug: "accessories",
            description: null,
            image_url: null,
            is_active: true,
            parent_id: null,
            sort_order: 1,
            store_id: store.id,
            created_at: "",
            updated_at: "",
          },
          {
            id: "mock-3",
            name: "جديد",
            slug: "new",
            description: null,
            image_url: null,
            is_active: true,
            parent_id: null,
            sort_order: 2,
            store_id: store.id,
            created_at: "",
            updated_at: "",
          },
        ];

  const products: ProductWithImages[] =
    rawProducts && rawProducts.length > 0
      ? (rawProducts as unknown as ProductWithImages[])
      : [
          {
            id: "mock-p1",
            name: "منتج نموذجي",
            description: "وصف المنتج يظهر هنا في المعاينة",
            short_description: null,
            price: 120,
            compare_price: 180,
            slug: "mock-product-1",
            is_featured: true,
            is_active: true,
            is_digital: false,
            track_inventory: false,
            stock_quantity: 0,
            product_type: "physical" as const,
            subscription_duration_value: null,
            subscription_duration_unit: null,
            weight: null,
            sku: null,
            barcode: null,
            meta_title: null,
            meta_description: null,
            attributes: {},
            store_id: store.id,
            category_id: null,
            tags: [],
            created_at: "",
            updated_at: "",
            product_images: [],
          },
          {
            id: "mock-p2",
            name: "منتج آخر للعرض",
            description: null,
            short_description: null,
            price: 75,
            compare_price: null,
            slug: "mock-product-2",
            is_featured: false,
            is_active: true,
            is_digital: false,
            track_inventory: false,
            stock_quantity: 0,
            product_type: "physical" as const,
            subscription_duration_value: null,
            subscription_duration_unit: null,
            weight: null,
            sku: null,
            barcode: null,
            meta_title: null,
            meta_description: null,
            attributes: {},
            store_id: store.id,
            category_id: null,
            tags: [],
            created_at: "",
            updated_at: "",
            product_images: [],
          },
        ];

  // key forces client remount when draft state changes (after publish/discard/AI apply)
  // draft_saved_at changes on every draft write, so the form reinitialises even when
  // hasDraft was already true (e.g. applying a new AI theme over an existing draft).
  const clientKey = `${hasDraft ? "draft" : "live"}-${extended.draft_saved_at ?? extended.published_at ?? "none"}`;

  // live CSS is in the top-level DB column (single source of truth)
  const liveCss = settings?.custom_css ?? "";
  const draftCss = extended.custom_css_draft ?? "";

  return (
    <CustomizeClient
      key={clientKey}
      store={storeWithTheme}
      activeTheme={activeTheme}
      initialSettings={settings!}
      extended={extended}
      hasDraft={hasDraft}
      categories={categories}
      products={products}
      packageData={store.packages}
      availableCredits={availableCredits}
      liveCss={liveCss}
      draftCss={draftCss}
    />
  );
}
