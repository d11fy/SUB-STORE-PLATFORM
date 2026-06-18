"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Zap, Plus, Minus, AlertTriangle } from "lucide-react";
import { useCartStore, type CartItem } from "@/lib/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductDetailClientProps {
  product: any;
  storeSlug: string;
  primaryImage: string | null;
  currency: string;
}

export function ProductDetailClient({
  product,
  storeSlug,
  primaryImage,
  currency,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const forceAddItem = useCartStore((state) => state.forceAddItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isOutOfStock = product.track_inventory && product.stock_quantity <= 0;
  const hasDiscount = product.compare_price !== null && product.compare_price > product.price;

  const handleIncrement = () => {
    if (product.track_inventory && quantity >= product.stock_quantity) {
      toast.error(`عذراً، الكمية المتوفرة في المخزون هي ${product.stock_quantity} فقط`);
      return;
    }
    setQuantity((q) => q + 1);
  };

  const handleDecrement = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    const cartItem: CartItem = {
      product_id: product.id,
      store_id: product.store_id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sale_price: hasDiscount ? product.price : null,
      image: primaryImage,
      quantity: quantity,
      stock: product.stock_quantity,
    };

    const res = addItem(cartItem);

    if (res.success) {
      toast.success(`تمت إضافة ${quantity} من "${product.name}" إلى السلة بنجاح! 🎉`);
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
      quantity: quantity,
      stock: product.stock_quantity,
    };

    forceAddItem(cartItem);
    setShowConfirm(false);
    toast.success(`تم تفريغ السلة السابقة وبدء سلة جديدة لمتجر آخر! 🎉`);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;

    const cartItem: CartItem = {
      product_id: product.id,
      store_id: product.store_id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sale_price: hasDiscount ? product.price : null,
      image: primaryImage,
      quantity: quantity,
      stock: product.stock_quantity,
    };

    // Always force-add to ensure this item is in the cart (clears other-store items)
    forceAddItem(cartItem);
    router.push(`/store/${storeSlug}/checkout`);
  };

  return (
    <div className="space-y-6 text-right font-cairo">
      {/* Stock status */}
      <div>
        {isOutOfStock ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            نفذت الكمية ❌
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            متوفر في المخزون ✓
          </span>
        )}
      </div>

      {/* Title & Price */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground leading-tight">
          {product.name}
        </h1>
        {product.sku && (
          <p className="text-xs text-muted-foreground">رمز المنتج (SKU): {product.sku}</p>
        )}
        <div className="flex items-center justify-end gap-3 pt-2">
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through font-numbers">
              {formatCurrency(product.compare_price!, currency)}
            </span>
          )}
          <span className="text-xl sm:text-2xl font-black text-emerald-600 font-numbers">
            {formatCurrency(product.price, currency)}
          </span>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="border-t border-border pt-6 space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">التفاصيل والوصف</h4>
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
      )}

      {/* Quantity Selector & Add button */}
      {!isOutOfStock && (
        <div className="border-t border-border pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground font-medium">الكمية المطلوبة</span>
            <div className="flex items-center bg-muted border border-border rounded-xl p-1">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center font-bold font-numbers text-sm text-foreground">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleBuyNow}
              className="w-full py-4 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-[0_4px_20px_rgba(27,79,216,0.35)] flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              شراء الآن
            </button>

            <button
              onClick={handleAddToCart}
              className="w-full py-3 bg-muted border border-border text-foreground font-bold text-sm rounded-xl hover:bg-muted/80 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              إضافة إلى السلة
            </button>
          </div>
        </div>
      )}

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
