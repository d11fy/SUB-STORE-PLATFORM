// ============================================================
// Saba Store — Global Security Middleware  (Next.js 16 proxy.ts)
//
// Next.js 16 uses this file as the middleware entry point.
// Rename or delete middleware.ts if it exists — having both
// causes a build error ("Both middleware file and proxy file detected").
//
// Enforcement order (every non-static request):
//   0. Subdomain routing     → mystore.sabastore.com → /store/[slug]
//   1. Custom domain routing → myshop.com → /store/[slug]
//   2. Store suspension       → block expired/suspended storefronts
//   3. Session refresh        → keep Supabase JWT alive
//   4. Dashboard guard        → /dashboard/* requires authentication
//   5. Admin guard            → /admin/* requires platform_admin role
//   6. Auth-page redirect     → authenticated users skip login/register
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Route helpers ──────────────────────────────────────────────────────────────

/** Paths that are always public — skip all auth checks. */
const ALWAYS_PUBLIC = [
  "/auth",          // /auth/callback (Supabase OAuth code exchange)
  "/login",
  "/register",
  "/verify-email",
  "/store",         // public storefront + /store/[slug]/theme.css
  "/pricing",
  "/features",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return ALWAYS_PUBLIC.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/** Determines whether a hostname belongs to the platform itself.
 *  Anything else is treated as a merchant custom domain. */
function isPlatformHost(hostname: string): boolean {
  return (
    hostname.includes("localhost") ||
    hostname.includes("127.0.0.1") ||
    hostname.includes("vercel.app") ||
    hostname.endsWith(".sabastore.com") ||
    hostname === "sabastore.com"
  );
}

// ── Domain resolution cache ────────────────────────────────────────────────────
// Per-instance cache (Edge runtime: survives across warm requests within the same worker).
// TTL: 60 s. A null slug means "confirmed no match" — prevents repeat DB hits for
// unknown/unverified domains without re-querying every request.
const _domainCache = new Map<string, { slug: string | null; expires: number }>();

function getCachedSlug(key: string): string | null | undefined {
  const entry = _domainCache.get(key);
  if (!entry) return undefined; // cache miss
  if (Date.now() > entry.expires) {
    _domainCache.delete(key);
    return undefined; // expired
  }
  return entry.slug; // hit — may be null ("no store found")
}

function setCachedSlug(key: string, slug: string | null) {
  _domainCache.set(key, { slug, expires: Date.now() + 60_000 });
}

// ── Bot detection ──────────────────────────────────────────────────────────────

// Known non-browser clients that should not be able to submit checkout orders.
// Legitimate browser traffic (including React Native / mobile) sends real UAs.
const BOT_UA_FRAGMENTS = [
  "python-requests", "python-urllib", "python/",
  "scrapy", "go-http-client", "java/", "apache-httpclient",
  "libwww", "curl/", "wget/", "masscan", "zgrab", "nuclei",
  "okhttp", "httpx", "axios/0.",
];

function isBotUserAgent(ua: string | null): boolean {
  if (!ua) return true; // missing UA on a checkout POST = bot signal
  const lower = ua.toLowerCase();
  return BOT_UA_FRAGMENTS.some((f) => lower.includes(f));
}

// ── Subdomain helpers ──────────────────────────────────────────────────────────

// These subdomains belong to the platform, not to merchant stores.
const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "admin", "api", "mail", "staging", "dev",
]);

/**
 * If hostname is a single-level merchant subdomain of sabastore.com, return it.
 * Returns null for platform-reserved subdomains (www, app, admin…) and for
 * non-sabastore.com hosts (those go through the custom-domain path in Step 1).
 *
 * Examples:
 *   mystore.sabastore.com  → "mystore"
 *   www.sabastore.com      → null  (reserved)
 *   admin.sabastore.com    → null  (reserved)
 *   myshop.com             → null  (handled by Step 1)
 */
function getMerchantSubdomain(hostname: string): string | null {
  if (!hostname.endsWith(".sabastore.com")) return null;
  const sub = hostname.slice(0, hostname.length - ".sabastore.com".length);
  if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null;
  return sub;
}

// ── Main proxy ─────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // Extract potential merchant subdomain once — used in Step 0 and to guard Step 1.
  const merchantSubdomain = getMerchantSubdomain(hostname);

  // ── 0. Subdomain Routing (mystore.sabastore.com → /store/[slug]) ───────
  //
  // Merchants can use a free subdomain (stores.subdomain column) without
  // purchasing a custom domain.  We look up the store by its subdomain and
  // rewrite the request to /store/[slug].  The visitor never sees the internal
  // path — the URL stays as mystore.sabastore.com.
  //
  // Cache: domain lookup results are stored for 60 s per worker instance to
  // avoid a DB round-trip on every storefront request.
  if (
    merchantSubdomain &&
    !pathname.startsWith("/store/") &&
    !pathname.startsWith("/_next/") &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const cacheKey = `sub:${merchantSubdomain}`;
    let subSlug = getCachedSlug(cacheKey);

    if (subSlug === undefined) {
      const subClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { cookies: { getAll: () => [], setAll: () => {} } }
      );
      const { data: subStore } = await subClient
        .from("stores")
        .select("slug")
        .eq("subdomain", merchantSubdomain)
        .maybeSingle();
      subSlug = subStore?.slug ?? null;
      setCachedSlug(cacheKey, subSlug);
    }

    if (subSlug) {
      const url = request.nextUrl.clone();
      url.pathname = `/store/${subSlug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }

    // Unknown subdomain — fall through, Next.js will 404.
  }

  // ── 1. Custom Domain Routing ────────────────────────────────────────────
  //
  // When a verified merchant domain (e.g. myshop.com) hits the server,
  // look it up in the `domains` table and rewrite transparently to
  // /store/[slug].  The visitor never sees the internal path.
  //
  // Uses the service-role client (bypasses RLS) because this lookup must
  // work for unauthenticated storefront visitors.
  //
  // Cache: same 60 s TTL as subdomain routing above.
  if (
    !isPlatformHost(hostname) &&
    !merchantSubdomain &&  // already handled in Step 0
    !pathname.startsWith("/store/") &&
    !pathname.startsWith("/_next/") &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const cacheKey = `domain:${hostname}`;
    let domainSlug = getCachedSlug(cacheKey);

    if (domainSlug === undefined) {
      const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { cookies: { getAll: () => [], setAll: () => {} } }
      );

      const { data: domainRow } = await adminClient
        .from("domains")
        .select("store_id, stores(slug)")
        .eq("domain", hostname)
        .eq("is_verified", true)
        .maybeSingle();

      const storeRecord = domainRow?.stores as unknown as
        | { slug: string }
        | { slug: string }[]
        | null;
      domainSlug =
        (Array.isArray(storeRecord)
          ? storeRecord[0]?.slug
          : storeRecord?.slug) ?? null;
      setCachedSlug(cacheKey, domainSlug);
    }

    if (domainSlug) {
      const url = request.nextUrl.clone();
      url.pathname = `/store/${domainSlug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }

    // Unknown / unverified custom domain — fall through and let Next.js 404.
  }

  // ── 1b. Bot Protection ─────────────────────────────────────────────────
  //
  // Block known non-browser clients from submitting checkout forms.
  // Applied only to checkout paths — crawlers may still index product pages.
  // The server-action mutation layer has a separate IP rate limiter as well.
  if (
    pathname.includes("/checkout") &&
    isBotUserAgent(request.headers.get("user-agent"))
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ── 2. Store Suspension Enforcement ────────────────────────────────────
  //
  // Prevent shoppers from accessing a storefront whose merchant is
  // suspended or whose trial period has ended.
  //
  // The /suspended page itself is exempt to avoid an infinite redirect loop.
  if (
    pathname.startsWith("/store/") &&
    !pathname.match(/^\/store\/[^/]+\/suspended(\/|$)/) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const slugMatch = pathname.match(/^\/store\/([^/]+)/);
    const storeSlug = slugMatch?.[1];

    if (storeSlug) {
      const enforcementClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { cookies: { getAll: () => [], setAll: () => {} } }
      );

      const { data: store } = await enforcementClient
        .from("stores")
        .select("status, subscription_status, trial_ends_at")
        .eq("slug", storeSlug)
        .maybeSingle();

      if (store) {
        const trialExpired =
          store.subscription_status === "trial" &&
          store.trial_ends_at !== null &&
          new Date(store.trial_ends_at) < new Date();

        const isBlocked =
          store.status === "suspended" ||
          store.subscription_status === "suspended" ||
          store.subscription_status === "expired" ||
          trialExpired;

        if (isBlocked) {
          const url = request.nextUrl.clone();
          url.pathname = `/store/${storeSlug}/suspended`;
          return NextResponse.redirect(url);
        }
      }
    }
  }

  // ── 3. Session Refresh ──────────────────────────────────────────────────
  //
  // Must run on every non-redirected request so the Supabase session cookie
  // stays fresh.  The mutable supabaseResponse pattern is required by
  // @supabase/ssr: setAll() updates both the incoming request object and
  // the outgoing response so the browser receives the refreshed cookie.
  //
  // CRITICAL: Always use getUser() here — it validates the JWT against the
  //           Supabase auth server.  Never use getSession(), which only
  //           reads the client-supplied cookie and can be spoofed.
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Skip all remaining auth logic for public paths.
  if (isPublicPath(pathname)) {
    // One exception: bounce already-authenticated users off login/register.
    if (user && (pathname === "/login" || pathname === "/register")) {
      const redirectTo = request.nextUrl.searchParams.get("redirect");
      const url = request.nextUrl.clone();
      url.pathname =
        redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
      url.searchParams.delete("redirect");
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ── 4. Dashboard Guard ──────────────────────────────────────────────────
  //
  // /dashboard/* — any authenticated merchant may access.
  // Unauthenticated visitors are sent to login; the original path is
  // preserved in ?redirect= so the user lands back here after login.
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // ── 5. Admin Guard ──────────────────────────────────────────────────────
  //
  // /admin/* — requires both authentication AND role = 'platform_admin'.
  //
  // The role is read from the `users` table on every admin request.
  // This is intentionally NOT cached: a role change takes effect instantly.
  //
  // Two failure modes:
  //   a) Not logged in            → /login   (with ?redirect= preserved)
  //   b) Logged in, wrong role    → /dashboard  (merchant goes to their area)
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "platform_admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return supabaseResponse;
  }

  // ── 6. API Route Guard ──────────────────────────────────────────────────
  //
  // All data mutations currently use Server Actions — there are no REST
  // endpoints under /api/* that need auth at the middleware layer.
  //
  // Existing route handlers:
  //   /auth/callback          → public  (matched by isPublicPath above)
  //   /store/[slug]/theme.css → public  (matched by isPublicPath above)
  //
  // If you add protected REST endpoints later, enforce them here:
  //
  //   if (pathname.startsWith("/api/admin")) { /* require platform_admin */ }
  //   if (pathname.startsWith("/api/merchant")) { /* require user */ }

  return supabaseResponse;
}

// ── Matcher ────────────────────────────────────────────────────────────────────
//
// Exclude Next.js internals and static assets so the middleware only runs
// on real application paths.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot|map)$).*)",
  ],
};
