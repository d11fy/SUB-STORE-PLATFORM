import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PageSectionRenderer } from "@/components/storefront/pages/page-section-renderer";
import { RESERVED_SLUGS } from "@/lib/validations/pages";
import type { SectionConfig } from "@/lib/themes/customization-types";

interface CustomPageProps {
  params: Promise<{ slug: string; pageSlug: string }>;
}

export async function generateMetadata({ params }: CustomPageProps) {
  const { slug, pageSlug } = await params;
  if (RESERVED_SLUGS.has(pageSlug)) return {};

  const supabase = createAdminClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!store) return {};

  const { data: page } = await supabase
    .from("store_pages")
    .select("title, meta_title, meta_description")
    .eq("store_id", store.id)
    .eq("slug", pageSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!page) return {};

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || undefined,
  };
}

export default async function CustomStorePage({ params }: CustomPageProps) {
  const { slug, pageSlug } = await params;

  // Belt-and-suspenders: Next.js static routes take precedence, but guard anyway
  if (RESERVED_SLUGS.has(pageSlug)) {
    notFound();
  }

  const supabase = createAdminClient();

  // Only fetch store.id — layout.tsx already handles the full theme shell
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (storeError || !store) notFound();

  // Fetch the published custom page
  const { data: page, error: pageError } = await supabase
    .from("store_pages")
    .select("title, sections_config")
    .eq("store_id", store.id)
    .eq("slug", pageSlug)
    .eq("status", "published")
    .maybeSingle();

  if (pageError || !page) notFound();

  // Parse sections_config safely — stored as Json (JSONB), runtime shape is SectionConfig[]
  const rawSections = page.sections_config;
  const sections: SectionConfig[] = Array.isArray(rawSections)
    ? (rawSections as unknown as SectionConfig[])
    : [];

  // Layout.tsx (parent segment) already renders ThemeHeader + ThemeFooter —
  // this component only renders the page body content.
  return (
    <div className="min-h-[60vh]" dir="rtl">
      {page.title && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4 text-right">
          <h1 className="text-2xl font-black text-foreground font-cairo">{page.title}</h1>
        </div>
      )}
      <PageSectionRenderer sections={sections} storeSlug={slug} />
    </div>
  );
}
