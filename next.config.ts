import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Arabic RTL support
  experimental: {
    // optimizeCss: true,
    // Enables instrumentation.ts lifecycle hooks (register, onRequestError).
    // Stable in Next.js 15.3+; guarded here for earlier 15.x compatibility.
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      // Cover both public and signed Supabase storage URLs
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.in",
        pathname: "/storage/v1/object/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    // Cache optimized images for 24h at the CDN layer
    minimumCacheTTL: 86400,
  },
  async headers() {
    const supabaseHost = "*.supabase.co *.supabase.in";
    const csp = [
      "default-src 'self'",
      // Next.js injects inline scripts; unsafe-eval is needed for dev HMR
      `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
      // Tailwind v4 + Next.js both generate inline styles at runtime
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      // Cairo font from Google Fonts
      `font-src 'self' https://fonts.gstatic.com`,
      // Supabase storage + external product images via <Image>
      `img-src 'self' data: blob: https://${supabaseHost}`,
      // Supabase REST + Auth + Realtime WebSocket
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
      // No iframes anywhere (belt+suspenders with X-Frame-Options)
      `frame-ancestors 'none'`,
      // Forms only post to same origin
      `form-action 'self'`,
      // Block <base> tag hijacking
      `base-uri 'self'`,
      // Block object/embed elements
      `object-src 'none'`,
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      // Storefront routes - CORS for subdomain future support
      {
        source: "/store/:slug*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      // Future: support subdomain-based routing
      // When a request comes from store-slug.sabastore.com,
      // rewrite to /store/store-slug
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
