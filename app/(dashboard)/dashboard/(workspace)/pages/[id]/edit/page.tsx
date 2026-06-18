import { getStorePageAction } from "@/actions/store-pages";
import { getMerchantStoreWithPackage } from "@/actions/store-utils";
import { notFound } from "next/navigation";
import { EditPageClient } from "./edit-client";
import type { SectionConfig } from "@/lib/themes/customization-types";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "تعديل الصفحة",
};

export default async function EditPagePage({ params }: EditPageProps) {
  const { id } = await params;

  const [store, { page, error }] = await Promise.all([
    getMerchantStoreWithPackage(),
    getStorePageAction(id),
  ]);

  if (error || !page) notFound();

  // Parse sections_config safely — stored as Json (JSONB), runtime shape is SectionConfig[]
  const rawSections = page.sections_config;
  const sections: SectionConfig[] = Array.isArray(rawSections)
    ? (rawSections as unknown as SectionConfig[])
    : [];

  return (
    <EditPageClient
      page={page}
      initialSections={sections}
      storeSlug={store.slug}
    />
  );
}
