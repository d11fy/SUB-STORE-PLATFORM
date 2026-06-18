import { getThemesList } from "@/actions/themes";
import { getMerchantStoreWithPackage } from "@/actions/store-utils";
import { ThemesClient } from "./themes-client";

export const metadata = {
  title: "ثيمات المتجر",
};

export default async function ThemesPage() {
  const [store, themes] = await Promise.all([
    getMerchantStoreWithPackage(),
    getThemesList(),
  ]);

  const currentThemeId = store.current_theme_id;

  return (
    <ThemesClient
      themes={themes}
      currentThemeId={currentThemeId}
      store={store}
    />
  );
}
