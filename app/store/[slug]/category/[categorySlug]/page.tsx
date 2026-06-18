import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ProductsClient } from "../../products/products-client";
import type { Metadata } from "next";

interface CategoryPageProps {
  params: Promise<{ slug: string; categorySlug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const supabase = createAdminClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
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

  // Fetch store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("slug", slug)
    .maybeSingle();

  if (storeError || !store) {
    notFound();
  }

  // Fetch category first to validate it exists and is active
  const { data: currentCategory } = await supabase
    .from("categories")
    .select("*")
    .eq("store_id", store.id)
    .eq("slug", categorySlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!currentCategory) {
    notFound();
  }

  // Fetch all categories and products in parallel
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
        categories={categories || []}
        storeSlug={slug}
        currency={store.currency}
        initialCategoryId={currentCategory.id}
      />
    </div>
  );
}
