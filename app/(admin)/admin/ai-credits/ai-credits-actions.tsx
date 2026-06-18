"use client";

import { useState } from "react";
import { addManualAiCredits } from "@/actions/admin";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export function AddCreditsAction({ storeId }: { storeId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseInt(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    setIsLoading(true);
    try {
      await addManualAiCredits(storeId, parsedAmount);
      toast.success(`تمت إضافة ${parsedAmount} رصيد بنجاح`);
      setAmount("");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إضافة الرصيد");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleAdd} className="flex items-center gap-2 justify-end">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="الكمية"
        className="flex rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-20 h-8 text-xs text-center dir-ltr"
        min={1}
      />
      <button 
        type="submit"
        disabled={isLoading || !amount}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-transparent hover:bg-accent hover:text-accent-foreground text-xs h-8 px-3 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
      >
        {isLoading ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <Plus className="w-3 h-3 ml-1" />}
        إضافة
      </button>
    </form>
  );
}
