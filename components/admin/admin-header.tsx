"use client";

import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

interface AdminHeaderProps {
  mobileMenuSlot?: ReactNode;
}

export function AdminHeader({ mobileMenuSlot }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-10 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-3 md:hidden">
      {/* Hamburger slot (right side in RTL) */}
      {mobileMenuSlot}

      {/* Title */}
      <div className="flex items-center gap-2 flex-1">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <span className="font-cairo font-semibold text-sm text-foreground">لوحة الإدارة</span>
      </div>
    </header>
  );
}
