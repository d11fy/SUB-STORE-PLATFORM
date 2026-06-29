"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";

const AUTO_REFRESH_INTERVAL = 60; // seconds

interface MonitoringRefreshProps {
  fetchedAt: string; // ISO string from server
}

export function MonitoringRefresh({ fetchedAt }: MonitoringRefreshProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
    setCountdown(AUTO_REFRESH_INTERVAL);
  }, [router]);

  // Update "X seconds ago" display every second
  useEffect(() => {
    const fetchedMs = new Date(fetchedAt).getTime();
    const tick = () => setSecondsAgo(Math.floor((Date.now() - fetchedMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fetchedAt]);

  // Auto-refresh countdown
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          refresh();
          return AUTO_REFRESH_INTERVAL;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const ageLabel =
    secondsAgo < 60
      ? `${secondsAgo} ث`
      : `${Math.floor(secondsAgo / 60)} د`;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground hidden sm:block">
        آخر تحديث: {ageLabel} · تحديث تلقائي بعد {countdown}ث
      </span>
      <button
        onClick={refresh}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
        تحديث
      </button>
    </div>
  );
}
