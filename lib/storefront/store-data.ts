import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

// React.cache() deduplicates identical calls within one render cycle.
// layout.tsx and page.tsx both need store data — only ONE DB query fires per request.

export const getStorefrontStore = cache(async (slug: string) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .select(
      "id, name, slug, logo_url, cover_url, status, currency, email, phone, address, city, whatsapp, social_links, settings, themes(id, slug, name), store_theme_settings(*)"
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data;
});

export const getStorefrontPages = cache(async (storeId: string) => {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("store_pages")
    .select("id, title, slug, show_in_header, show_in_footer")
    .eq("store_id", storeId)
    .eq("status", "published")
    .order("created_at");
  return data ?? [];
});

// Homepage: 20 products with minimal fields — enough for featured + latest sections
export const getStorefrontProducts = cache(async (storeId: string, limit = 20) => {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, slug, price, compare_price, stock_quantity, track_inventory, is_featured, category_id, is_active, store_id, product_images(url, is_primary)"
    )
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as any[];
});

export const getStorefrontCategories = cache(async (storeId: string) => {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, description, is_active, sort_order")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as any[];
});
