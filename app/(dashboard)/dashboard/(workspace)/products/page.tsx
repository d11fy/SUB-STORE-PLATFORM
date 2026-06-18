// ============================================================
// Saba Store — Products Page
// ============================================================
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId, getMerchantStoreWithPackage } from "@/actions/store-utils";
import { ProductsClient } from "./products-client";
import type { Metadata } from "next";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { Package } from "lucide-react";

export const metadata: Metadata = {
  title: "إدارة المنتجات",
  description: "عرض وإضافة وتعديل وحذف منتجات المتجر",
};

export default async function ProductsPage() {
  let products: any[] = [];
  let categories: any[] = [];
  let errorMsg: string | null = null;
  let store: any = null;

  try {
    const storeId = await getMerchantStoreId();
    store = await getMerchantStoreWithPackage();
    const supabase = await createClient();

    // Fetch categories for selection dropdowns
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("store_id", storeId)
      .order("name", { ascending: true });

    categories = categoriesData ?? [];

    // Fetch products
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select(`
        *,
        categories:category_id (*)
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (productsError) throw productsError;
    products = productsData ?? [];
  } catch (err: any) {
    console.error("Error loading products page:", err);
    errorMsg = "فشل تحميل المنتجات، يرجى المحاولة لاحقاً";
  }

  return (
    <div className="page-shell">
      <PremiumPageHeader
        icon={Package}
        title="المنتجات"
        description="أضف منتجاتك وحدد الأسعار والكميات المتاحة بكل سهولة."
      />

      <ProductsClient
        initialProducts={products}
        categories={categories}
        store={store}
        initialError={errorMsg}
      />
    </div>
  );
}
