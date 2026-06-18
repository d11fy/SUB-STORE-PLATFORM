"use client";

import { useState } from "react";
import { updateStoreStatus } from "@/actions/admin";
import { toast } from "sonner";
import { Loader2, Play, Pause, AlertCircle } from "lucide-react";

export function StoreStatusActions({ storeId, currentStatus }: { storeId: string, currentStatus: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleStatusChange(status: "active" | "suspended" | "pending") {
    setIsLoading(true);
    try {
      await updateStoreStatus(storeId, status);
      toast.success("تم تحديث حالة المتجر بنجاح");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button 
        disabled={isLoading || currentStatus === "active"}
        onClick={() => handleStatusChange("active")}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
      >
        {isLoading && currentStatus !== "active" ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Play className="w-4 h-4 ml-2" />}
        تفعيل المتجر
      </button>

      <button 
        disabled={isLoading || currentStatus === "suspended"}
        onClick={() => handleStatusChange("suspended")}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
      >
        {isLoading && currentStatus !== "suspended" ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Pause className="w-4 h-4 ml-2" />}
        إيقاف المتجر
      </button>

      <button 
        disabled={isLoading || currentStatus === "pending"}
        onClick={() => handleStatusChange("pending")}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
      >
        {isLoading && currentStatus !== "pending" ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <AlertCircle className="w-4 h-4 ml-2" />}
        وضع قيد المراجعة
      </button>
    </div>
  );
}
