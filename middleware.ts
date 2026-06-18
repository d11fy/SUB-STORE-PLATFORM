import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Supabase Session Refresh ──────────────────────────────────────────
  // Required on every request so auth tokens stay fresh.
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() refreshes the session cookie if needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 2. Custom Domain Routing ─────────────────────────────────────────────
  // When a verified custom domain hits the server, rewrite the request
  // to the matching /store/[slug] path transparently.
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
    // Bypass RLS so we can look up any verified domain
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: { getAll: () => [], setAll: () => {} },
      }
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
      const url = request.nextUrl.clone();
      url.pathname = `/store/${storeSlug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // ── 3. Auth Protection ───────────────────────────────────────────────────
  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname.startsWith("/auth");

  if (!user && (isDashboard || isAdmin)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.pathname = next && next.startsWith("/") ? next : "/dashboard";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
