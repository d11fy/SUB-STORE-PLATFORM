// D4: Dynamic CSS endpoint — serves sanitized custom CSS per store.
// Reads from store_theme_settings.custom_css (top-level column) which is the
// single source of truth for live CSS — same pattern as primary_color/font_family.
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeCustomCss } from "@/lib/themes/css-sanitizer";

export const runtime = "nodejs";

const EMPTY = new NextResponse("", {
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

  const { data } = await supabase
    .from("stores")
    .select("store_theme_settings(custom_css)")
    .eq("slug", slug)
    .maybeSingle();

  const rows = data?.store_theme_settings;
  const row = Array.isArray(rows) ? rows[0] : rows;
  const rawCss: string = (row as any)?.custom_css ?? "";

  if (!rawCss.trim()) return EMPTY;

  // Re-sanitize on read as a defense-in-depth measure.
  const { css } = sanitizeCustomCss(rawCss);
  if (!css) return EMPTY;

  return new NextResponse(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
