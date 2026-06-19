"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, LayoutDashboard, Store, Users, Package,
  Crown, Sparkles, TrendingUp, ShieldAlert, ScrollText,
  Settings, ChevronLeft, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types/database";

// ============================================================
// NAV CONFIG
// ============================================================
const NAV_ITEMS = [
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

// ============================================================
// COMPONENT
// ============================================================
interface Props {
  user: User | null;
}

export function AdminMobileDrawer({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // SSR-safe portal mount
  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  // Auto-close on route change
  useEffect(() => { close(); }, [pathname, close]);

  // ESC key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); triggerRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open || !drawerRef.current) return;
    const drawer = drawerRef.current;
    const focusable = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
      )
    );
    focusable[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", trap);
    return () => window.removeEventListener("keydown", trap);
  }, [open]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Portal content — rendered at document.body to escape backdrop-filter ancestors
  const portal = mounted
    ? createPortal(
        <>
          {/* Overlay */}
          <div
            aria-hidden="true"
            onClick={close}
            className={cn(
              "fixed inset-0 z-[60] bg-black/40 md:hidden transition-opacity duration-200",
              open ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          />

          {/* Drawer */}
          <div
            ref={drawerRef}
            id="admin-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="قائمة التنقل"
            dir="rtl"
            className={cn(
              "fixed inset-y-0 right-0 z-[70] w-[280px] max-w-[85vw] md:hidden",
              "flex flex-col bg-white border-l border-slate-100",
              "shadow-[−4px_0_24px_rgba(0,0,0,0.08)]",
              "transition-transform duration-300",
              open ? "translate-x-0 ease-out" : "translate-x-full ease-in"
            )}
          >
            {/* Header row */}
            <div className="h-14 px-4 flex items-center justify-between shrink-0 border-b border-slate-100">
              <Link href="/" className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <span className="text-white font-cairo font-bold text-sm">أ</span>
                </div>
                <div className="min-w-0">
                  <p className="font-cairo font-bold text-slate-900 text-sm leading-none truncate">
                    إدارة المنصة
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Saba Store Admin</p>
                </div>
              </Link>
              <button
                onClick={close}
                aria-label="إغلاق القائمة"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Admin profile chip */}
            <div className="px-3 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name ?? ""}
                    className="w-8 h-8 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {user?.full_name ?? "المدير العام"}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav
              aria-label="قائمة الإدارة"
              className="flex-1 overflow-y-auto px-3 py-3 space-y-5 overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {NAV_ITEMS.map((group) => (
                <div key={group.group}>
                  <p className="text-[10px] font-semibold text-slate-400 px-3 mb-1.5 uppercase tracking-widest">
                    {group.group}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 rounded-xl min-h-[44px] text-sm font-medium transition-colors",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )}
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                active ? "text-primary" : "text-slate-400"
                              )}
                            />
                            <span className="flex-1">{item.label}</span>
                            {active && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-3 pb-6 pt-3 border-t border-slate-100 shrink-0">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 shrink-0 rtl-flip" />
                <span>العودة للوحة التاجر</span>
              </Link>
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      {/* Trigger button — stays in-tree */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        aria-label="فتح قائمة التنقل"
        aria-expanded={open}
        aria-controls="admin-mobile-drawer"
        aria-haspopup="dialog"
        className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg text-foreground hover:bg-sidebar-accent border border-border transition-colors shrink-0"
      >
        <Menu className="h-5 w-5" />
      </button>

      {portal}
    </>
  );
}
