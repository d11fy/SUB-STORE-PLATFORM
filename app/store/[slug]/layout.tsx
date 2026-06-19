import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeHeader, ThemeFooter } from "@/components/storefront/themes/theme-renderer";
import { getStorefrontStore, getStorefrontPages } from "@/lib/storefront/store-data";
import type { ExtendedThemeSettings } from "@/lib/themes/customization-types";

// ISR: serve cached HTML, revalidate in background every 60s
export const revalidate = 60;

const ANNOUNCEMENT_STYLES: Record<string, string> = {
  primary: "bg-primary text-white",
  amber: "bg-amber-400 text-amber-950",
  emerald: "bg-emerald-600 text-white",
  rose: "bg-rose-500 text-white",
};

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { slug } = await params;

  // Deduplicated — React.cache() ensures layout + page share one DB call
  const store = await getStorefrontStore(slug);
  if (!store) notFound();

  if (store.status === "suspended" || store.status === "pending") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center font-cairo">
        <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-6">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold mb-2">هذا المتجر غير نشط</h1>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          عذراً، هذا المتجر موقف حالياً. يرجى التواصل مع الدعم الفني للمنصة.
        </p>
        <Link href="/" className="mt-8 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/95 transition-all">
          العودة للمنصة الرئيسية
        </Link>
      </div>
    );
  }

  const settings = store.settings as any;
  if (settings?.maintenance_mode === true) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center font-cairo">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-6 text-2xl animate-pulse">
          ⚙️
        </div>
        <h1 className="text-3xl font-black mb-3">المتجر تحت الصيانة المؤقتة</h1>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          يقوم فريق متجر <span className="text-amber-600 font-bold">{store.name}</span> بتحديث المنتجات والأسعار حالياً.
        </p>
        {store.phone && (
          <div className="mt-8 flex items-center gap-2 text-sm text-foreground bg-muted border border-border px-4 py-2 rounded-xl">
            <Phone className="h-4 w-4 text-primary" />
            <span>للتواصل العاجل: {store.phone}</span>
          </div>
        )}
      </div>
    );
  }

  // Fetch pages in parallel — also deduplicated for any sub-page that needs it
  const pages = await getStorefrontPages(store.id);

  const rawThemeSettings = store.store_theme_settings;
  const settingsData = Array.isArray(rawThemeSettings) ? rawThemeSettings[0] : rawThemeSettings;
  const themeSettings = settingsData || {
    primary_color: "#1B4FD8",
    secondary_color: "#7C3AED",
    accent_color: "#F59E0B",
    font_family: "Cairo",
    logo_url: null,
    favicon_url: null,
    footer_content: null,
  };

  const extended = (themeSettings.settings as ExtendedThemeSettings | null) ?? {};
  const headerConfig = extended.header_config;
  const footerConfig = extended.footer_config;
  const homepageConfig = extended.homepage_config;

  const fontFamily = themeSettings.font_family || "Cairo";
  const announcementCls =
    ANNOUNCEMENT_STYLES[homepageConfig?.announcement_style ?? "primary"] ?? ANNOUNCEMENT_STYLES.primary;

  // Only load weights actually used in the UI (drop 300/500)
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@400;600;700;800;900&display=swap`;

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary overflow-x-hidden"
      dir="rtl"
      style={{
        "--primary": themeSettings.primary_color,
        "--secondary": themeSettings.secondary_color,
        "--accent": themeSettings.accent_color,
        fontFamily: `${fontFamily}, sans-serif`,
      } as React.CSSProperties}
    >
      {/* Preconnect to Google Fonts servers — establishes TCP+TLS before the stylesheet fires */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* Preload the stylesheet so the browser discovers it earlier */}
      <link rel="preload" as="style" href={fontUrl} />
      {/* The actual stylesheet — loads after HTML paint thanks to preload above */}
      <link rel="stylesheet" href={fontUrl} />

      {/* Custom store CSS — scoped to this store's theme */}
      <link rel="stylesheet" href={`/store/${slug}/theme.css`} />

      {/* Announcement bar */}
      {homepageConfig?.show_announcement_bar && homepageConfig.announcement_text && (
        <div className={cn("w-full py-2.5 px-4 text-center text-xs font-semibold font-cairo", announcementCls)} dir="rtl">
          {homepageConfig.announcement_link ? (
            <a href={homepageConfig.announcement_link} className="underline underline-offset-2 hover:opacity-90 transition-opacity">
              {homepageConfig.announcement_text}
            </a>
          ) : (
            <span>{homepageConfig.announcement_text}</span>
          )}
        </div>
      )}

      <ThemeHeader store={store as any} settings={themeSettings as any} headerConfig={headerConfig} pages={pages} />

      <main className="flex-1 flex flex-col">{children}</main>

      <ThemeFooter store={store as any} settings={themeSettings as any} footerConfig={footerConfig} pages={pages} />
    </div>
  );
}
