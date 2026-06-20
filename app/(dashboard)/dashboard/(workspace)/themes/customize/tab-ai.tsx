"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Wand2,
} from "lucide-react";
import {
  generateAiThemeConfigAction,
  applyAiThemeConfigAsDraftAction,
  rejectAiThemeConfigAction,
} from "@/actions/ai-theme-builder";
import {
  BASE_THEME_LABELS,
  AI_THEME_CREDITS_COST,
  type AiThemeConfig,
} from "@/lib/validations/ai-theme-config";
import { SECTION_LABELS } from "@/lib/themes/customization-types";
import type { SectionType } from "@/lib/themes/customization-types";

// ── Props ─────────────────────────────────────────────────────
interface TabAiProps {
  availableCredits: number;
  onDraftApplied?: () => void;
}

// ── Tone options ──────────────────────────────────────────────
const TONE_OPTIONS = [
  { value: "", label: "تلقائي" },
  { value: "luxury", label: "فاخر وأنيق" },
  { value: "professional", label: "احترافي ورسمي" },
  { value: "minimal", label: "بسيط ومنظم" },
  { value: "bold", label: "جريء وواثق" },
  { value: "playful", label: "مرح وحيوي" },
] as const;

// ── Generation result state ───────────────────────────────────
interface GenerationResult {
  generationId: string | null;
  config: AiThemeConfig;
}

// ── Color swatch ──────────────────────────────────────────────
function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-8 h-8 rounded-full border border-border shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-muted-foreground font-mono">{color}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function TabAi({ availableCredits, onDraftApplied }: TabAiProps) {
  const [isGenerating, startGenerate] = useTransition();
  const [isApplying, startApply] = useTransition();
  const [isRejecting, startReject] = useTransition();

  const [prompt, setPrompt] = useState("");
  const [storeType, setStoreType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState<"" | "luxury" | "professional" | "minimal" | "bold" | "playful">("");
  const [preferredColors, setPreferredColors] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [result, setResult] = useState<GenerationResult | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const canGenerate = availableCredits >= AI_THEME_CREDITS_COST && prompt.trim().length >= 10;

  const handleGenerate = () => {
    setGenError(null);
    setResult(null);
    startGenerate(async () => {
      const res = await generateAiThemeConfigAction({
        prompt: prompt.trim(),
        store_type: storeType.trim() || undefined,
        target_audience: targetAudience.trim() || undefined,
        tone: tone || undefined,
        preferred_colors: preferredColors.trim() || undefined,
      });

      if (res.error || !res.config) {
        setGenError(res.error ?? "فشل التوليد");
        return;
      }

      setResult({ generationId: res.generationId, config: res.config });
      toast.success("تم توليد الثيم بنجاح — راجع النتيجة أدناه");
    });
  };

  const handleApply = () => {
    if (!result?.generationId) {
      toast.error("لا يمكن التطبيق — معرّف التوليد غير متوفر");
      return;
    }
    startApply(async () => {
      const res = await applyAiThemeConfigAsDraftAction(result.generationId!);
      if (res.success) {
        toast.success("تم تطبيق الثيم كمسودة — اضغط «نشر التعديلات» لتفعيله على المتجر الحي");
        setResult(null);
        onDraftApplied?.();
      } else {
        toast.error(res.error ?? "فشل التطبيق");
      }
    });
  };

  const handleReject = () => {
    startReject(async () => {
      if (result?.generationId) {
        await rejectAiThemeConfigAction(result.generationId);
      }
      setResult(null);
      toast.success("تم رفض الاقتراح");
    });
  };

  const isPending = isGenerating || isApplying || isRejecting;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Credit balance badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground font-cairo">
            مولّد الثيم بالذكاء الاصطناعي
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            صِف متجرك وسيقترح الذكاء الاصطناعي ثيماً كاملاً للمراجعة
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
          availableCredits >= AI_THEME_CREDITS_COST
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          <Sparkles className="h-3 w-3" />
          {availableCredits} رصيد متاح
        </div>
      </div>

      {/* Cost notice */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 font-cairo">
          يستهلك توليد ثيم واحد <strong>{AI_THEME_CREDITS_COST} رصيد</strong> — يتم الخصم فقط عند نجاح التوليد.
        </p>
      </div>

      {/* Prompt input */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground font-cairo">
            صِف متجرك ومتطلبات التصميم *
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثال: أريد متجر ملابس نسائية فاخر بألوان ذهبية وعاجية، هيرو كبير، أقسام للتشكيلات، بانر عروض، وآراء عميلات..."
            rows={4}
            disabled={isPending}
            className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none text-right leading-relaxed disabled:opacity-60"
          />
          <div className="flex justify-between">
            <span className={`text-xs ${prompt.length < 10 ? "text-amber-600" : "text-muted-foreground"}`}>
              {prompt.length < 10 ? `أكتب ${10 - prompt.length} أحرف على الأقل` : `${prompt.length}/1000`}
            </span>
          </div>
        </div>

        {/* Advanced options toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-cairo"
        >
          {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          خيارات إضافية (اختياري)
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground font-cairo">
                نوع المتجر
              </label>
              <input
                type="text"
                value={storeType}
                onChange={(e) => setStoreType(e.target.value)}
                placeholder="مثال: ملابس نسائية، إلكترونيات..."
                disabled={isPending}
                className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-right disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground font-cairo">
                الجمهور المستهدف
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="مثال: شباب، نساء، عائلات..."
                disabled={isPending}
                className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-right disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground font-cairo">
                نبرة التصميم
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as "" | "luxury" | "professional" | "minimal" | "bold" | "playful")}
                disabled={isPending}
                className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground font-cairo">
                الألوان المفضلة (اختياري)
              </label>
              <input
                type="text"
                value={preferredColors}
                onChange={(e) => setPreferredColors(e.target.value)}
                placeholder="مثال: ذهبي وأسود، أزرق وأبيض..."
                disabled={isPending}
                className="w-full px-3 py-2.5 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-right disabled:opacity-60"
              />
            </div>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isPending}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md font-cairo disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري توليد الثيم...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              توليد الثيم ({AI_THEME_CREDITS_COST} رصيد)
            </>
          )}
        </button>

        {availableCredits < AI_THEME_CREDITS_COST && (
          <p className="text-xs text-red-600 text-center font-cairo">
            رصيدك ({availableCredits}) غير كافٍ — يلزم {AI_THEME_CREDITS_COST} رصيد. يرجى ترقية باقتك.
          </p>
        )}
      </div>

      {/* Error state */}
      {genError && !isGenerating && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 font-cairo">فشل التوليد</p>
            <p className="text-xs text-red-600 mt-0.5">{genError}</p>
          </div>
        </div>
      )}

      {/* Result display */}
      {result && !isGenerating && (
        <div className="space-y-4">
          {/* Warning notice — mandatory */}
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-cairo leading-relaxed">
              <strong>تنبيه:</strong> لن يتم نشر التغييرات على المتجر الحي إلا بعد الضغط على{" "}
              <strong>«نشر التعديلات»</strong> في تبويب الثيم. التطبيق الآن يحفظ فقط كمسودة.
            </p>
          </div>

          {/* Result card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-foreground font-cairo text-sm">
                الثيم المقترح جاهز للمراجعة
              </h3>
            </div>

            {/* Base theme */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground font-cairo">الثيم الأساسي:</span>
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                {BASE_THEME_LABELS[result.config.base_theme]}
              </span>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground font-cairo">الألوان المقترحة:</p>
              <div className="flex items-start gap-6">
                <ColorSwatch color={result.config.colors.primary} label="الرئيسي" />
                <ColorSwatch color={result.config.colors.secondary} label="الثانوي" />
                <ColorSwatch color={result.config.colors.accent} label="المميز" />
              </div>
            </div>

            {/* Hero */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground font-cairo">نص الهيرو:</p>
              <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1">
                <p className="text-sm font-bold text-foreground font-cairo">{result.config.hero.title}</p>
                <p className="text-xs text-muted-foreground">{result.config.hero.subtitle}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded">
                  {result.config.hero.cta_label}
                </span>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground font-cairo">
                الأقسام ({result.config.sections.length} قسم):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.config.sections
                  .sort((a, b) => a.order - b.order)
                  .map((s, i) => (
                    <span
                      key={i}
                      className={`px-2.5 py-1 text-[11px] rounded-lg font-cairo ${
                        s.enabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}. {s.label ?? SECTION_LABELS[s.type as SectionType]}
                    </span>
                  ))}
              </div>
            </div>

            {/* SEO */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground font-cairo">SEO المقترح:</p>
              <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1">
                <p className="text-xs font-bold text-blue-700">{result.config.seo.meta_title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {result.config.seo.meta_description}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <button
                onClick={handleApply}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md font-cairo disabled:opacity-60"
              >
                {isApplying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                تطبيق كمسودة
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground text-sm font-bold rounded-xl border border-border hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all font-cairo disabled:opacity-60"
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                رفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
