// ============================================================
// Saba Store — Order Details Dashboard Page
// ============================================================
import { getMerchantOrderDetails } from "@/actions/orders";
import { getMerchantStoreWithPackage } from "@/actions/store-utils";
import { notFound } from "next/navigation";
import { OrderDetailsClient } from "./order-details-client";
import type { Metadata } from "next";

interface OrderDetailsPageProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: OrderDetailsPageProps): Promise<Metadata> {
  const { orderId } = await params;
  return {
    title: `تفاصيل الطلب | سبأ ستور`,
  };
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { orderId } = await params;
  
  const { data: order, error } = await getMerchantOrderDetails(orderId);
  const store = await getMerchantStoreWithPackage();

  if (error || !order) {
    return (
      <div className="glass-card py-16 text-center space-y-4 max-w-2xl mx-auto mt-10">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto text-destructive">
          ⚠️
        </div>
        <div>
          <p className="text-base font-cairo font-semibold text-foreground">
            فشل تحميل تفاصيل الطلب
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {error || "الطلب المطلوب غير موجود أو غير مصرح لك بالوصول إليه."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OrderDetailsClient order={order} store={store} />
    </div>
  );
}
