import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoBannerProps {
  title: string;
  description?: string;
  label?: string;
  ctaLabel: string;
  ctaHref: string;
  icon?: LucideIcon;
  variant?: "primary" | "emerald" | "rose" | "amber" | "violet" | "subtle";
  className?: string;
}

const variantStyles: Record<NonNullable<PromoBannerProps["variant"]>, { wrap: string; cta: string; label: string }> = {
  primary:  { wrap: "bg-primary text-white border-transparent",                   cta: "bg-white text-primary hover:bg-white/90",      label: "bg-white/20 text-white" },
  emerald:  { wrap: "bg-emerald-600 text-white border-transparent",               cta: "bg-white text-emerald-700 hover:bg-white/90",  label: "bg-white/20 text-white" },
  rose:     { wrap: "bg-rose-50 text-rose-900 border border-rose-100",            cta: "bg-rose-500 text-white hover:bg-rose-600",     label: "bg-rose-100 text-rose-700" },
  amber:    { wrap: "bg-amber-50 text-amber-900 border border-amber-100",         cta: "bg-amber-500 text-white hover:bg-amber-600",   label: "bg-amber-100 text-amber-700" },
  violet:   { wrap: "bg-violet-50 text-violet-900 border border-violet-100",      cta: "bg-violet-600 text-white hover:bg-violet-700", label: "bg-violet-100 text-violet-700" },
  subtle:   { wrap: "bg-muted text-foreground border border-border",              cta: "bg-foreground text-background hover:bg-foreground/90", label: "bg-border text-muted-foreground" },
};

/**
 * Full-width promotional / CTA banner component.
 * Used in storefronts and landing pages.
 * RTL-ready. Light-first (primary and emerald variants use brand colors, not "dark mode").
 */
export function PromoBanner({
  title,
  description,
  label,
  ctaLabel,
  ctaHref,
  icon: Icon,
  variant = "subtle",
  className,
}: PromoBannerProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn("rounded-3xl px-6 py-10 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-right", styles.wrap, className)}>
      <div className="space-y-2 max-w-xl">
        {label && (
          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-cairo", styles.label)}>
            {label}
          </span>
        )}
        <h3 className="text-lg sm:text-xl font-black font-cairo leading-snug flex items-center gap-2 justify-end sm:justify-start">
          {Icon && <Icon className="h-5 w-5 shrink-0" />}
          {title}
        </h3>
        {description && (
          <p className="text-sm opacity-80 font-cairo leading-relaxed">{description}</p>
        )}
      </div>
      <Link
        href={ctaHref}
        className={cn("shrink-0 px-6 py-3 text-xs font-bold rounded-full transition-all font-cairo shadow-sm", styles.cta)}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
