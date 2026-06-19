import { getAdminPaymentRequests } from "@/actions/payment-requests";
import { getAdminSubscriptions } from "@/actions/admin";
import { PaymentRequestsClient } from "./payment-requests-client";
import { Crown } from "lucide-react";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الاشتراكات والمدفوعات | سبأ ستور",
};

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string; q?: string; tab?: string }>;
}

export default async function AdminSubscriptionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const statusFilter = sp.status ?? "all";
  const search = sp.q ?? "";
  const tab = sp.tab ?? "requests";

  const [requestsResult, subscriptions] = await Promise.all([
    getAdminPaymentRequests(page, statusFilter, search),
    getAdminSubscriptions(),
  ]);

  // Generate signed URLs for receipts
  const supabase = createAdminClient();
  const requestsWithUrls = await Promise.all(
    requestsResult.data.map(async (req: any) => {
      if (req.receipt_url) {
        const { data } = await supabase.storage
          .from("payment-proofs")
          .createSignedUrl(req.receipt_url, 3600);
        return { ...req, receiptSignedUrl: data?.signedUrl ?? null };
      }
      return { ...req, receiptSignedUrl: null };
    })
  );

  const pendingCount = requestsResult.data.filter((r: any) => r.status === "pending").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">الاشتراكات والمدفوعات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            مراجعة طلبات الدفع وإدارة اشتراكات المتاجر
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {pendingCount} طلب بانتظار المراجعة
          </span>
        )}
      </div>

      <PaymentRequestsClient
        requests={requestsWithUrls}
        subscriptions={subscriptions}
        totalCount={requestsResult.count}
        currentPage={page}
        statusFilter={statusFilter}
        search={search}
        tab={tab}
      />
    </div>
  );
}
