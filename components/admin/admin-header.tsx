"use client";

import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

interface AdminHeaderProps {
  mobileMenuSlot?: ReactNode;
}

export function AdminHeader({ mobileMenuSlot }: AdminHeaderProps) {
  return (
    <header
      className="sticky top-0 z-10 h-14 bg-white border-b border-slate-100 flex items-center gap-3 px-4 md:hidden"
      // No backdrop-filter here — keeps position:fixed children (portaled drawer) working correctly
    >
      {/* Hamburger slot — appears on right in RTL (first flex item) */}
      {mobileMenuSlot}

      {/* Page identity */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <span className="font-cairo font-semibold text-sm text-slate-800 truncate">
          لوحة الإدارة
        </span>
      </div>
    </header>
  );
}
