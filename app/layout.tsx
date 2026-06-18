import type { Metadata, Viewport } from "next";
import { Cairo, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

// ============================================================
// ARABIC FONTS
// ============================================================
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  preload: true,
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-ibm-plex-arabic",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: false, // lazy load secondary font
});

// ============================================================
// METADATA
// ============================================================
export const metadata: Metadata = {
  title: {
    default: "سبأ ستور — منصة التجارة الإلكترونية العربية",
    template: "%s | سبأ ستور",
  },
  description:
    "أنشئ متجرك الإلكتروني الاحترافي بالعربية في دقائق. سبأ ستور — منصة SaaS للتجارة الإلكترونية مصممة خصيصًا للسوق العربي.",
  keywords: [
    "متجر إلكتروني",
    "تجارة إلكترونية",
    "سبأ ستور",
    "إنشاء متجر",
    "التجارة الإلكترونية العربية",
    "فلسطين",
    "الأردن",
  ],
  authors: [{ name: "سبأ ستور" }],
  creator: "سبأ ستور",
  publisher: "سبأ ستور",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://sabastore.com",
    siteName: "سبأ ستور",
    title: "سبأ ستور — منصة التجارة الإلكترونية العربية",
    description:
      "أنشئ متجرك الإلكتروني الاحترافي بالعربية في دقائق.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "سبأ ستور",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "سبأ ستور — منصة التجارة الإلكترونية العربية",
    description: "أنشئ متجرك الإلكتروني الاحترافي بالعربية في دقائق.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B4FD8",
};

// ============================================================
// ROOT LAYOUT
// ============================================================
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${cairo.variable} ${ibmPlexArabic.variable}`}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-cairo antialiased bg-background text-foreground min-h-dvh" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            richColors
            dir="rtl"
            toastOptions={{
              style: {
                fontFamily: "Cairo, sans-serif",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
