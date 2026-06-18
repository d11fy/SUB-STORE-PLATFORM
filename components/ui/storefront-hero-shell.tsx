import { cn } from "@/lib/utils";

interface StorefrontHeroShellProps {
  variant?: "dark" | "light-primary" | "light-emerald" | "light-rose" | "light-amber" | "light-violet" | "neutral";
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
}

const variantMap: Record<NonNullable<StorefrontHeroShellProps["variant"]>, string> = {
  "dark":           "bg-slate-900 text-white",
  "light-primary":  "bg-gradient-to-b from-blue-50 via-background to-background border-b border-blue-100",
  "light-emerald":  "bg-gradient-to-b from-emerald-50 via-background to-background border-b border-emerald-100",
  "light-rose":     "bg-gradient-to-b from-rose-50 via-background to-background border-b border-rose-100",
  "light-amber":    "bg-gradient-to-b from-amber-50 via-background to-background border-b border-amber-100",
  "light-violet":   "bg-gradient-to-b from-violet-50 via-background to-background border-b border-violet-100",
  "neutral":        "bg-card border-b border-border",
};

/**
 * Hero section shell for storefront themes.
 * Controls the background palette. Content goes inside.
 *
 * dark variant is the ONLY allowed dark surface in storefronts.
 * All other sections must use light variants.
 */
export function StorefrontHeroShell({
  variant = "neutral",
  children,
  className,
  fullHeight = false,
}: StorefrontHeroShellProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden py-16 lg:py-24 px-4",
        fullHeight && "min-h-[600px] flex items-center",
        variantMap[variant],
        className
      )}
    >
      {children}
    </section>
  );
}
