import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ProductsClient } from "./products-client";
import { getStorefrontStore, getStorefrontCategories } from "@/lib/storefront/store-data";
import type { Metadata } from "next";

export const revalidate = 60;

interface ProductsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: store } = await supabase.from("stores").select("name").eq("slug", slug).maybeSingle();
  return {
    title: store ? `منتجات ${store.name} | سبأ ستور` : "المنتجات",
  };
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // Cached — layout.tsx already called this; zero extra DB query
  const store = await getStorefrontStore(slug);
  if (!store) notFound();

  // Categories cached — deduplicates with any prior call in this render cycle
  const [categories, productsResult] = await Promise.all([
    getStorefrontCategories(store.id),
    // Full fields needed for client-side sort/filter
    supabase
      .from("products")
      .select("*, product_images (*)")
      .eq("store_id", store.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-right">
        <h1 className="text-2xl font-black text-foreground font-cairo">كل المنتجات</h1>
        <p className="text-xs text-muted-foreground mt-1 font-cairo">
          تصفح كتالوج المنتجات الكامل المتوفر لدينا
        </p>
      </div>

      <ProductsClient
        products={productsResult.data || []}
        categories={categories}
        storeSlug={slug}
        currency={store.currency}
      />
    </div>
  );
}
