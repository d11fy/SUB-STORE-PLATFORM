"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  Crown,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types/database";

const navItems = [
  {
    group: "الإدارة العامة",
    items: [
      { label: "لوحة تحكم المنصة", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    group: "إدارة المنصة",
    items: [
      { label: "المتاجر", href: "/admin/stores", icon: Store },
      { label: "التجار", href: "/admin/merchants", icon: Users },
    ],
  },
  {
    group: "الاشتراكات",
    items: [
      { label: "الباقات", href: "/admin/packages", icon: Package },
      { label: "الاشتراكات", href: "/admin/subscriptions", icon: Crown },
    ],
  },
  {
    group: "أدوات متقدمة",
    items: [
      { label: "أرصدة الذكاء الاصطناعي", href: "/admin/ai-credits", icon: Sparkles },
    ],
  },
];

interface AdminSidebarProps {
  user: User | null;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar border-l border-sidebar-border min-h-dvh">
      {/* Logo / Brand */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-cairo font-bold shadow-sm text-sm">
            أ
          </div>
          <div>
            <p className="font-cairo font-bold text-foreground text-sm leading-tight">
              إدارة المنصة
            </p>
            <p className="text-xs text-muted-foreground">Saba Store Admin</p>
          </div>
        </Link>
      </div>

      {/* Admin Profile */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-sidebar-accent">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || ""}
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.full_name || "المدير العام"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 no-scrollbar">
        {navItems.map((group) => (
          <div key={group.group}>
            <p className="text-xs font-medium text-muted-foreground/60 px-2 mb-1.5 uppercase tracking-wider">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "sidebar-item",
                    isActive(item.href) && "active bg-primary/10 text-primary border-primary"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-3 border-t border-sidebar-border pt-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 shrink-0 rtl-flip" />
          <span className="text-sm font-medium">العودة للوحة التاجر</span>
        </Link>
      </div>
    </aside>
  );
}
