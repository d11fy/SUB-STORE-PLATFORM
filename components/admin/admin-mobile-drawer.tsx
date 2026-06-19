"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, LayoutDashboard, Store, Users, Package,
  Crown, Sparkles, TrendingUp, ShieldAlert, ScrollText,
  Settings, ChevronLeft, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types/database";

const navItems = [
  {
    group: "عام",
    items: [
      { label: "نظرة عامة", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    group: "إدارة المنصة",
    items: [
      { label: "المتاجر", href: "/admin/stores", icon: Store },
      { label: "المستخدمون", href: "/admin/users", icon: Users },
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
    group: "التحليلات",
    items: [
      { label: "الإيرادات", href: "/admin/revenue", icon: TrendingUp },
      { label: "أرصدة AI", href: "/admin/ai-credits", icon: Sparkles },
      { label: "استخدام AI", href: "/admin/ai-usage", icon: Sparkles },
    ],
  },
  {
    group: "النظام",
    items: [
      { label: "مراقبة المنصة", href: "/admin/monitoring", icon: Activity },
      { label: "مركز الأمان", href: "/admin/security", icon: ShieldAlert },
      { label: "سجلات المنصة", href: "/admin/logs", icon: ScrollText },
      { label: "إعدادات المنصة", href: "/admin/settings", icon: Settings },
    ],
  },
];

interface Props {
  user: User | null;
}

export function AdminMobileDrawer({ user }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Hamburger trigger — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg text-foreground hover:bg-sidebar-accent border border-border transition-colors min-h-9 min-w-9 flex items-center justify-center shrink-0"
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer — slides in from right (RTL) */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-sidebar border-l border-sidebar-border flex flex-col md:hidden",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-cairo font-bold text-sm">
              أ
            </div>
            <div>
              <p className="font-cairo font-bold text-foreground text-sm leading-tight">إدارة المنصة</p>
              <p className="text-xs text-muted-foreground">Saba Store Admin</p>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Admin profile */}
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
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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
                    onClick={() => setOpen(false)}
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

        {/* Back to merchant dashboard */}
        <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 shrink-0 rtl-flip" />
            <span className="text-sm font-medium">العودة للوحة التاجر</span>
          </Link>
        </div>
      </div>
    </>
  );
}
