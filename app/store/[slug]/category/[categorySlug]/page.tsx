import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ProductsClient } from "../../products/products-client";
import { getStorefrontStore, getStorefrontCategories } from "@/lib/storefront/store-data";
import type { Metadata } from "next";

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string; categorySlug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const supabase = createAdminClient();
  const { data: store } = await supabase.from("stores").select("id, name").eq("slug", slug).maybeSingle();
  if (!store) return { title: "التصنيف" };

  const { data: category } = await supabase
    .from("categories")
    .select("name")
    .eq("store_id", store.id)
    .eq("slug", categorySlug)
    .maybeSingle();

  return {
    title: category ? `${category.name} | ${store.name}` : "التصنيف",
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug, categorySlug } = await params;
  const supabase = createAdminClient();

  // Cached — layout.tsx already called this; zero extra DB query
  const store = await getStorefrontStore(slug);
  if (!store) notFound();

  // Categories cached — find current one from the list (no extra DB query for validation)
  const categories = await getStorefrontCategories(store.id);
  const currentCategory = categories.find((c: any) => c.slug === categorySlug);
  if (!currentCategory) notFound();

  // Products: full fields needed for client-side filtering
  const { data: products } = await supabase
    .from("products")
    .select("*, product_images (*)")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-right">
        <h1 className="text-2xl font-black text-foreground font-cairo">
          قسم: {currentCategory.name}
        </h1>
        {currentCategory.description && (
          <p className="text-xs text-muted-foreground mt-1 font-cairo">
            {currentCategory.description}
          </p>
        )}
      </div>

      <ProductsClient
        products={products || []}
        categories={categories}
        storeSlug={slug}
        currency={store.currency}
        initialCategoryId={currentCategory.id}
      />
    </div>
  );
}
