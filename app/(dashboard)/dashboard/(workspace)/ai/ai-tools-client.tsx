// ============================================================
// Saba Store — AI Tools Client Component
// Premium UI for AI content generation tools
// ============================================================
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  Copy,
  Check,
  RefreshCw,
  Save,
  Loader2,
  X,
  Package,
  Store,
  FileText,
  Megaphone,
  AlertTriangle,
  Clock,
  ChevronLeft,
  Crown,
} from "lucide-react";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateAiContent, saveAiContentToStore } from "@/actions/ai";
import { AI_TOOLS, AI_TOOL_CATEGORIES, type AiToolMeta } from "@/lib/ai/prompts";
import type { AiToolType } from "@/lib/ai/mock-responses";

// ============================================================
// TYPES
// ============================================================
interface AiToolsClientProps {
  store: any;
  packageInfo: any;
  aiCredits: {
    total: number;
    used: number;
    remaining: number;
    resetAt: string;
  };
  recentGenerations: any[];
}

// Category icons mapping
const categoryIcons: Record<string, React.ElementType> = {
  product: Package,
  store: Store,
  policy: FileText,
  marketing: Megaphone,
};

// ============================================================
// COMPONENT
// ============================================================
export function AiToolsClient({
  store,
  packageInfo,
  aiCredits,
  recentGenerations,
}: AiToolsClientProps) {
  const router = useRouter();
  const [credits, setCredits] = useState(aiCredits);
  const [selectedTool, setSelectedTool] = useState<AiToolMeta | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // ── Filter tools by category ──
  const filteredTools =
    activeCategory === "all"
      ? AI_TOOLS
      : AI_TOOLS.filter((t) => t.category === activeCategory);

  // ── Open tool modal ──
  const handleSelectTool = useCallback((tool: AiToolMeta) => {
    setSelectedTool(tool);
    setGeneratedText("");
    setCopied(false);
    // Pre-fill store_name if the tool needs it
    const initial: Record<string, string> = {};
    tool.inputFields.forEach((f) => {
      if (f.key === "store_name") {
        initial[f.key] = store.name || "";
      } else {
        initial[f.key] = "";
      }
    });
    setInputValues(initial);
  }, [store.name]);

  // ── Close modal ──
  const handleClose = useCallback(() => {
    setSelectedTool(null);
    setGeneratedText("");
    setInputValues({});
    setCopied(false);
  }, []);

  // ── Generate content ──
  const handleGenerate = async () => {
    if (!selectedTool) return;

    // Check required fields
    const missingRequired = selectedTool.inputFields
      .filter((f) => f.required)
      .find((f) => !inputValues[f.key]?.trim());

    if (missingRequired) {
      toast.error(`يرجى تعبئة حقل "${missingRequired.label}"`);
      return;
    }

    if (credits.remaining < selectedTool.creditsPerUse) {
      toast.error("رصيد الذكاء الاصطناعي غير كافٍ. يرجى ترقية باقتك.");
      return;
    }

    setIsGenerating(true);
    setCopied(false);

    try {
      const result = await generateAiContent(
        selectedTool.type,
        inputValues
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        setGeneratedText(result.data.text);
        setCredits((prev) => ({
          ...prev,
          used: prev.used + result.data!.creditsUsed,
          remaining: result.data!.creditsRemaining,
        }));
        toast.success(
          `تم التوليد بنجاح! (${result.data.creditsUsed} رصيد مستخدم)`
        );
      }
    } catch {
      toast.error("حدث خطأ أثناء التوليد");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Copy to clipboard ──
  const handleCopy = async () => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      toast.success("تم نسخ النص");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("فشل نسخ النص");
    }
  };

  // ── Save to store settings ──
  const handleSaveToStore = async () => {
    if (!generatedText || !selectedTool) return;

    // Map tool types to save targets
    const saveMap: Partial<Record<AiToolType, string>> = {
      homepage_title: "hero_title",
      homepage_description: "hero_subtitle",
      about_us: "store_description",
    };

    const target = saveMap[selectedTool.type];
    if (!target) {
      toast.info("استخدم زر النسخ لنسخ النص ولصقه في المكان المناسب.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveAiContentToStore(target, generatedText);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("تم حفظ المحتوى بنجاح في إعدادات المتجر!");
        router.refresh();
      }
    } catch {
      toast.error("فشل حفظ المحتوى");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Credits percentage ──
  const creditsPercent =
    credits.total > 0
      ? Math.round((credits.remaining / credits.total) * 100)
      : 0;
  const isLowCredits = creditsPercent < 20;

  // ── Can save to store directly? ──
  const canSaveToStore =
    selectedTool &&
    ["homepage_title", "homepage_description", "about_us"].includes(
      selectedTool.type
    );

  return (
    <div className="page-shell animate-fade-in text-right">
      <PremiumPageHeader
        icon={Sparkles}
        iconColor="text-violet-600"
        iconBg="bg-violet-50"
        title="أدوات الذكاء الاصطناعي"
        description="أنشئ محتوى احترافي لمتجرك ومنتجاتك وحملاتك التسويقية بضغطة زر"
      />

      {/* ── Credits Card ── */}
      <div
        className={cn(
          "glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
          isLowCredits && "border-amber-500/30"
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              isLowCredits
                ? "bg-amber-50 text-amber-600"
                : "bg-violet-50 text-violet-600"
            )}
          >
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-cairo font-bold text-foreground">
              رصيد الذكاء الاصطناعي
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-cairo font-bold text-foreground font-numbers">
                {credits.remaining}
              </span>
              <span className="text-xs text-muted-foreground">
                من {credits.total} رصيد شهري
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-48 h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isLowCredits
                    ? "bg-amber-400"
                    : "bg-gradient-to-l from-purple-500 to-primary"
                )}
                style={{ width: `${creditsPercent}%` }}
              />
            </div>
          </div>
        </div>

        {isLowCredits && (
          <div className="flex items-center gap-2 text-amber-700 text-xs bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>الرصيد منخفض — يرجى ترقية باقتك</span>
          </div>
        )}

        {packageInfo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Crown className="h-3.5 w-3.5 text-amber-600" />
            <span>
              باقة{" "}
              <span className="text-foreground font-semibold">
                {packageInfo.name}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer",
            activeCategory === "all"
              ? "bg-primary text-white shadow-brand"
              : "glass hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
          )}
        >
          جميع الأدوات ({AI_TOOLS.length})
        </button>
        {Object.entries(AI_TOOL_CATEGORIES).map(([key, cat]) => {
          const count = AI_TOOLS.filter((t) => t.category === key).length;
          const Icon = categoryIcons[key] ?? Sparkles;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                activeCategory === key
                  ? "bg-primary text-white shadow-brand"
                  : "glass hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Tools Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTools.map((tool) => {
          const Icon = categoryIcons[tool.category] ?? Sparkles;
          const categoryColor: Record<string, string> = {
            product: "text-amber-600 bg-amber-50",
            store: "text-primary bg-primary/10",
            policy: "text-emerald-600 bg-emerald-50",
            marketing: "text-violet-600 bg-violet-50",
          };
          const colors = categoryColor[tool.category] ?? "text-primary bg-primary/10";
          const [textColor, bgColor] = colors.split(" ");

          return (
            <button
              key={tool.type}
              onClick={() => handleSelectTool(tool)}
              className="glass-card p-5 text-right hover:border-primary/40 transition-all duration-300 group cursor-pointer flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    bgColor
                  )}
                >
                  <Icon className={cn("h-5 w-5", textColor)} />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  <span className="font-numbers">{tool.creditsPerUse}</span>
                  <span>رصيد</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-cairo font-bold text-foreground group-hover:text-primary transition-colors">
                  {tool.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {tool.description}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-primary mt-auto">
                <Sparkles className="h-3 w-3" />
                <span>ابدأ التوليد</span>
                <ChevronLeft className="h-3 w-3 rtl-flip" />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Recent Generations ── */}
      {recentGenerations.length > 0 && (
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-cairo font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            آخر التوليدات
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
            {recentGenerations.map((gen: any) => {
              const toolLabel =
                AI_TOOLS.find((t) => t.type === gen.type)?.label ??
                gen.type;
              return (
                <div
                  key={gen.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-sidebar/30 border border-border/50 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Sparkles className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                    <span className="font-medium text-foreground truncate">
                      {toolLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-muted-foreground font-numbers">
                      -{gen.credits_used} رصيد
                    </span>
                    <span className="text-muted-foreground/60">
                      {new Date(gen.created_at).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── GENERATION MODAL ── */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative w-full max-w-2xl bg-card border border-border p-6 rounded-2xl shadow-brand-lg animate-scale-in text-right max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute left-4 top-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-cairo font-bold text-foreground">
                  {selectedTool.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedTool.description}
                </p>
              </div>
            </div>

            {/* Credits Info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-sidebar/30 border border-border/50 mb-4 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-violet-600" />
                <span>
                  تكلفة التوليد:{" "}
                  <span className="text-foreground font-bold font-numbers">
                    {selectedTool.creditsPerUse}
                  </span>{" "}
                  رصيد
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">المتبقي:</span>
                <span
                  className={cn(
                    "font-bold font-numbers",
                    credits.remaining < selectedTool.creditsPerUse
                      ? "text-red-600"
                      : "text-emerald-600"
                  )}
                >
                  {credits.remaining}
                </span>
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-4 mb-6">
              {selectedTool.inputFields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {field.label}
                    {field.required && (
                      <span className="text-destructive"> *</span>
                    )}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      placeholder={field.placeholder}
                      value={inputValues[field.key] ?? ""}
                      onChange={(e) =>
                        setInputValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
                      disabled={isGenerating}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={inputValues[field.key] ?? ""}
                      onChange={(e) =>
                        setInputValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      disabled={isGenerating}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                credits.remaining < selectedTool.creditsPerUse
              }
              className={cn(
                "w-full py-3 rounded-xl font-cairo font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
                isGenerating
                  ? "bg-violet-50 text-violet-500 cursor-wait"
                  : credits.remaining < selectedTool.creditsPerUse
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-to-l from-purple-600 to-primary text-white shadow-brand hover:shadow-brand-lg"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ التوليد...
                </>
              ) : credits.remaining < selectedTool.creditsPerUse ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  الرصيد غير كافٍ
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {generatedText ? "إعادة التوليد" : "توليد المحتوى"}
                </>
              )}
            </button>

            {/* ── Generated Output ── */}
            {generatedText && (
              <div className="mt-6 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">
                    النتيجة — يمكنك التعديل قبل الحفظ:
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <Check className="h-3 w-3" />
                    <span>تم التوليد</span>
                  </div>
                </div>

                {/* Editable output */}
                <textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  rows={Math.min(
                    12,
                    Math.max(4, generatedText.split("\n").length + 1)
                  )}
                  className="w-full px-4 py-3 rounded-xl bg-sidebar/50 border border-primary/20 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all resize-none leading-relaxed"
                  dir="rtl"
                />

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass text-xs font-medium hover:bg-sidebar-accent transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
<span className="text-emerald-600">تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>نسخ النص</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass text-xs font-medium hover:bg-sidebar-accent transition-all cursor-pointer"
                  >
                    <RefreshCw
                      className={cn(
                        "h-3.5 w-3.5",
                        isGenerating && "animate-spin"
                      )}
                    />
                    <span>إعادة التوليد</span>
                  </button>

                  {canSaveToStore && (
                    <button
                      onClick={handleSaveToStore}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all cursor-pointer"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      <span>حفظ في المتجر</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
