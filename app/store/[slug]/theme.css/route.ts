// D4: Dynamic CSS endpoint — serves sanitized, tenant-scoped custom CSS per store.
//
// Pipeline on every request:
//   1. Fetch raw CSS from store_theme_settings.custom_css (single source of truth)
//   2. Re-sanitize (defense-in-depth against anything that bypassed the save action)
//   3. Scope every rule under .store-{storeId} (tenant isolation)
//
// Scoping ensures merchant CSS can ONLY affect elements inside their storefront
// root div (.store-{storeId}) and never leaks into platform UI or other tenants.
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeCustomCss, scopeCustomCss } from "@/lib/themes/css-sanitizer";

export const runtime = "nodejs";

const EMPTY_CSS = new NextResponse("", {
  headers: {
    "Content-Type": "text/css; charset=utf-8",
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  },
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // Fetch store id + custom CSS in one query.
  // store.id is required to generate the tenant-specific scope selector.
  const { data } = await supabase
    .from("stores")
    .select("id, store_theme_settings(custom_css)")
    .eq("slug", slug)
    .maybeSingle();

  if (!data?.id) return EMPTY_CSS;

  const storeId = data.id;
  const rows = data.store_theme_settings;
  const row = Array.isArray(rows) ? rows[0] : rows;
  const rawCss: string = (row as any)?.custom_css ?? "";

  if (!rawCss.trim()) return EMPTY_CSS;

  // Stage 1: sanitize — strips javascript:, expression(), @import, etc.
  const { css: sanitized } = sanitizeCustomCss(rawCss);
  if (!sanitized) return EMPTY_CSS;

  // Stage 2: scope — wraps every rule under .store-{storeId}
  // so merchant CSS cannot affect elements outside the storefront root div.
  const scoped = scopeCustomCss(sanitized, storeId);
  if (!scoped) return EMPTY_CSS;

  return new NextResponse(scoped, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
