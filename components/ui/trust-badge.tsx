import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  iconColor?: string;
  className?: string;
}

interface TrustStripProps {
  badges: Array<{ icon: LucideIcon; label: string; sublabel?: string }>;
  iconColor?: string;
  className?: string;
}

/**
 * Single trust indicator pill/badge.
 */
export function TrustBadge({ icon: Icon, label, sublabel, iconColor = "text-emerald-600", className }: TrustBadgeProps) {
  return (
    <div className={cn("flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 text-right", className)}>
      <Icon className={cn("h-5 w-5 shrink-0", iconColor)} />
      <div>
        <p className="text-xs font-bold text-foreground font-cairo">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground font-cairo">{sublabel}</p>}
      </div>
    </div>
  );
}

/**
 * Horizontal strip of trust badges.
 * Used below hero sections in storefronts.
 */
export function TrustStrip({ badges, iconColor, className }: TrustStripProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-3", className)}>
      {badges.map((badge) => (
        <TrustBadge key={badge.label} {...badge} iconColor={iconColor} />
      ))}
    </div>
  );
}
