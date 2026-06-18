import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { CartClient } from "./cart-client";
import type { Metadata } from "next";

interface CartPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: store } = await supabase.from("stores").select("name").eq("slug", slug).maybeSingle();
  return {
    title: store ? `سلة المشتريات | ${store.name}` : "سلة المشتريات",
  };
}

export default async function CartPage({ params }: CartPageProps) {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="text-right">
        <h1 className="text-2xl font-black text-foreground">سلة المشتريات</h1>
        <p className="text-xs text-muted-foreground mt-1">راجع المنتجات التي قمت باختيارها قبل إتمام الطلب</p>
      </div>

      <CartClient storeSlug={slug} currency={store.currency} />
    </div>
  );
}
