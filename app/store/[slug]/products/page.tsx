import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ProductsClient } from "./products-client";
import type { Metadata } from "next";

// Revalidate public product listing every 60 seconds (ISR)
export const revalidate = 60;

interface ProductsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: store } = await supabase
    .from("stores")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  return {
    title: store ? `منتجات ${store.name} | سبأ ستور` : "المنتجات",
  };
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // Fetch store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("slug", slug)
    .maybeSingle();

  if (storeError || !store) {
    notFound();
  }

  // Fetch categories and products in parallel
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-right">
        <h1 className="text-2xl font-black text-foreground font-cairo">كل المنتجات</h1>
        <p className="text-xs text-muted-foreground mt-1 font-cairo">
          تصفح كتالوج المنتجات الكامل المتوفر لدينا
        </p>
      </div>

      <ProductsClient
        products={products || []}
        categories={categories || []}
        storeSlug={slug}
        currency={store.currency}
      />
    </div>
  );
}
