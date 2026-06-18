// ============================================================
// Saba Store — Middleware (proxy.ts for Next.js 16)
// Session refresh + Route protection + Role-based access control
// ============================================================
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ============================================================
// ROUTE MATCHERS
// ============================================================
const PUBLIC_ROUTES = ["/", "/pricing", "/features", "/login", "/register", "/auth", "/verify-email", "/store"];
const MERCHANT_ROUTES = ["/dashboard"];
const ADMIN_ROUTES = ["/admin"];

function isPublicRoute(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  );
}

function isMerchantRoute(pathname: string): boolean {
  return MERCHANT_ROUTES.some((route) => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

// ============================================================
// PROXY (Next.js 16 Middleware)
// ============================================================
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ============================================================
  // CUSTOM DOMAIN ROUTING
  // Rewrite verified custom domains to /store/[slug] transparently
  // ============================================================
  const hostname = request.headers.get("host") ?? "";
  const isKnownHost =
    hostname.includes("localhost") ||
    hostname.includes("127.0.0.1") ||
    hostname.includes("vercel.app") ||
    hostname.endsWith(".sabastore.com") ||
    hostname === "sabastore.com";

  if (
    !isKnownHost &&
    !pathname.startsWith("/store/") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data: domainRow } = await adminSupabase
      .from("domains")
      .select("store_id, stores(slug)")
      .eq("domain", hostname)
      .eq("is_verified", true)
      .maybeSingle();

    if (domainRow?.stores) {
      const storeRecord = domainRow.stores as unknown as { slug: string } | { slug: string }[];
      const storeSlug = Array.isArray(storeRecord) ? storeRecord[0]?.slug : storeRecord.slug;
      if (storeSlug) {
        const url = request.nextUrl.clone();
        url.pathname = `/store/${storeSlug}${pathname === "/" ? "" : pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  }

  // ============================================================
  // SESSION REFRESH
  // ============================================================
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Always use getUser() — never getSession()
  // getUser() verifies the JWT with Supabase server and refreshes the token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ============================================================
  // AUTH CHECKS
  // ============================================================

  // Protect merchant dashboard — redirect unauthenticated users to login
  if (isMerchantRoute(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin routes
  if (isAdminRoute(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check platform_admin role (NOT "admin" — that role doesn't exist)
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "platform_admin") {
      // Authenticated but not a platform admin — send to merchant dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Redirect already-authenticated users away from auth pages
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - public assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
