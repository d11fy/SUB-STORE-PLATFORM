import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
  iconBg?: string;
}

interface FeatureGridProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * Grid of icon + title + description feature cards.
 * Used in subscriptions theme, landing pages, and "why us" sections.
 * RTL-ready. Light-first.
 */
export function FeatureGrid({ features, columns = 3, className }: FeatureGridProps) {
  const colClass = { 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", 4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" }[columns];

  return (
    <div className={cn("grid gap-5", colClass, className)}>
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <div key={feature.title} className="feature-card text-right">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", feature.iconBg || "bg-primary/10")}>
              <Icon className={cn("h-5 w-5", feature.iconColor || "text-primary")} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-foreground font-cairo">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-cairo">{feature.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
