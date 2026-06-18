import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminMobileDrawer } from "@/components/admin/admin-mobile-drawer";

export const dynamic = "force-dynamic";

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get current user profile (which includes role)
  const user = await getCurrentUser();

  // 2. Protect route: strictly check for platform_admin role
  if (!user || user.role !== "platform_admin") {
    redirect(user ? "/dashboard" : "/login");
  }

  // 3. Render Admin Layout
  return (
    <div className="flex min-h-dvh bg-background" dir="rtl">
      {/* Desktop sidebar — hidden on mobile */}
      <AdminSidebar user={user} />

      <div className="flex-1 flex flex-col min-h-dvh overflow-hidden relative">
        {/* Mobile header — only visible on mobile */}
        <AdminHeader
          mobileMenuSlot={<AdminMobileDrawer user={user} />}
        />

        <main className="flex-1 overflow-y-auto no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
