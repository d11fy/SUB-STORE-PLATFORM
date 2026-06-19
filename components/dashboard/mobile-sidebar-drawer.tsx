"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, LayoutDashboard, Package, Tag, ShoppingBag, CreditCard,
  Truck, Palette, Sparkles, Settings, Globe, Crown, FileText,
  Store, ChevronLeft, Bell, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Store as StoreType, User, Package as PackageType, Subscription } from "@/lib/types/database";

const navItems = [
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

interface Props {
  store: StoreType & { packages?: PackageType | null; subscriptions?: Subscription | null };
  user: User | null;
}

export function MobileSidebarDrawer({ store, user }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const pkg = store.packages as PackageType | null;

  return (
    <>
      {/* Mobile hamburger trigger */}
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

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-sidebar border-l border-sidebar-border flex flex-col md:hidden",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-cairo font-bold text-sm">
              س
            </div>
            <span className="font-cairo font-bold text-foreground text-sm">سبأ ستور</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Store info */}
        <div className="px-3 py-3 border-b border-sidebar-border">
          <Link
            href={`/store/${store.slug}`}
            target="_blank"
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-sidebar-accent transition-colors group"
            onClick={() => setOpen(false)}
          >
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{store.name}</p>
              <p className="text-xs text-muted-foreground truncate">sabastore.com/{store.slug}</p>
            </div>
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground rtl-flip" />
          </Link>
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
                      isActive(item.href) && "active"
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

        {/* Package */}
        {pkg && (
          <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
            <Link
              href="/dashboard/subscription"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-sidebar-accent hover:bg-primary/10 transition-colors"
            >
              <Crown className="h-4 w-4 text-amber-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{pkg.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pkg.max_products === null ? "غير محدود" : `${pkg.max_products} منتج`}
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
