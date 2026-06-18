import { getStorePagesAction } from "@/actions/store-pages";
import { getMerchantStoreWithPackage } from "@/actions/store-utils";
import { PagesListClient } from "./pages-list-client";

export const metadata = {
  title: "الصفحات",
};

export default async function PagesPage() {
  const [store, { pages, error }] = await Promise.all([
    getMerchantStoreWithPackage(),
    getStorePagesAction(),
  ]);

  return (
    <PagesListClient
      pages={pages}
      storeSlug={store.slug}
      fetchError={error}
    />
  );
}
