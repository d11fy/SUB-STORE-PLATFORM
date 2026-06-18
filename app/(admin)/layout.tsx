import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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
    // If not admin, redirect them to the safe merchant dashboard
    // If not logged in, getCurrentUser returns null, so it redirects to login
    redirect(user ? "/dashboard" : "/login");
  }

  // 3. Render Admin Layout
  return (
    <div className="flex min-h-dvh bg-background" dir="rtl">
      <AdminSidebar user={user} />
      <div className="flex-1 flex flex-col min-h-dvh overflow-hidden relative">
        <main className="flex-1 overflow-y-auto no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
