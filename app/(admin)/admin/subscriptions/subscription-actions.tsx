"use client";

import { useState } from "react";
import { extendTrial } from "@/actions/admin";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export function ExtendTrialAction({ subscriptionId, storeId }: { subscriptionId: string, storeId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleExtend(days: number) {
    setIsLoading(true);
    try {
      await extendTrial(subscriptionId, storeId, days);
      toast.success(`تم تمديد التجربة المجانية لمدة ${days} أيام بنجاح`);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء التمديد");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        disabled={isLoading}
        onClick={() => handleExtend(7)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 text-xs h-8"
      >
        {isLoading ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <Plus className="w-3 h-3 ml-1" />}
        7 أيام
      </button>
      <button 
        disabled={isLoading}
        onClick={() => handleExtend(14)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 text-xs h-8"
      >
        {isLoading ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <Plus className="w-3 h-3 ml-1" />}
        14 يوم
      </button>
    </div>
  );
}
