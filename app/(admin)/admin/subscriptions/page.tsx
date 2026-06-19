import { getAdminSubscriptions } from "@/actions/admin";
import { SubscriptionsClient } from "./subscriptions-client";
import { Crown } from "lucide-react";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الاشتراكات | سبأ ستور",
};

export default async function AdminSubscriptionsPage() {
  const subscriptions = await getAdminSubscriptions();

  // Generate signed URLs for payment proofs
  const supabase = createAdminClient();
  const subscriptionsWithUrls = await Promise.all(
    subscriptions.map(async (sub: any) => {
      if (sub.payment_proof_url) {
        const { data } = await supabase.storage
          .from("payment-proofs")
          .createSignedUrl(sub.payment_proof_url, 3600);
        return { ...sub, proofSignedUrl: data?.signedUrl ?? null };
      }
      return { ...sub, proofSignedUrl: null };
    })
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">الاشتراكات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مراجعة طلبات الدفع وتفعيل / رفض الاشتراكات
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
            قيد المراجعة: {subscriptionsWithUrls.filter((s: any) => s.status === "pending").length}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
            نشط: {subscriptionsWithUrls.filter((s: any) => s.status === "active").length}
          </span>
        </div>
      </div>

      {subscriptionsWithUrls.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-cairo font-bold text-foreground mb-2">لا توجد اشتراكات</h3>
          <p className="text-muted-foreground text-sm">لم يقم أي متجر بالتسجيل حتى الآن.</p>
        </div>
      ) : (
        <SubscriptionsClient subscriptions={subscriptionsWithUrls} />
      )}
    </div>
  );
}
