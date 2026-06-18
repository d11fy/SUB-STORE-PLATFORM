import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  iconColor?: string;
  iconBg?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Consistent empty state component for tables, lists, and sections.
 * RTL-ready. Light-first.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  iconColor = "text-muted-foreground",
  iconBg = "bg-muted",
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeMap = {
    sm: { py: "py-10", iconBox: "w-12 h-12", icon: "h-6 w-6", title: "text-sm", desc: "text-xs" },
    md: { py: "py-16", iconBox: "w-16 h-16", icon: "h-8 w-8", title: "text-sm", desc: "text-xs" },
    lg: { py: "py-24", iconBox: "w-20 h-20", icon: "h-10 w-10", title: "text-base", desc: "text-sm" },
  }[size];

  return (
    <div className={cn("flex flex-col items-center justify-center text-center space-y-4", sizeMap.py, className)}>
      <div className={cn("rounded-2xl flex items-center justify-center", sizeMap.iconBox, iconBg)}>
        <Icon className={cn(sizeMap.icon, iconColor)} />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <h3 className={cn("font-bold text-foreground font-cairo", sizeMap.title)}>{title}</h3>
        {description && (
          <p className={cn("text-muted-foreground leading-relaxed font-cairo", sizeMap.desc)}>{description}</p>
        )}
      </div>
      {(actionLabel && actionHref) && (
        <Link
          href={actionHref}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm font-cairo"
        >
          {actionLabel}
        </Link>
      )}
      {(actionLabel && onAction && !actionHref) && (
        <button
          onClick={onAction}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm font-cairo"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
