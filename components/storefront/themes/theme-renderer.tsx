// Server component — no "use client".
// Themes are dynamically imported so each theme is a separate JS chunk:
// only the theme this store uses is ever downloaded by the visitor's browser.

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { CartButton } from "@/app/store/[slug]/components/cart-button";
import type { StorefrontThemeProps, StoreWithTheme } from "./theme-types";
import type { StoreThemeSettings } from "@/lib/types/database";
import type { HeaderConfig, FooterConfig } from "@/lib/themes/customization-types";

// ── Dynamic theme imports — each becomes its own JS bundle chunk ──────────────
const FashionTheme = dynamic(() => import("./fashion-theme"));
const ElectronicsTheme = dynamic(() => import("./electronics-theme"));
const SubscriptionsTheme = dynamic(() => import("./subscriptions-theme"));
const BooksTheme = dynamic(() => import("./books-theme"));
const AccessoriesTheme = dynamic(() => import("./accessories-theme"));
const BlankTheme = dynamic(() => import("./blank-theme"));
const PersonalServicesTheme = dynamic(() => import("./personal-services-theme"));
const GeneralTheme = dynamic(() => import("./general-theme"));

const THEME_MAP: Record<string, React.ComponentType<StorefrontThemeProps>> = {
  fashion: FashionTheme as React.ComponentType<StorefrontThemeProps>,
  electronics: ElectronicsTheme as React.ComponentType<StorefrontThemeProps>,
  subscriptions: SubscriptionsTheme as React.ComponentType<StorefrontThemeProps>,
  books: BooksTheme as React.ComponentType<StorefrontThemeProps>,
  accessories: AccessoriesTheme as React.ComponentType<StorefrontThemeProps>,
  blank: BlankTheme as React.ComponentType<StorefrontThemeProps>,
  personal_services: PersonalServicesTheme as React.ComponentType<StorefrontThemeProps>,
  general: GeneralTheme as React.ComponentType<StorefrontThemeProps>,
};

export function ThemeRenderer(props: StorefrontThemeProps) {
  const themeSlug = props.store.themes?.slug ?? "fashion";
  const ThemeComponent = THEME_MAP[themeSlug] ?? THEME_MAP.fashion;
  return <ThemeComponent {...props} />;
}

// ── StorePage types ───────────────────────────────────────────────────────────
interface StorePage {
  id: string;
  title: string;
  slug: string;
  show_in_header: boolean;
  show_in_footer: boolean;
}

// ── ThemeHeader ───────────────────────────────────────────────────────────────
interface ThemeHeaderProps {
  store: StoreWithTheme;
  settings: StoreThemeSettings;
  headerConfig?: HeaderConfig;
  pages?: StorePage[];
}

export function ThemeHeader({ store, settings, headerConfig, pages = [] }: ThemeHeaderProps) {
  const slug = store.slug;
  const themeSlug = store.themes?.slug ?? "fashion";

  const isMinimal = themeSlug === "blank" || themeSlug === "fashion";
  const isRose = themeSlug === "personal_services";
  const isEmerald = themeSlug === "general";

  const isSticky = headerConfig?.sticky !== false;
  const showNav = headerConfig?.show_nav !== false;

  const bg =
    headerConfig?.background === "primary"
      ? "bg-primary text-white"
      : headerConfig?.background === "card"
      ? "bg-card/95 backdrop-blur-md"
      : "bg-white/95 backdrop-blur-md";

  const logoRounding =
    headerConfig?.logo_style === "square"
      ? "rounded-none"
      : headerConfig?.logo_style === "circle"
      ? "rounded-full"
      : headerConfig?.logo_style === "rounded"
      ? "rounded-xl"
      : isMinimal
      ? "rounded-none"
      : isRose
      ? "rounded-full"
      : "rounded-xl";

  const logoFallbackBg = isMinimal
    ? "bg-slate-700"
    : isRose
    ? "bg-rose-400"
    : isEmerald
    ? "bg-emerald-600"
    : "bg-primary";

  const baseNavLinks = headerConfig?.nav_links ?? [
    { label: "الرئيسية", href: `/store/${slug}` },
    { label: "كل المنتجات", href: `/store/${slug}/products` },
  ];

  const headerPageLinks = pages
    .filter((p) => p.show_in_header)
    .map((p) => ({ label: p.title, href: `/store/${slug}/${p.slug}` }));

  const navLinks = [...baseNavLinks, ...headerPageLinks];
  const logoSrc = settings.logo_url || store.logo_url;

  return (
    <header
      className={`z-50 border-b border-border shadow-sm transition-colors ${bg} ${
        isSticky ? "sticky top-0" : "relative"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <div className="flex items-center gap-8">
          <Link href={`/store/${slug}`} className="flex items-center gap-3 group">
            {logoSrc ? (
              <div className={`relative w-10 h-10 overflow-hidden border border-border group-hover:scale-105 transition-transform ${logoRounding}`}>
                <Image
                  src={logoSrc}
                  alt={store.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className={`w-10 h-10 flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform ${logoRounding} ${logoFallbackBg}`}
              >
                {store.name.substring(0, 1)}
              </div>
            )}
            <span className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
              {store.name}
            </span>
          </Link>

          {showNav && navLinks.length > 0 && (
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href.startsWith("/store/") ? link.href : `/store/${slug}${link.href}`}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <CartButton storeSlug={slug} />
      </div>
    </header>
  );
}

// ── ThemeFooter ───────────────────────────────────────────────────────────────
interface ThemeFooterProps {
  store: StoreWithTheme;
  settings: StoreThemeSettings;
  footerConfig?: FooterConfig;
  pages?: StorePage[];
}

export function ThemeFooter({ store, settings, footerConfig, pages = [] }: ThemeFooterProps) {
  const socialLinks = store.social_links as any;
  const themeSlug = store.themes?.slug ?? "fashion";
  const footerPages = pages.filter((p) => p.show_in_footer);

  const isMinimal = themeSlug === "blank" || themeSlug === "fashion";
  const isRose = themeSlug === "personal_services";

  const layout = footerConfig?.layout ?? "simple";
  const showSocial = footerConfig?.show_social !== false;
  const showPoweredBy = footerConfig?.show_powered_by !== false;
  const footerText =
    footerConfig?.text ||
    settings.footer_content ||
    `أهلاً بكم في متجرنا الإلكتروني. نحن فخورون بتقديم أفضل الخدمات والمنتجات بجودة متميزة.`;

  const socialBtnCls = `w-9 h-9 border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all ${
    isMinimal ? "rounded-none" : isRose ? "rounded-full" : "rounded-xl"
  }`;

  if (layout === "minimal") {
    return (
      <footer className="border-t border-border py-4 bg-card" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>كل الحقوق محفوظة لمتجر {store.name} © 2026.</p>
          {showPoweredBy && (
            <div className="flex items-center gap-1.5 font-semibold">
              <span>مشغّل بواسطة</span>
              <Link href="/" className="text-foreground hover:text-primary transition-colors font-bold">سبأ ستور</Link>
            </div>
          )}
        </div>
      </footer>
    );
  }

  const colCount = footerPages.length > 0 ? 4 : 3;
  const gridCls = colCount === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3";

  return (
    <footer className="border-t border-border pt-12 pb-8 bg-card transition-colors" dir="rtl">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid ${gridCls} gap-8 mb-12`}>
        <div className="space-y-4 text-right">
          <h4 className="font-bold text-foreground text-sm">حول متجرنا</h4>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">{footerText}</p>
        </div>
        {footerPages.length > 0 && (
          <div className="space-y-4 text-right">
            <h4 className="font-bold text-foreground text-sm">روابط مهمة</h4>
            <ul className="space-y-2">
              {footerPages.map((page) => (
                <li key={page.id}>
                  <Link href={`/store/${store.slug}/${page.slug}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="space-y-4 text-right">
          <h4 className="font-bold text-foreground text-sm">معلومات التواصل</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {store.email && (
              <li className="flex items-center gap-2 justify-end">
                <span>{store.email}</span>
                <Mail className="h-4 w-4 text-muted-foreground/70" />
              </li>
            )}
            {store.phone && (
              <li className="flex items-center gap-2 justify-end" dir="ltr">
                <span>{store.phone}</span>
                <Phone className="h-4 w-4 text-muted-foreground/70" />
              </li>
            )}
            {store.address && (
              <li className="flex items-center gap-2 justify-end">
                <span>{store.address}{store.city ? `، ${store.city}` : ""}</span>
                <MapPin className="h-4 w-4 text-muted-foreground/70" />
              </li>
            )}
          </ul>
        </div>
        {showSocial && (
          <div className="space-y-4 text-right">
            <h4 className="font-bold text-foreground text-sm">تابعنا على</h4>
            <div className="flex gap-3 justify-end">
              {socialLinks?.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className={socialBtnCls}>📸</a>
              )}
              {socialLinks?.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noreferrer" className={socialBtnCls}>👥</a>
              )}
              {socialLinks?.whatsapp && (
                <a href={`https://wa.me/${socialLinks.whatsapp}`} target="_blank" rel="noreferrer" className={socialBtnCls}>💬</a>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p className="order-2 sm:order-1">كل الحقوق محفوظة لمتجر {store.name} © 2026.</p>
        {showPoweredBy && (
          <div className="order-1 sm:order-2 flex items-center gap-1.5 font-semibold">
            <span>مشغّل بواسطة</span>
            <Link href="/" className="text-foreground hover:text-primary transition-colors font-bold tracking-wider">سبأ ستور</Link>
          </div>
        )}
      </div>
    </footer>
  );
}
