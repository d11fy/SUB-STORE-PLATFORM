import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  rating?: number;
  accentColor?: "rose" | "violet" | "amber" | "primary";
  className?: string;
}

/**
 * Client testimonial card.
 * Used in subscriptions-theme, personal_services-theme, and landing pages.
 * RTL-ready. Light-first.
 */
export function TestimonialCard({
  quote,
  name,
  role,
  avatarUrl,
  rating = 5,
  accentColor = "primary",
  className,
}: TestimonialCardProps) {
  const accentTextMap = {
    rose:    "text-rose-500",
    violet:  "text-violet-500",
    amber:   "text-amber-500",
    primary: "text-primary",
  };
  const accentIconMap = {
    rose:    "text-rose-300",
    violet:  "text-violet-300",
    amber:   "text-amber-300",
    primary: "text-primary/30",
  };

  return (
    <div className={cn("surface-card p-6 text-right space-y-4 relative overflow-hidden", className)}>
      <Quote className={cn("absolute top-4 left-4 h-8 w-8 rotate-180", accentIconMap[accentColor])} aria-hidden />

      <div className="flex gap-0.5 justify-end">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={cn("text-base", i < rating ? "text-amber-400" : "text-muted")}>★</span>
        ))}
      </div>

      <p className={cn("text-xs text-muted-foreground leading-relaxed italic font-cairo")}>
        "{quote}"
      </p>

      <div className="flex items-center gap-3 justify-end pt-1 border-t border-border">
        <div className="text-right">
          <p className="text-xs font-bold text-foreground font-cairo">{name}</p>
          {role && <p className="text-[10px] text-muted-foreground font-cairo">{role}</p>}
        </div>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover border border-border" />
        ) : (
          <div className={cn("w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground font-cairo")}>
            {name.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );
}
