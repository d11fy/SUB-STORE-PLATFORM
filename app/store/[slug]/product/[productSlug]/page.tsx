import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { ProductDetailClient } from "./product-detail-client";
import { ProductCard } from "../../components/product-card";
import type { Metadata } from "next";

interface ProductPageProps {
  params: Promise<{ slug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const supabase = createAdminClient();
  const { data: store } = await supabase.from("stores").select("id, name").eq("slug", slug).maybeSingle();
  if (!store) return { title: "تفاصيل المنتج" };

  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("store_id", store.id)
    .eq("slug", productSlug)
    .maybeSingle();

  return {
    title: product ? `${product.name} | ${store.name}` : "تفاصيل المنتج",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productSlug } = await params;
  const supabase = createAdminClient();

  // Fetch store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, currency, name")
    .eq("slug", slug)
    .maybeSingle();

  if (storeError || !store) {
    notFound();
  }

  // Fetch product with images
  const { data: product } = await supabase
    .from("products")
    .select(`*, product_images (*)`)
    .eq("store_id", store.id)
    .eq("slug", productSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) {
    notFound();
  }

  // Fetch category name + slug for breadcrumb
  let categoryName = "";
  let categorySlugStr = "";
  if (product.category_id) {
    const { data: category } = await supabase
      .from("categories")
      .select("name, slug")
      .eq("id", product.category_id)
      .maybeSingle();
    if (category) {
      categoryName = category.name;
      categorySlugStr = category.slug;
    }
  }

  // Fetch related products (same category, excluding current product)
  const { data: related } = await supabase
    .from("products")
    .select(`*, product_images (*)`)
    .eq("store_id", store.id)
    .eq("category_id", product.category_id ?? "")
    .eq("is_active", true)
    .neq("id", product.id)
    .limit(4);

  const prod = product as any;
  const relatedList = (related as any) || [];

  const primaryImage =
    prod.product_images?.find((img: any) => img.is_primary)?.url ||
    prod.product_images?.[0]?.url ||
    null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground font-medium">
        <span className="text-foreground font-semibold">{prod.name}</span>
        <span>/</span>
        {prod.category_id && categorySlugStr && (
          <>
            <Link
              href={`/store/${slug}/category/${categorySlugStr}`}
              className="hover:text-foreground transition-colors"
            >
              {categoryName}
            </Link>
            <span>/</span>
          </>
        )}
        <Link href={`/store/${slug}/products`} className="hover:text-foreground transition-colors">
          المنتجات
        </Link>
        <span>/</span>
        <Link href={`/store/${slug}`} className="hover:text-foreground transition-colors">
          الرئيسية
        </Link>
      </div>

      {/* Grid: Details on Left, Images on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: Details */}
        <ProductDetailClient
          product={prod}
          storeSlug={slug}
          primaryImage={primaryImage}
          currency={store.currency}
        />

        {/* Right: Images Gallery */}
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-muted border border-border relative">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={prod.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-6xl">
                📦
              </div>
            )}
          </div>

          {/* Sub images (gallery) */}
          {prod.product_images && prod.product_images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {prod.product_images.map((img: any) => (
                <div
                  key={img.id}
                  className="aspect-square rounded-xl overflow-hidden bg-muted border border-border hover:border-primary/50 transition-all cursor-pointer"
                >
                  <img src={img.url} alt={prod.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RELATED PRODUCTS ── */}
      {relatedList.length > 0 && (
        <div className="space-y-6 border-t border-border pt-12">
          <div className="text-right">
            <h2 className="text-xl font-bold text-foreground font-cairo">منتجات مشابهة قد تعجبك</h2>
            <p className="text-xs text-muted-foreground mt-1">منتجات مقترحة من نفس التصنيف</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedList.map((p: any) => {
              const relImage =
                p.product_images?.find((img: any) => img.is_primary)?.url ||
                p.product_images?.[0]?.url ||
                null;
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  storeSlug={slug}
                  primaryImage={relImage}
                  currency={store.currency}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
