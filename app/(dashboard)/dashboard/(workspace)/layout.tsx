import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { MobileSidebarDrawer } from "@/components/dashboard/mobile-sidebar-drawer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "لوحة التحكم",
    template: "%s | سبأ ستور",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch merchant store
  const { data: storeData } = await supabase
    .from("stores")
    .select(`*, packages (*), subscriptions (*)`)
    .eq("owner_id", user.id)
    .maybeSingle();

  const store = storeData as any;

  // If merchant has no store, redirect to onboarding
  if (!store) {
    redirect("/dashboard/onboarding");
  }

  return (
    <div className="min-h-dvh bg-background flex">
      {/* Desktop Sidebar */}
      <DashboardSidebar store={store} user={profile} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          store={store}
          user={profile}
          mobileMenuSlot={
            <MobileSidebarDrawer store={store} user={profile} />
          }
        />
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
