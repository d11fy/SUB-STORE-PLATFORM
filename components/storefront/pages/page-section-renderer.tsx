// Page section renderer — custom store pages (D2)
// Renders static content sections without product/category data.
// Server component — no interactivity required.

import Link from "next/link";
import { Mail, Phone, MapPin, Shield, Truck, Star, Clock } from "lucide-react";
import type { SectionConfig } from "@/lib/themes/customization-types";

// ── Safe accessors for Record<string, unknown> ────────────────
function str(s: Record<string, unknown>, k: string, fallback = ""): string {
  return typeof s[k] === "string" ? (s[k] as string) : fallback;
}
function items(s: Record<string, unknown>, k: string): unknown[] {
  return Array.isArray(s[k]) ? (s[k] as unknown[]) : [];
}

interface PageSectionRendererProps {
  sections: SectionConfig[];
  storeSlug: string;
}

export function PageSectionRenderer({
  sections,
  storeSlug,
}: PageSectionRendererProps) {
  const enabled = sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  if (enabled.length === 0) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        <p className="text-sm">لا توجد أقسام منشورة في هذه الصفحة بعد.</p>
      </div>
    );
  }

  return (
    <div>
      {enabled.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <HeroSection
                key={section.id}
                settings={section.settings}
                storeSlug={storeSlug}
              />
            );
          case "about_text":
            return (
              <AboutSection key={section.id} settings={section.settings} />
            );
          case "faq":
            return <FaqSection key={section.id} settings={section.settings} />;
          case "contact_section":
            return (
              <ContactSection key={section.id} settings={section.settings} />
            );
          case "testimonials":
            return (
              <TestimonialsSection
                key={section.id}
                settings={section.settings}
              />
            );
          case "trust_badges":
            return (
              <TrustBadgesSection
                key={section.id}
                settings={section.settings}
              />
            );
          case "image_gallery":
            return (
              <ImageGallerySection
                key={section.id}
                settings={section.settings}
              />
            );
          case "promo_banner":
            return (
              <PromoBannerSection
                key={section.id}
                settings={section.settings}
                storeSlug={storeSlug}
              />
            );
          case "newsletter":
            return (
              <NewsletterSection
                key={section.id}
                settings={section.settings}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────
function HeroSection({
  settings,
  storeSlug,
}: {
  settings: Record<string, unknown>;
  storeSlug: string;
}) {
  const title = str(settings, "title", "مرحباً بكم");
  const subtitle = str(settings, "subtitle");
  const ctaLabel = str(settings, "cta_primary_label", "تصفح المنتجات");

  return (
    <section className="bg-card border-b border-border py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h1 className="text-4xl font-black font-cairo text-foreground leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        <Link
          href={`/store/${storeSlug}/products`}
          className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md font-cairo"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}

// ── About Text ────────────────────────────────────────────────
function AboutSection({ settings }: { settings: Record<string, unknown> }) {
  const title = str(settings, "title", "من نحن");
  const content = str(settings, "content");

  return (
    <section className="py-16 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-right space-y-6">
        <h2 className="text-3xl font-bold font-cairo text-foreground">{title}</h2>
        {content && (
          <p className="text-muted-foreground leading-loose text-base whitespace-pre-wrap">
            {content}
          </p>
        )}
      </div>
    </section>
  );
}

// ── FAQ (uses native <details> for zero-JS accordion) ─────────
function FaqSection({ settings }: { settings: Record<string, unknown> }) {
  const title = str(settings, "title", "الأسئلة الشائعة");
  const faqItems = items(settings, "items");

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h2 className="text-3xl font-bold font-cairo text-foreground text-center">
          {title}
        </h2>
        {faqItems.length > 0 && (
          <div className="space-y-3">
            {faqItems.map((item, i) => {
              const t =
                item && typeof item === "object"
                  ? (item as Record<string, unknown>)
                  : {};
              const q = str(t, "question");
              const a = str(t, "answer");
              if (!q) return null;
              return (
                <details
                  key={i}
                  className="group bg-card border border-border rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none select-none">
                    <span className="font-bold text-sm font-cairo text-foreground">
                      {q}
                    </span>
                    <span className="text-muted-foreground text-xs transition-transform group-open:rotate-180 inline-block">
                      ▼
                    </span>
                  </summary>
                  {a && (
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                      {a}
                    </div>
                  )}
                </details>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Contact ───────────────────────────────────────────────────
function ContactSection({ settings }: { settings: Record<string, unknown> }) {
  const title = str(settings, "title", "تواصل معنا");
  const email = str(settings, "email");
  const phone = str(settings, "phone");
  const address = str(settings, "address");

  return (
    <section className="py-16 bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-right space-y-8">
        <h2 className="text-3xl font-bold font-cairo text-foreground">{title}</h2>
        <div className="space-y-4">
          {email && (
            <div className="flex items-center gap-3 justify-end">
              <span className="text-muted-foreground text-sm">{email}</span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-3 justify-end" dir="ltr">
              <span className="text-muted-foreground text-sm">{phone}</span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
            </div>
          )}
          {address && (
            <div className="flex items-center gap-3 justify-end">
              <span className="text-muted-foreground text-sm">{address}</span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
            </div>
          )}
          {!email && !phone && !address && (
            <p className="text-muted-foreground text-sm">
              لم تُضف بيانات التواصل بعد.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────
function TestimonialsSection({
  settings,
}: {
  settings: Record<string, unknown>;
}) {
  const title = str(settings, "title", "آراء العملاء");
  const testimonialItems = items(settings, "items");

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <h2 className="text-3xl font-bold font-cairo text-foreground text-center">
          {title}
        </h2>
        {testimonialItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonialItems.map((item, i) => {
              const t =
                item && typeof item === "object"
                  ? (item as Record<string, unknown>)
                  : {};
              const quote = str(t, "quote");
              const name = str(t, "name");
              const role = str(t, "role");
              const rating =
                typeof t.rating === "number" ? Math.min(5, Math.max(1, t.rating)) : 5;
              if (!quote) return null;
              return (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 text-right"
                >
                  <div className="flex gap-0.5 justify-end">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className={`h-4 w-4 ${
                          j < rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    &ldquo;{quote}&rdquo;
                  </p>
                  {name && (
                    <div>
                      <p className="text-sm font-bold text-foreground font-cairo">
                        {name}
                      </p>
                      {role && (
                        <p className="text-xs text-muted-foreground">{role}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Trust Badges ──────────────────────────────────────────────
const DEFAULT_BADGES = [
  { Icon: Shield, label: "دفع آمن 100%" },
  { Icon: Truck, label: "شحن سريع وموثوق" },
  { Icon: Star, label: "جودة مضمونة" },
  { Icon: Clock, label: "دعم على مدار الساعة" },
];

function TrustBadgesSection({
  settings,
}: {
  settings: Record<string, unknown>;
}) {
  const title = str(settings, "title", "لماذا تختارنا");

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <h2 className="text-3xl font-bold font-cairo text-foreground text-center">
          {title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {DEFAULT_BADGES.map(({ Icon, label }) => (
            <div key={label} className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground font-cairo">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Image Gallery ─────────────────────────────────────────────
function ImageGallerySection({
  settings,
}: {
  settings: Record<string, unknown>;
}) {
  const title = str(settings, "title", "معرض الصور");
  const galleryImages = items(settings, "images");

  if (galleryImages.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h2 className="text-3xl font-bold font-cairo text-foreground text-center">
          {title}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryImages.map((img, i) => {
            const url =
              typeof img === "string"
                ? img
                : img && typeof img === "object" && "url" in img
                ? String((img as Record<string, unknown>).url)
                : "";
            if (!url) return null;
            return (
              <div
                key={i}
                className="aspect-square rounded-xl overflow-hidden bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Promo Banner ──────────────────────────────────────────────
function PromoBannerSection({
  settings,
  storeSlug,
}: {
  settings: Record<string, unknown>;
  storeSlug: string;
}) {
  const title = str(settings, "title", "عرض خاص");
  const description = str(settings, "description");
  const badgeLabel = str(settings, "badge_label");
  const ctaLabel = str(settings, "cta_label", "تسوق الآن");

  return (
    <section className="py-12 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        {badgeLabel && (
          <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">
            {badgeLabel}
          </span>
        )}
        <h2 className="text-3xl font-black font-cairo text-white">{title}</h2>
        {description && (
          <p className="text-primary-foreground/80 max-w-xl mx-auto">{description}</p>
        )}
        <Link
          href={`/store/${storeSlug}/products`}
          className="inline-flex items-center px-8 py-3 bg-white text-primary text-sm font-bold rounded-xl hover:bg-white/90 transition-all shadow-md font-cairo mt-2"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}

// ── Newsletter (visual only — no email functionality) ─────────
function NewsletterSection({
  settings,
}: {
  settings: Record<string, unknown>;
}) {
  const title = str(
    settings,
    "title",
    "اشترك في نشرتنا البريدية"
  );
  const subtitle = str(
    settings,
    "subtitle",
    "احصل على أحدث العروض والأخبار مباشرة إلى بريدك"
  );

  return (
    <section className="py-16 bg-card border-t border-border">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-2xl font-bold font-cairo text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        )}
        <div className="flex gap-3 max-w-sm mx-auto">
          <input
            type="email"
            placeholder="بريدك الإلكتروني"
            disabled
            className="flex-1 px-4 py-3 bg-input border border-border rounded-lg text-sm placeholder:text-muted-foreground text-right"
          />
          <button
            disabled
            className="px-6 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl opacity-70 cursor-not-allowed font-cairo shrink-0"
          >
            اشترك
          </button>
        </div>
      </div>
    </section>
  );
}
