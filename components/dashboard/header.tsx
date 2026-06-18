"use client";

import { Bell, LogOut, Settings, ExternalLink } from "lucide-react";
import { signOut } from "@/actions/auth";
import { cn, getInitials } from "@/lib/utils";
import type { Store as StoreType, User, Package as PackageType } from "@/lib/types/database";

interface DashboardHeaderProps {
  store: StoreType & { packages?: PackageType | null };
  user: User | null;
  mobileMenuSlot?: React.ReactNode;
}

export function DashboardHeader({ store, user, mobileMenuSlot }: DashboardHeaderProps) {
  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-sidebar/50 backdrop-blur-sm sticky top-0 z-10">
      {/* Left: Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3">
        {mobileMenuSlot}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm text-muted-foreground">متجر</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">{store.name}</span>
        </div>
      </div>

      {/* Right: Actions + User */}
      <div className="flex items-center gap-2">
        {/* View Store */}
        <a
          href={`/store/${store.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors border border-border"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          عرض المتجر
        </a>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors">
          <Bell className="h-5 w-5" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative group">
          <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-sidebar-accent transition-colors">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-cairo font-bold text-primary">
              {user?.full_name ? getInitials(user.full_name) : "م"}
            </div>
            <span className="hidden sm:block text-sm text-foreground max-w-[100px] truncate">
              {user?.full_name ?? "التاجر"}
            </span>
          </button>

          {/* Dropdown */}
          <div className={cn(
            "absolute left-0 top-full mt-2 w-48 rounded-xl",
            "bg-popover border border-border shadow-card-hover",
            "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
            "transition-all duration-200 translate-y-1 group-hover:translate-y-0",
            "z-50"
          )}>
            <div className="p-2 space-y-0.5">
              <a
                href="/dashboard/settings"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              >
                <Settings className="h-4 w-4" />
                إعدادات الحساب
              </a>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
