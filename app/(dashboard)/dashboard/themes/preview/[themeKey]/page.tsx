import { redirect } from "next/navigation";
import { getThemesList } from "@/actions/themes";
import { getMerchantStoreWithPackage } from "@/actions/store-utils";
import { THEME_DEMO_DATA, type DemoThemeKey } from "@/lib/themes/theme-demo-data";
import { PreviewClient } from "./preview-client";
import type { StoreWithTheme } from "@/components/storefront/themes/theme-types";
import type { Category, Store } from "@/lib/types/database";

interface Props {
  params: Promise<{ themeKey: string }>;
}

export function generateMetadata() {
  return { title: "معاينة القالب" };
}

export default async function ThemePreviewPage({ params }: Props) {
  const { themeKey } = await params;

  // Validate themeKey
  const demoData = THEME_DEMO_DATA[themeKey as DemoThemeKey];
  if (!demoData) redirect("/dashboard/themes");

  // Fetch real themes list — need the Theme object (id, slug, etc.)
  const themes = await getThemesList();
  const theme = themes.find((t) => t.slug === themeKey);
  if (!theme) redirect("/dashboard/themes");

  // Fetch merchant store for package gating only (NOT used in demo rendering)
  const store = await getMerchantStoreWithPackage();
  const pkgSlug = store.packages?.slug || "starter";
  const isLocked =
    pkgSlug === "starter" && themeKey !== "fashion" && themeKey !== "blank";

  // Construct StoreWithTheme: demo store data + real Theme from DB
  // The real Theme provides correct slug so ThemeRenderer picks the right component
  const storeWithTheme: StoreWithTheme = {
    ...(demoData.store as unknown as Store),
    themes: theme,
  };

  return (
    <PreviewClient
      themeKey={themeKey as DemoThemeKey}
      themeId={theme.id}
      themeName={theme.name}
      store={storeWithTheme}
      categories={demoData.categories as unknown as Category[]}
      products={demoData.products}
      settings={demoData.settings}
      isLocked={isLocked}
    />
  );
}
