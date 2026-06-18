import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  price: string | number;
  currency?: string;
  period?: string;
  description?: string;
  features: string[];
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  isFeatured?: boolean;
  featuredLabel?: string;
  accentColor?: "violet" | "primary" | "emerald" | "rose" | "amber";
  className?: string;
}

const accentMap = {
  violet:  { border: "border-violet-400",  badge: "bg-violet-600 text-white",  cta: "bg-violet-600 text-white hover:bg-violet-700" },
  primary: { border: "border-primary",      badge: "bg-primary text-white",      cta: "bg-primary text-white hover:bg-primary/90" },
  emerald: { border: "border-emerald-500",  badge: "bg-emerald-600 text-white",  cta: "bg-emerald-600 text-white hover:bg-emerald-700" },
  rose:    { border: "border-rose-400",     badge: "bg-rose-500 text-white",     cta: "bg-rose-500 text-white hover:bg-rose-600" },
  amber:   { border: "border-amber-400",    badge: "bg-amber-500 text-white",    cta: "bg-amber-500 text-white hover:bg-amber-600" },
};

/**
 * Pricing / subscription plan card.
 * Used in subscriptions-theme and landing pages.
 * RTL-ready. Light-first.
 */
export function PricingCard({
  name,
  price,
  currency = "",
  period = "/شهر",
  description,
  features,
  ctaLabel = "اشترك الآن",
  ctaHref,
  onCtaClick,
  isFeatured = false,
  featuredLabel = "الأكثر شيوعاً",
  accentColor = "primary",
  className,
}: PricingCardProps) {
  const accent = accentMap[accentColor];

  return (
    <div
      className={cn(
        "pricing-card flex flex-col text-right transition-all duration-200",
        isFeatured ? cn("border-2", accent.border, "shadow-raised scale-[1.02]") : "border border-border",
        className
      )}
    >
      {isFeatured && (
        <div className="flex justify-center -mt-5 mb-2">
          <span className={cn("text-[10px] font-black px-4 py-1.5 rounded-full font-cairo shadow-sm", accent.badge)}>
            {featuredLabel}
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-foreground font-cairo">{name}</h3>
        {description && (
          <p className="text-xs text-muted-foreground font-cairo">{description}</p>
        )}
      </div>

      <div className="py-4 border-b border-border">
        <div className="flex items-baseline gap-1 justify-end">
          <span className="text-3xl font-black text-foreground font-cairo font-numbers">{price}</span>
          {currency && <span className="text-sm text-muted-foreground font-cairo">{currency}</span>}
          <span className="text-xs text-muted-foreground font-cairo">{period}</span>
        </div>
      </div>

      <ul className="space-y-2.5 flex-1 py-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 justify-end text-xs text-muted-foreground font-cairo">
            <span>{feature}</span>
            <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          </li>
        ))}
      </ul>

      {ctaHref ? (
        <Link
          href={ctaHref}
          className={cn("mt-4 block w-full text-center py-3 text-xs font-bold rounded-xl transition-all font-cairo shadow-sm", accent.cta)}
        >
          {ctaLabel}
        </Link>
      ) : onCtaClick ? (
        <button
          onClick={onCtaClick}
          className={cn("mt-4 w-full py-3 text-xs font-bold rounded-xl transition-all font-cairo shadow-sm", accent.cta)}
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}
