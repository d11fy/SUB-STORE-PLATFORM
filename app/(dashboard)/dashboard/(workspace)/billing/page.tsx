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

  // Generate signed URL for existing proof if any
  let proofSignedUrl: string | null = null;
  if (subscription?.payment_proof_url) {
    const { data: signed } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(subscription.payment_proof_url, 3600);
    proofSignedUrl = signed?.signedUrl ?? null;
  }

  return (
    <BillingClient
      subscription={subscription}
      pkg={pkg}
      storeName={store.name}
      proofSignedUrl={proofSignedUrl}
    />
  );
}
