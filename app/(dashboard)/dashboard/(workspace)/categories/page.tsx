// ============================================================
// Saba Store — Categories Page
// ============================================================
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId } from "@/actions/store-utils";
import { CategoriesClient } from "./categories-client";
import type { Metadata } from "next";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { LayoutGrid } from "lucide-react";

export const metadata: Metadata = {
  title: "إدارة التصنيفات",
  description: "عرض وإضافة وتعديل تصنيفات المتجر",
};

export default async function CategoriesPage() {
  let categories: any[] = [];
  let errorMsg: string | null = null;

  try {
    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .select(`
        *,
        products:products(count)
      `)
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    categories = data ?? [];
  } catch (err: any) {
    console.error("Error loading categories page:", err);
    errorMsg = "فشل تحميل التصنيفات، يرجى المحاولة لاحقاً";
  }

  return (
    <div className="page-shell">
      <PremiumPageHeader
        icon={LayoutGrid}
        title="التصنيفات"
        description="قم بتنظيم منتجاتك في تصنيفات ليسهل على عملائك تصفح المتجر."
      />

      <CategoriesClient initialCategories={categories} initialError={errorMsg} />
    </div>
  );
}
