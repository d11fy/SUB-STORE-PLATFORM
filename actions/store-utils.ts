// ============================================================
// Saba Store — Store Retrieval & Security Utilities
// ============================================================
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Store, Package, Subscription } from "@/lib/types/database";

export async function getMerchantStoreId(): Promise<string> {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: store, error } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !store) {
    redirect("/dashboard/onboarding");
  }

  return store.id;
}

export async function getMerchantStoreWithPackage(): Promise<
  Store & {
    packages: Package | null;
    subscriptions: Subscription | null;
  }
> {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: store, error } = await supabase
    .from("stores")
    .select(`*, subscriptions:subscriptions (*)`)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !store) {
    redirect("/dashboard/onboarding");
  }

  // Fetch package details using admin client to bypass packages table RLS
  let packages: Package | null = null;
  if (store.package_id) {
    const adminDb = createAdminClient();
    const { data: pkgData } = await adminDb
      .from("packages")
      .select("*")
      .eq("id", store.package_id)
      .maybeSingle();
    packages = pkgData;
  }

  const subscriptions = Array.isArray(store.subscriptions) ? store.subscriptions[0] : store.subscriptions;

  return {
    ...(store as any),
    packages: packages,
    subscriptions: subscriptions ?? null,
  };
}
