"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, LayoutDashboard, Package, Tag, ShoppingBag,
  CreditCard, Truck, Palette, Sparkles, Settings, Globe,
  Crown, FileText, Store, ChevronLeft, Bell, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Store as StoreType, User, Package as PackageType, Subscription } from "@/lib/types/database";

// ============================================================
// NAV CONFIG
// ============================================================
const NAV_ITEMS = [
  {
    group: "الرئيسية",
    items: [
      { label: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
      { label: "الإشعارات", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    group: "المتجر",
    items: [
      { label: "المنتجات", href: "/dashboard/products", icon: Package },
      { label: "التصنيفات", href: "/dashboard/categories", icon: Tag },
      { label: "الطلبات", href: "/dashboard/orders", icon: ShoppingBag },
      { label: "العملاء", href: "/dashboard/customers", icon: Users },
      { label: "الصفحات", href: "/dashboard/pages", icon: FileText },
    ],
  },
  {
    group: "الإعدادات",
    items: [
      { label: "طرق الدفع", href: "/dashboard/payments", icon: CreditCard },
      { label: "الشحن", href: "/dashboard/shipping", icon: Truck },
      { label: "الثيمات", href: "/dashboard/themes", icon: Palette },
      { label: "الذكاء الاصطناعي", href: "/dashboard/ai", icon: Sparkles },
    ],
  },
  {
    group: "الحساب",
    items: [
      { label: "إعدادات المتجر", href: "/dashboard/settings", icon: Settings },
      { label: "النطاق المخصص", href: "/dashboard/domain", icon: Globe },
      { label: "الاشتراك والباقة", href: "/dashboard/subscription", icon: Crown },
      { label: "الفواتير والدفع", href: "/dashboard/billing", icon: CreditCard },
    ],
  },
];

// ============================================================
// PROPS
// ============================================================
interface Props {
  store: StoreType & { packages?: PackageType | null; subscriptions?: Subscription | null };
  user: User | null;
}

// ============================================================
// COMPONENT
// ============================================================
export function MobileSidebarDrawer({ store, user }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // SSR-safe: portal only mounts after hydration
  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  // Auto-close on route change (covers browser back/forward too)
  useEffect(() => { close(); }, [pathname, close]);

  // ESC key — return focus to trigger on close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); triggerRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Body scroll lock — prevents content scrolling behind drawer
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Focus trap — keeps keyboard focus inside open drawer
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
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const pkg = store.packages as PackageType | null;

  // Portal — rendered at document.body to escape backdrop-filter stacking context on the header
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

          {/* Drawer panel */}
          <div
            ref={drawerRef}
            id="dashboard-mobile-drawer"
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
                  <span className="text-white font-cairo font-bold text-sm">س</span>
                </div>
                <span className="font-cairo font-bold text-slate-900 text-sm truncate">سبأ ستور</span>
              </Link>
              <button
                onClick={close}
                aria-label="إغلاق القائمة"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Store chip */}
            <div className="px-3 py-3 border-b border-slate-100 shrink-0">
              <a
                href={`/store/${store.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
              >
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-8 h-8 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{store.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">sabastore.com/{store.slug}</p>
                </div>
                <ChevronLeft className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors rtl-flip shrink-0" />
              </a>
            </div>

            {/* Navigation */}
            <nav
              aria-label="قائمة لوحة التحكم"
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

            {/* Footer: package pill */}
            {pkg && (
              <div className="px-3 pb-6 pt-3 border-t border-slate-100 shrink-0">
                <Link
                  href="/dashboard/subscription"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors min-h-[44px]"
                >
                  <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-amber-800 truncate">{pkg.name}</p>
                    <p className="text-[11px] text-amber-600">
                      {pkg.max_products === null ? "منتجات غير محدودة" : `${pkg.max_products} منتج`}
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      {/* Trigger button — stays in header tree */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        aria-label="فتح قائمة التنقل"
        aria-expanded={open}
        aria-controls="dashboard-mobile-drawer"
        aria-haspopup="dialog"
        className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg text-foreground hover:bg-sidebar-accent border border-border transition-colors shrink-0"
      >
        <Menu className="h-5 w-5" />
      </button>

      {portal}
    </>
  );
}
