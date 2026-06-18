// ============================================================
// Saba Store — AI Tools Dashboard Page (Server Component)
// ============================================================
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AiToolsClient } from "./ai-tools-client";

export const metadata: Metadata = {
  title: "أدوات الذكاء الاصطناعي",
};

export default async function AiToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch store with package and AI credits
  const { data: storeData } = await supabase
    .from("stores")
    .select(`*, packages (*), ai_credits (*)`)
    .eq("owner_id", user.id)
    .single();

  const store = storeData as any;
  if (!store) redirect("/dashboard/onboarding");

  // Normalize AI credits
  const aiCreditsRaw = Array.isArray(store.ai_credits)
    ? store.ai_credits[0]
    : store.ai_credits;

  const aiCredits = aiCreditsRaw
    ? {
        total: aiCreditsRaw.credits_total ?? 0,
        used: aiCreditsRaw.credits_used ?? 0,
        remaining: (aiCreditsRaw.credits_total ?? 0) - (aiCreditsRaw.credits_used ?? 0),
        resetAt: aiCreditsRaw.reset_at ?? "",
      }
    : { total: 0, used: 0, remaining: 0, resetAt: "" };

  // Fetch recent generations
  const { data: generations } = await supabase
    .from("ai_generations")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const pkg = Array.isArray(store.packages) ? store.packages[0] : store.packages;

  return (
    <AiToolsClient
      store={store}
      packageInfo={pkg}
      aiCredits={aiCredits}
      recentGenerations={(generations as any[]) ?? []}
    />
  );
}
