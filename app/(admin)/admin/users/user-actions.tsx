"use client";

import { useState, useTransition } from "react";
import { suspendMerchantStores, reactivateMerchantStores } from "@/actions/admin";
import { toast } from "sonner";

interface UserActionsProps {
  userId: string;
  stores: Array<{ id: string; status: string }>;
}

export function UserActions({ userId, stores }: UserActionsProps) {
  const [isPending, startTransition] = useTransition();
  const hasActiveStores = stores.some((s) => s.status === "active");
  const hasSuspendedStores = stores.some((s) => s.status === "suspended");

  const handleSuspend = () => {
    startTransition(async () => {
      try {
        await suspendMerchantStores(userId);
        toast.success("تم تعليق جميع المتاجر بنجاح");
      } catch {
        toast.error("فشل تعليق المتاجر");
      }
    });
  };

  const handleReactivate = () => {
    startTransition(async () => {
      try {
        await reactivateMerchantStores(userId);
        toast.success("تم إعادة تفعيل المتاجر بنجاح");
      } catch {
        toast.error("فشل إعادة التفعيل");
      }
    });
  };

  if (stores.length === 0) return <span className="text-xs text-muted-foreground">لا متاجر</span>;

  return (
    <div className="flex items-center gap-2">
      {hasActiveStores && (
        <button
          onClick={handleSuspend}
          disabled={isPending}
          className="inline-flex items-center h-7 px-2.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
        >
          تعليق
        </button>
      )}
      {hasSuspendedStores && (
        <button
          onClick={handleReactivate}
          disabled={isPending}
          className="inline-flex items-center h-7 px-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        >
          تفعيل
        </button>
      )}
    </div>
  );
}
