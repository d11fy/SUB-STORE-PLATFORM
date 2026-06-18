// ============================================================
// Saba Store — Merchant Dashboard Orders Page
// ============================================================
import { getMerchantOrders } from "@/actions/orders";
import { getMerchantStoreWithPackage } from "@/actions/store-utils";
import { OrdersClient } from "./orders-client";
import type { Metadata } from "next";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { ShoppingCart } from "lucide-react";

export const metadata: Metadata = {
  title: "إدارة الطلبات",
  description: "متابعة وإدارة طلبات العملاء وإثباتات الدفع والمبيعات",
};

export default async function OrdersPage() {
  let orders: any[] = [];
  let errorMsg: string | null = null;
  let store: any = null;

  try {
    store = await getMerchantStoreWithPackage();
    const { data: ordersData, error: ordersError } = await getMerchantOrders();

    if (ordersError) throw ordersError;
    orders = ordersData ?? [];
  } catch (err: any) {
    console.error("Error loading orders page:", err);
    errorMsg = "فشل تحميل الطلبات، يرجى المحاولة لاحقاً";
  }

  return (
    <div className="page-shell">
      <PremiumPageHeader
        icon={ShoppingCart}
        title="الطلبات"
        description="تابع طلبات عملائك، تحقق من إثباتات الدفع البنكية، وحدّث حالات التجهيز والشحن."
      />

      <OrdersClient
        initialOrders={orders}
        store={store}
        initialError={errorMsg}
      />
    </div>
  );
}
