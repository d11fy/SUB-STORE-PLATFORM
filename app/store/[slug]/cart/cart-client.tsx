"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CartClientProps {
  storeSlug: string;
  currency: string;
}

export function CartClient({ storeSlug, currency }: CartClientProps) {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, updateQuantity, clearCart, getCartTotal } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const subtotal = getCartTotal();

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6 animate-fade-in font-cairo">
        <div className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground text-3xl">
          🛒
        </div>
        <h2 className="text-xl font-bold text-foreground">سلة المشتريات فارغة</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          تبدو سلة المشتريات فارغة حالياً. ابدأ بتصفح منتجات متجرنا الرائعة وأضف ما ترغب به إلى السلة!
        </p>
        <Link
          href={`/store/${storeSlug}/products`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/95 transition-all shadow-[0_4px_20px_rgba(27,79,216,0.3)] cursor-pointer"
        >
          تصفح المنتجات
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in font-cairo text-right">
      {/* Items List (2/3 width) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-card border border-border rounded-2xl overflow-hidden p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <button
              onClick={() => {
                clearCart();
                toast.success("تم تفريغ السلة بنجاح");
              }}
              className="text-xs font-semibold text-destructive hover:underline cursor-pointer"
            >
              تفريغ السلة كاملة
            </button>
            <h2 className="text-base font-bold text-foreground">المنتجات المضافة ({items.length})</h2>
          </div>

          <div className="divide-y divide-border">
            {items.map((item) => {
              const price = item.sale_price !== null ? item.sale_price : item.price;
              const hasDiscount = item.sale_price !== null && item.price > item.sale_price;

              return (
                <div key={item.product_id} className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                  {/* Left (Product Controls/Action) */}
                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 order-3 sm:order-1">
                    {/* Item Total */}
                    <span className="font-bold text-emerald-600 text-sm font-numbers">
                      {formatCurrency(price * item.quantity, currency)}
                    </span>

                    {/* Quantity Selector */}
                    <div className="flex items-center bg-muted border border-border rounded-xl p-1">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-foreground text-xs font-bold font-numbers">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          if (item.quantity >= item.stock) {
                            toast.error(`عذراً، الكمية المتوفرة في المخزون هي ${item.stock} فقط`);
                            return;
                          }
                          updateQuantity(item.product_id, item.quantity + 1);
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Delete Icon */}
                    <button
                      onClick={() => {
                        removeItem(item.product_id);
                        toast.success(`تم حذف "${item.name}" من السلة`);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1.5 hover:bg-destructive/10 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Right (Product Info / Image) */}
                  <div className="flex items-center gap-4 order-1 sm:order-2">
                    {/* Details */}
                    <div>
                      <h3 className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-1">
                        <Link href={`/store/${storeSlug}/product/${item.slug}`}>{item.name}</Link>
                      </h3>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        {hasDiscount && (
                          <span className="text-[10px] text-muted-foreground line-through font-numbers">
                            {formatCurrency(item.price, currency)}
                          </span>
                        )}
                        <span className="text-xs text-emerald-600 font-bold font-numbers">
                          {formatCurrency(price, currency)}
                        </span>
                      </div>
                    </div>

                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg">
                          📦
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Back Button */}
        <Link
          href={`/store/${storeSlug}/products`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <span>العودة للتسوق</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Cart Summary Box (1/3 width) */}
      <div className="space-y-4">
        <div className="bg-card border border-border p-6 rounded-2xl space-y-6 shadow-card">
          <h3 className="font-bold text-foreground text-base border-b border-border pb-3">ملخص الفاتورة</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">عدد المنتجات</span>
              <span className="font-bold text-foreground font-numbers">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">التوصيل والشحن</span>
              <span className="text-primary font-bold text-[10px]">يُحسب عند الدفع</span>
            </div>

            <div className="border-t border-border pt-4 flex justify-between items-center">
              <span className="font-bold text-foreground text-sm">المجموع الفرعي</span>
              <span className="font-black text-emerald-600 text-base font-numbers">
                {formatCurrency(subtotal, currency)}
              </span>
            </div>
          </div>

          <Link
            href={`/store/${storeSlug}/checkout`}
            className="w-full py-3.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-[0_4px_20px_rgba(27,79,216,0.3)] flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            الانتقال لإتمام الطلب
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
