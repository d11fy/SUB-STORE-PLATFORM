"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  CreditCard,
  Truck,
  Palette,
  Sparkles,
  Settings,
  Globe,
  Users,
  Bell,
  ChevronLeft,
  Store,
  Crown,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Store as StoreType, User, Package as PackageType, Subscription } from "@/lib/types/database";

// ============================================================
// NAV ITEMS
// ============================================================
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
      { label: "أدوات الذكاء الاصطناعي", href: "/dashboard/ai", icon: Sparkles },
    ],
  },
  {
    group: "الحساب",
    items: [
      { label: "إعدادات المتجر", href: "/dashboard/settings", icon: Settings },
      { label: "النطاق المخصص", href: "/dashboard/domain", icon: Globe },
      { label: "الاشتراك", href: "/dashboard/subscription", icon: Crown },
    ],
  },
];

// ============================================================
// TYPES
// ============================================================
interface DashboardSidebarProps {
  store: StoreType & {
    packages?: PackageType | null;
    subscriptions?: Subscription | null;
  };
  user: User | null;
}

// ============================================================
// COMPONENT
// ============================================================
export function DashboardSidebar({ store, user }: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const pkg = store.packages;

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar border-l border-sidebar-border min-h-dvh">
      {/* Logo / Brand */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-cairo font-bold shadow-brand text-sm">
            س
          </div>
          <div>
            <p className="font-cairo font-bold text-foreground text-sm leading-tight">
              سبأ ستور
            </p>
            <p className="text-xs text-muted-foreground">لوحة التحكم</p>
          </div>
        </Link>
      </div>

      {/* Store Info */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <Link
          href={`/store/${store.slug}`}
          target="_blank"
          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-sidebar-accent transition-colors group"
        >
          {store.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {store.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              sabastore.com/{store.slug}
            </p>
          </div>
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors rtl-flip" />
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

      {/* Bottom: Package Info */}
      {pkg && (
        <div className="px-3 pb-3 border-t border-sidebar-border pt-3">
          <Link
            href="/dashboard/subscription"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-sidebar-accent hover:bg-primary/10 transition-colors group"
          >
            <Crown className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {pkg.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {pkg.max_products === null ? "غير محدود" : `${pkg.max_products} منتج`}
              </p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
