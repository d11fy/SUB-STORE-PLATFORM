"use client";

import { useState, useTransition } from "react";
import {
  Code2,
  AlertTriangle,
  CheckCircle,
  Upload,
  Trash2,
  Info,
} from "lucide-react";
import {
  saveCssDraftAction,
  publishCssDraftAction,
  discardCssDraftAction,
} from "@/actions/css-customizer";

const MAX_CSS_CHARS = 5_000;

interface TabCssProps {
  liveCss: string;
  draftCss: string;
}

export function TabCss({ liveCss, draftCss }: TabCssProps) {
  const [css, setCss] = useState(draftCss !== "" ? draftCss : liveCss);
  const [violations, setViolations] = useState<string[]>([]);
  const [hasDraft, setHasDraft] = useState(draftCss !== "");
  const [statusMsg, setStatusMsg] = useState<{
    text: string;
    type: "ok" | "err";
  } | null>(null);

  const [isPendingSave, startSave] = useTransition();
  const [isPendingPublish, startPublish] = useTransition();
  const [isPendingDiscard, startDiscard] = useTransition();

  const charCount = css.length;
  const isOverLimit = charCount > MAX_CSS_CHARS;
  const isDirty = css !== (draftCss !== "" ? draftCss : liveCss);

  function handleSave() {
    startSave(async () => {
      setStatusMsg(null);
      setViolations([]);
      const result = await saveCssDraftAction(css);
      if (result.success) {
        setHasDraft(true);
        setStatusMsg({ text: "تم حفظ مسودة CSS", type: "ok" });
        if (result.violations.length) setViolations(result.violations);
      } else {
        setStatusMsg({ text: result.error ?? "خطأ في الحفظ", type: "err" });
      }
    });
  }

  function handlePublish() {
    startPublish(async () => {
      setStatusMsg(null);
      const result = await publishCssDraftAction();
      if (result.success) {
        setHasDraft(false);
        setStatusMsg({ text: "تم نشر CSS في المتجر الحي", type: "ok" });
      } else {
        setStatusMsg({ text: result.error ?? "خطأ في النشر", type: "err" });
      }
    });
  }

  function handleDiscard() {
    startDiscard(async () => {
      const result = await discardCssDraftAction();
      if (result.success) {
        setCss(liveCss);
        setHasDraft(false);
        setViolations([]);
        setStatusMsg({ text: "تم تجاهل مسودة CSS", type: "ok" });
      } else {
        setStatusMsg({ text: result.error ?? "خطأ", type: "err" });
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-bold font-cairo">CSS مخصص</span>
          {hasDraft && (
            <span className="inline-flex items-center px-1.5 py-0 text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 rounded-full">
              مسودة
            </span>
          )}
        </div>
        <span
          className={`text-[10px] tabular-nums font-mono px-2 py-0.5 rounded border ${
            isOverLimit
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {charCount.toLocaleString("ar-EG")} / {MAX_CSS_CHARS.toLocaleString("ar-EG")}
        </span>
      </div>

      {/* Info banner */}
      <div className="flex gap-2 text-xs bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
        <Info className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
        <div className="text-muted-foreground">
          <span className="font-semibold text-blue-700">مسموح:</span>{" "}
          خصائص CSS عادية (colors، spacing، borders، shadows)
          <span className="mx-1.5 opacity-40">·</span>
          <span className="font-semibold text-rose-600">محظور:</span>{" "}
          url() · @import · expression() والكود التنفيذي
        </div>
      </div>

      {/* Code editor */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
        <textarea
          value={css}
          onChange={(e) => {
            setCss(e.target.value);
            setStatusMsg(null);
          }}
          placeholder={`.store-section {\n  border-radius: 12px;\n}\n\n.product-card {\n  box-shadow: 0 4px 20px rgba(0,0,0,0.08);\n}`}
          className="w-full h-52 resize-none bg-transparent text-zinc-100 placeholder:text-zinc-600 font-mono text-xs leading-relaxed px-4 py-3 outline-none"
          dir="ltr"
          spellCheck={false}
        />
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            تم حذف أكواد غير مسموحة تلقائياً
          </div>
          {violations.map((v, i) => (
            <p key={i} className="text-xs text-amber-600 pr-5">
              • {v}
            </p>
          ))}
        </div>
      )}

      {/* Status message */}
      {statusMsg && violations.length === 0 && (
        <div
          className={`flex items-center gap-1.5 text-xs font-medium ${
            statusMsg.type === "ok" ? "text-emerald-600" : "text-destructive"
          }`}
        >
          {statusMsg.type === "ok" ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
          {statusMsg.text}
        </div>
      )}

      {/* Draft-only notice */}
      <p className="text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2 leading-relaxed">
        التعديلات تُحفظ كمسودة — لن تظهر في المتجر الحي حتى تضغط "نشر CSS".
      </p>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPendingSave || isOverLimit || (!isDirty && hasDraft)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPendingSave ? "جاري الحفظ..." : "حفظ كمسودة"}
        </button>

        <button
          type="button"
          onClick={handlePublish}
          disabled={isPendingPublish || !hasDraft}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-3.5 w-3.5" />
          {isPendingPublish ? "جاري النشر..." : "نشر CSS"}
        </button>
      </div>

      {hasDraft && (
        <button
          type="button"
          onClick={handleDiscard}
          disabled={isPendingDiscard}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
          تجاهل مسودة CSS
        </button>
      )}
    </div>
  );
}
