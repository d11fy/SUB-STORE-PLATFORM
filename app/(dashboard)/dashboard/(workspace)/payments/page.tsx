// ============================================================
// Saba Store — Payment Methods Configuration Page
// ============================================================
import { getPaymentMethods } from "@/actions/payments";
import { PaymentsClient } from "./payments-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إعدادات طرق الدفع",
  description: "تهيئة طرق الدفع المحلية والمحافظ الرقمية لمتجرك",
};

export default async function PaymentsPage() {
  const { data: methods, error } = await getPaymentMethods();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-cairo font-bold text-foreground">
          طرق الدفع
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          قم بتهيئة الحسابات البنكية والمحافظ الإلكترونية المحلية التي سيقوم عملائك بالتحويل إليها.
        </p>
      </div>

      <PaymentsClient initialMethods={methods ?? []} initialError={error} />
    </div>
  );
}
