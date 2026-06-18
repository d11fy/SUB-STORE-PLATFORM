import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
  href?: string;
  hrefLabel?: string;
  align?: "right" | "center" | "left";
  className?: string;
}

/**
 * Reusable section heading used in storefronts and dashboards.
 * RTL-ready. Light-first.
 */
export function SectionHeader({
  title,
  subtitle,
  label,
  href,
  hrefLabel = "عرض الكل",
  align = "right",
  className,
}: SectionHeaderProps) {
  const alignClass =
    align === "center" ? "items-center text-center" : align === "left" ? "items-start text-left" : "items-end text-right";

  return (
    <div className={cn("flex flex-col gap-1.5", alignClass, className)}>
      {label && (
        <span className="section-label">{label}</span>
      )}
      <div className="flex items-baseline justify-between w-full">
        <div className={cn("flex flex-col gap-1", align === "center" && "items-center", align === "right" && "items-end")}>
          <h2 className="dashboard-heading font-cairo">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground font-cairo max-w-md">{subtitle}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors font-cairo shrink-0 ms-4"
          >
            {hrefLabel}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        )}
      </div>
    </div>
  );
}
