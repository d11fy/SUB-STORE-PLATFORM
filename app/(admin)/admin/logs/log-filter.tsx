"use client";

import { useRouter } from "next/navigation";

export function LogFilter({
  actionTypes,
  currentAction,
  actionLabels,
}: {
  actionTypes: string[];
  currentAction?: string;
  actionLabels: Record<string, string>;
}) {
  const router = useRouter();
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">فلترة حسب:</span>
      <select
        className="h-9 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        defaultValue={currentAction ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          const url = v ? `?action=${v}` : "?";
          router.push(url);
        }}
      >
        <option value="">كل الإجراءات</option>
        {actionTypes.map((a) => (
          <option key={a} value={a}>
            {actionLabels[a] ?? a}
          </option>
        ))}
      </select>
    </div>
  );
}
