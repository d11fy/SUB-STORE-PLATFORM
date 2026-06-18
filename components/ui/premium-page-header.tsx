import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  className?: string;
}

/**
 * Page-level header for Dashboard pages.
 * Provides consistent title / description / action layout.
 * RTL-ready. Light-first.
 */
export function PremiumPageHeader({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  actions,
  breadcrumb,
  className,
}: PremiumPageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-right", className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        )}
        <div className="space-y-1">
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-cairo mb-1">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span>/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-foreground transition-colors">{crumb.label}</Link>
                  ) : (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}
          <h1 className="dashboard-heading font-cairo">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground font-cairo leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
