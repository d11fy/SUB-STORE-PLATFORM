"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Eye, AlertTriangle } from "lucide-react";
import { useCartStore, type CartItem } from "@/lib/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    store_id: string;
    name: string;
    slug: string;
    price: number;
    compare_price: number | null;
    stock_quantity: number;
    track_inventory: boolean;
  };
  storeSlug: string;
  primaryImage: string | null;
  currency: string;
}

export function ProductCard({ product, storeSlug, primaryImage, currency }: ProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const forceAddItem = useCartStore((state) => state.forceAddItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isOutOfStock = product.track_inventory && product.stock_quantity <= 0;
  const hasDiscount = product.compare_price !== null && product.compare_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    const cartItem: CartItem = {
      product_id: product.id,
      store_id: product.store_id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sale_price: hasDiscount ? product.price : null,
      image: primaryImage,
      quantity: 1,
      stock: product.stock_quantity,
    };

    const res = addItem(cartItem);

    if (res.success) {
      toast.success(`تمت إضافة "${product.name}" إلى السلة بنجاح! 🎉`);
    } else if (res.requiresClearConfirm) {
      setShowConfirm(true);
    }
  };

  const handleForceAdd = () => {
    const cartItem: CartItem = {
      product_id: product.id,
      store_id: product.store_id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sale_price: hasDiscount ? product.price : null,
      image: primaryImage,
      quantity: 1,
      stock: product.stock_quantity,
    };

    forceAddItem(cartItem);
    setShowConfirm(false);
    toast.success(`تم تفريغ السلة السابقة وبدء سلة جديدة لمتجر آخر! 🎉`);
  };

  return (
    <div className="group relative bg-card border border-border hover:border-primary/30 rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
      {/* Product Image & Badges */}
      <Link href={`/store/${storeSlug}/product/${product.slug}`} className="block relative aspect-square rounded-xl overflow-hidden bg-muted border border-border mb-4">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 bg-muted">
            📦
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
          {hasDiscount && (
            <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-md font-numbers shadow-glow">
              خصم {discountPercent}%-
            </span>
          )}
          {isOutOfStock && (
            <span className="text-[10px] font-bold bg-destructive text-white px-2 py-0.5 rounded-md">
              نفذت الكمية
            </span>
          )}
        </div>

        {/* Hover overlay details button */}
        <div className="absolute inset-0 bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-white/80 hover:bg-white border border-border flex items-center justify-center text-foreground transition-all">
            <Eye className="h-4 w-4" />
          </span>
        </div>
      </Link>

      {/* Info */}
      <div className="space-y-2 text-right">
        <Link href={`/store/${storeSlug}/product/${product.slug}`} className="block">
          <h3 className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-1 leading-tight">
            {product.name}
          </h3>
        </Link>

        {/* Prices */}
        <div className="flex items-baseline justify-end gap-2">
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through font-numbers">
              {formatCurrency(product.compare_price!, currency)}
            </span>
          )}
          <span className="text-sm font-black text-emerald-600 font-numbers">
            {formatCurrency(product.price, currency)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={cn(
            "w-full py-2.5 rounded-xl text-xs font-bold font-cairo flex items-center justify-center gap-2 transition-all cursor-pointer",
            isOutOfStock
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-muted/50 border border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          )}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          إضافة للسلة
        </button>
      </div>

      {/* Confirm different store cart reset dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border shadow-xl p-6 rounded-2xl max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-foreground leading-snug">
              سلتك تحتوي على منتجات من متجر آخر!
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              لا يمكنك إضافة منتجات من متاجر مختلفة في نفس الطلب. هل ترغب في تفريغ سلتك الحالية والبدء بسلة جديدة لهذا المتجر؟
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleForceAdd}
                className="flex-1 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/95 transition-all cursor-pointer"
              >
                نعم، تفريغ السلة والبدء
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-muted border border-border text-foreground text-xs font-semibold rounded-xl hover:bg-muted/80 transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
