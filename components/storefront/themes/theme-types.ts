import type { Store, Category, Product, StoreThemeSettings, Theme } from "@/lib/types/database";

export interface ProductWithImages extends Product {
  product_images?: {
    id: string;
    url: string;
    is_primary: boolean;
  }[];
}

export type StoreWithTheme = Store & {
  themes: Theme | null;
};

export interface StorefrontThemeProps {
  store: StoreWithTheme;
  categories: Category[];
  products: ProductWithImages[];
  settings: StoreThemeSettings;
}
