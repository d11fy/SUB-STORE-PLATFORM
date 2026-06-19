import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BillingClient } from "./billing-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "الفواتير والاشتراك" };

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: storeData } = await supabase
    .from("stores")
    .select(`id, name, subscriptions (*), packages (*)`)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!storeData) redirect("/dashboard/onboarding");

  const store = storeData as any;
  const subscription = Array.isArray(store.subscriptions)
    ? store.subscriptions[0] ?? null
    : store.subscriptions ?? null;
  const pkg = Array.isArray(store.packages)
    ? store.packages[0] ?? null
    : store.packages ?? null;

  // Generate signed URL for existing proof + fetch request history in parallel
  const [proofResult, requestsResult] = await Promise.all([
    subscription?.payment_proof_url
      ? supabase.storage.from("payment-proofs").createSignedUrl(subscription.payment_proof_url, 3600)
      : Promise.resolve({ data: null }),
    supabase
      .from("payment_requests")
      .select("id, plan, status, transaction_number, notes, created_at, receipt_url")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const proofSignedUrl = (proofResult as any).data?.signedUrl ?? null;
  const requests = (requestsResult.data ?? []) as any[];

  return (
    <BillingClient
      subscription={subscription}
      pkg={pkg}
      storeName={store.name}
      proofSignedUrl={proofSignedUrl}
      requests={requests}
    />
  );
}
