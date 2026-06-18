import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardMetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label?: string };
  className?: string;
}

/**
 * Dashboard KPI / metric tile.
 * Shows an icon, value, label, and optional trend indicator.
 * RTL-ready. Light-first.
 */
export function DashboardMetricCard({
  label,
  value,
  icon: Icon,
  href,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  trend,
  className,
}: DashboardMetricCardProps) {
  const isPositive = trend && trend.value >= 0;

  const content = (
    <div className={cn("stats-card transition-all duration-200 group", href && "hover:border-primary/30 cursor-pointer", className)}>
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        {href && (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </div>

      <div className="mt-4 space-y-0.5">
        <p className="metric-value text-foreground font-cairo font-numbers">{value}</p>
        <p className="text-xs text-muted-foreground font-cairo">{label}</p>
      </div>

      {trend && (
        <div className={cn("flex items-center gap-1 text-[11px] font-semibold mt-2", isPositive ? "text-emerald-600" : "text-red-600")}>
          {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          <span>{isPositive ? "+" : ""}{trend.value}%</span>
          {trend.label && <span className="text-muted-foreground font-normal">{trend.label}</span>}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
