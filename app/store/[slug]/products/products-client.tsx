"use client";

import { useState } from "react";
import { Search, PackageX } from "lucide-react";
import { ProductCard } from "../components/product-card";
import { cn } from "@/lib/utils";

interface ProductsClientProps {
  products: any[];
  categories: any[];
  storeSlug: string;
  currency: string;
  initialCategoryId?: string;
}

export function ProductsClient({
  products,
  categories,
  storeSlug,
  currency,
  initialCategoryId = "",
}: ProductsClientProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                          (product.description && product.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === "" || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 font-cairo">
      {/* Search & Filter Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-xl bg-input border border-border hover:border-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-right"
          />
          <Search className="absolute top-1/2 -translate-y-1/2 right-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Categories Horizontal Scroller */}
        <div className="w-full md:w-auto overflow-x-auto flex gap-2 no-scrollbar py-1 justify-start md:justify-end">
          <button
            onClick={() => setSelectedCategory("")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
              selectedCategory === ""
                ? "bg-primary border-primary text-white shadow-glow"
                : "bg-muted border-border text-muted-foreground hover:text-foreground"
            )}
          >
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
                selectedCategory === cat.id
                  ? "bg-primary border-primary text-white shadow-glow"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const primaryImage =
              product.product_images?.find((img: any) => img.is_primary)?.url ||
              product.product_images?.[0]?.url ||
              null;
            return (
              <ProductCard
                key={product.id}
                product={product}
                storeSlug={storeSlug}
                primaryImage={primaryImage}
                currency={currency}
              />
            );
          })}
        </div>
      ) : products.length === 0 ? (
        /* Store has no products at all */
        <div className="p-12 bg-card border border-border rounded-2xl text-center space-y-4 max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <PackageX className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">لا توجد منتجات بعد</h3>
          <p className="text-muted-foreground text-xs">
            لم يُضف هذا المتجر أي منتجات حتى الآن. تحقق لاحقاً!
          </p>
        </div>
      ) : (
        /* Filtered / search returned no results */
        <div className="p-12 bg-card border border-border rounded-2xl text-center space-y-4 max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">لم نجد أي نتائج</h3>
          <p className="text-muted-foreground text-xs">
            لا توجد منتجات تطابق كلمة البحث أو التصنيف المحدد. جرّب خيارات أخرى.
          </p>
        </div>
      )}
    </div>
  );
}
