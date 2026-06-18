// ============================================================
// Saba Store — Shipping Methods Configuration Page
// ============================================================
import { getShippingMethods } from "@/actions/shipping";
import { getMerchantStoreWithPackage } from "@/actions/store-utils";
import { ShippingClient } from "./shipping-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إعدادات الشحن والتوصيل",
  description: "تهيئة خيارات الشحن والتوصيل لمتجرك والمدن المدعومة",
};

export default async function ShippingPage() {
  const { data: methods, error } = await getShippingMethods();
  const store = await getMerchantStoreWithPackage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-cairo font-bold text-foreground">
          الشحن والتوصيل
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          قم بتهيئة خيارات الشحن (سعر ثابت، شحن مجاني، استلام من المتجر، أو تسعير حسب المدينة).
        </p>
      </div>

      <ShippingClient
        initialMethods={methods ?? []}
        store={store}
        initialError={error}
      />
    </div>
  );
}
