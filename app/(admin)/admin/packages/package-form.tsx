"use client";

import { useState } from "react";
import { updatePackageLimits } from "@/actions/admin";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PackageFormProps {
  pkgId: string;
  maxProducts: number | null;
  maxAiCredits: number;
}

export function PackageForm({ pkgId, maxProducts, maxAiCredits }: PackageFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState(maxProducts === null ? "" : maxProducts.toString());
  const [aiCredits, setAiCredits] = useState(maxAiCredits.toString());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const parsedProducts = products.trim() === "" ? null : parseInt(products);
    const parsedAi = parseInt(aiCredits);

    if (isNaN(parsedAi)) {
      toast.error("رصيد الذكاء الاصطناعي يجب أن يكون رقماً");
      setIsLoading(false);
      return;
    }

    try {
      await updatePackageLimits(pkgId, { 
        max_products: parsedProducts, 
        max_ai_credits: parsedAi 
      });
      toast.success("تم تحديث حدود الباقة بنجاح");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تحديث الباقة");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4 pt-4 border-t border-border">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium">الحد الأقصى للمنتجات (اتركه فارغاً للا محدود)</label>
          <input 
            type="number" 
            value={products} 
            onChange={(e) => setProducts(e.target.value)} 
            placeholder="مثال: 50"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left dir-ltr"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium">رصيد الذكاء الاصطناعي الشهري</label>
          <input 
            type="number" 
            required 
            value={aiCredits} 
            onChange={(e) => setAiCredits(e.target.value)} 
            placeholder="مثال: 500"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left dir-ltr"
          />
        </div>
      </div>
      <button 
        type="submit" 
        disabled={isLoading} 
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        حفظ التعديلات
      </button>
    </form>
  );
}
