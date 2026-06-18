import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPackages } from "@/actions/store";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إعداد متجرك",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if merchant already has a store
  const { data: existingStore } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingStore) {
    redirect("/dashboard");
  }

  // Fetch packages for the wizard
  const packages = await getPackages();

  return <OnboardingWizard packages={packages} />;
}
