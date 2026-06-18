// ============================================================
// Saba Store — D3 AI Theme Builder Server Actions
// Generate → Review → Apply as Draft → Publish via D1 workflow
//
// Security: store_id from auth only, Zod on all I/O, no code gen.
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId } from "./store-utils";
import { getExtendedThemeSettings } from "./theme-customizer";
import {
  aiThemeConfigInputSchema,
  aiThemeConfigOutputSchema,
  AI_THEME_CREDITS_COST,
  type ThemeConfigInput,
  type AiThemeConfig,
} from "@/lib/validations/ai-theme-config";
import {
  buildThemeSystemPrompt,
  buildThemeUserPrompt,
  generateMockThemeConfig,
} from "@/lib/ai/theme-prompt";
import {
  SECTION_LABELS,
  DEFAULT_HEADER_CONFIG,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_HOMEPAGE_CONFIG,
  type ThemeDraftConfig,
} from "@/lib/themes/customization-types";
import {
  normalizeAiSections,
  validateAiConfigConstraints,
} from "@/lib/themes/platform-constraints";
import type { Json } from "@/lib/types/database";

// ── Internal: call AI provider for theme JSON ─────────────────
async function callThemeAi(input: ThemeConfigInput): Promise<string> {
  const providerName = process.env.AI_PROVIDER?.toLowerCase() ?? "mock";

  if (providerName === "mock" || !providerName) {
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    return generateMockThemeConfig(input);
  }

  const systemPrompt = buildThemeSystemPrompt();
  const userPrompt = buildThemeUserPrompt(input);

  // OpenAI
  if (providerName === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return generateMockThemeConfig(input);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.4,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  // OpenRouter
  if (providerName === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return generateMockThemeConfig(input);
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Saba Store",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.4,
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter error ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  // Gemini
  if (providerName === "gemini") {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return generateMockThemeConfig(input);
    const model = process.env.AI_MODEL ?? "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.4 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  // Unknown provider → fallback to mock
  return generateMockThemeConfig(input);
}

// ── Internal: strip JSON fence if AI wrapped it anyway ────────
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1]!.trim();
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    return raw.slice(firstBrace, lastBrace + 1);
  }
  return raw.trim();
}

// ─────────────────────────────────────────────────────────────
// ACTION 1: Generate AI Theme Config
// ─────────────────────────────────────────────────────────────
export async function generateAiThemeConfigAction(rawInput: ThemeConfigInput): Promise<{
  generationId: string | null;
  config: AiThemeConfig | null;
  creditsRemaining: number | null;
  error: string | null;
}> {
  try {
    // 1. Validate input
    const validated = aiThemeConfigInputSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        generationId: null,
        config: null,
        creditsRemaining: null,
        error: validated.error.issues[0]?.message ?? "بيانات الإدخال غير صالحة",
      };
    }
    const input = validated.data;

    // 2. Get store from auth (NEVER from client)
    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    // 3. Check AI credits balance
    const { data: credits, error: creditsError } = await supabase
      .from("ai_credits")
      .select("*")
      .eq("store_id", storeId)
      .single();

    if (creditsError || !credits) {
      return {
        generationId: null,
        config: null,
        creditsRemaining: null,
        error: "لم يتم العثور على رصيد الذكاء الاصطناعي. تواصل مع الدعم.",
      };
    }

    const remaining = credits.credits_total - credits.credits_used;
    if (remaining < AI_THEME_CREDITS_COST) {
      return {
        generationId: null,
        config: null,
        creditsRemaining: remaining,
        error: `رصيد الذكاء الاصطناعي غير كافٍ. المتبقي: ${remaining} رصيد، المطلوب: ${AI_THEME_CREDITS_COST} رصيد.`,
      };
    }

    // 4. Call AI provider (mock or real)
    let rawOutput: string;
    try {
      rawOutput = await callThemeAi(input);
    } catch (aiErr) {
      console.error("AI call failed:", aiErr);
      return {
        generationId: null,
        config: null,
        creditsRemaining: remaining,
        error: "فشل الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.",
      };
    }

    // 5. Extract and parse JSON
    let parsed: unknown;
    try {
      const jsonStr = extractJson(rawOutput);
      parsed = JSON.parse(jsonStr);
    } catch {
      return {
        generationId: null,
        config: null,
        creditsRemaining: remaining,
        error: "الذكاء الاصطناعي أخرج JSON غير صالح. يرجى المحاولة مرة أخرى.",
      };
    }

    // 6. Validate output with Zod — strict security check
    const outputValidation = aiThemeConfigOutputSchema.safeParse(parsed);
    if (!outputValidation.success) {
      console.error("AI output failed Zod validation:", outputValidation.error.issues);
      return {
        generationId: null,
        config: null,
        creditsRemaining: remaining,
        error: "مخرجات الذكاء الاصطناعي لا تطابق الصيغة المطلوبة. يرجى المحاولة مرة أخرى.",
      };
    }
    const rawConfig = outputValidation.data;

    // 7. D3.6 AI Output Governor: normalize sections (dedup + budget cap)
    const { normalized: normalizedSections, log: normLog } = normalizeAiSections(rawConfig.sections);
    if (normLog.length > 0) {
      console.info("[D3.6 AI Governor] normalization at generate:", normLog);
    }
    const config: AiThemeConfig = { ...rawConfig, sections: normalizedSections };

    // 8. Deduct credits ONLY after successful validation + normalization
    const newUsed = credits.credits_used + AI_THEME_CREDITS_COST;
    await supabase
      .from("ai_credits")
      .update({ credits_used: newUsed })
      .eq("store_id", storeId);

    // 9. Save generation to ai_generations with config_output + review_status
    const promptLog = `${input.prompt}${input.store_type ? ` | نوع: ${input.store_type}` : ""}${input.tone ? ` | نبرة: ${input.tone}` : ""}`;
    const { data: generation, error: insertError } = await supabase
      .from("ai_generations")
      .insert({
        store_id: storeId,
        type: "theme_config" as any,
        prompt_input: promptLog,
        generated_text: JSON.stringify(config),
        credits_used: AI_THEME_CREDITS_COST,
        model_used: `${process.env.AI_PROVIDER ?? "mock"}/theme-builder`,
        is_published: false,
        config_output: config as unknown as Json,
        review_status: "pending",
      } as any)
      .select("id")
      .single();

    if (insertError || !generation) {
      console.error("Failed to save ai_generation:", insertError);
      // Non-critical — config was generated and credits deducted
      return {
        generationId: null,
        config,
        creditsRemaining: credits.credits_total - newUsed,
        error: null,
      };
    }

    revalidatePath("/dashboard/ai");

    return {
      generationId: generation.id,
      config,
      creditsRemaining: credits.credits_total - newUsed,
      error: null,
    };
  } catch (err) {
    console.error("generateAiThemeConfigAction error:", err);
    return {
      generationId: null,
      config: null,
      creditsRemaining: null,
      error: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// ACTION 2: Apply AI Theme Config as Draft Only
// Does NOT publish to live store. Draft must be published via D1.
// ─────────────────────────────────────────────────────────────
export async function applyAiThemeConfigAsDraftAction(generationId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    if (!generationId) return { success: false, error: "معرّف التوليد مطلوب" };

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    // 1. Fetch generation — verify ownership and status
    const { data: generation, error: fetchErr } = await supabase
      .from("ai_generations")
      .select("id, store_id, config_output, review_status")
      .eq("id", generationId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (fetchErr || !generation) {
      return { success: false, error: "التوليد غير موجود أو غير مصرح بالوصول" };
    }

    if ((generation as any).review_status !== "pending") {
      return { success: false, error: "هذا التوليد تم تطبيقه أو رفضه مسبقاً" };
    }

    // 2. Parse and re-validate config_output
    const configValidation = aiThemeConfigOutputSchema.safeParse(
      (generation as any).config_output
    );
    if (!configValidation.success) {
      return { success: false, error: "بيانات التوليد غير صالحة" };
    }
    const rawConfig: AiThemeConfig = configValidation.data;

    // 3. D3.6: Validate AI config against active theme constraints
    const { data: storeThemeRow } = await supabase
      .from("stores")
      .select("themes(slug)")
      .eq("id", storeId)
      .single();
    const activeThemeSlug: string = (storeThemeRow?.themes as any)?.slug ?? "general";

    const constraintCheck = validateAiConfigConstraints(rawConfig, activeThemeSlug);
    if (!constraintCheck.valid) {
      return {
        success: false,
        error:
          "لا يمكن تطبيق هذا الثيم — مخالفة قواعد المنصة: " +
          constraintCheck.violations[0],
      };
    }
    const config: AiThemeConfig = constraintCheck.normalized;

    // 4. Read current extended settings to preserve existing header/footer
    const { extended } = await getExtendedThemeSettings();
    const existingHeader = extended.header_config ?? DEFAULT_HEADER_CONFIG;
    const existingFooter = extended.footer_config ?? DEFAULT_FOOTER_CONFIG;

    // 5. Build ThemeDraftConfig from AI config + existing configs
    const draft: ThemeDraftConfig = {
      primary_color: config.colors.primary,
      secondary_color: config.colors.secondary,
      accent_color: config.colors.accent,
      font_family: "Cairo",
      hero_title: config.hero.title,
      hero_subtitle: config.hero.subtitle,
      footer_content: config.footer.text,
      sections_config: config.sections.map((s, i) => ({
        id: `ai-${s.type}-${Date.now()}-${i}`,
        type: s.type,
        enabled: s.enabled,
        order: s.order,
        label: s.label ?? SECTION_LABELS[s.type],
        settings: s.settings ?? {},
        visibility: s.visibility ?? { mobile: true, desktop: true },
      })),
      header_config: existingHeader,
      footer_config: {
        ...existingFooter,
        text: config.footer.text,
      },
      homepage_config: {
        ...DEFAULT_HOMEPAGE_CONFIG,
        meta_title: config.seo.meta_title,
        meta_description: config.seo.meta_description,
      },
    };

    // 5. Write draft_config into settings JSONB (same pattern as D1)
    const settingsJson: Record<string, unknown> = {
      ...extended,
      draft_config: draft,
    };

    const { data: row } = await supabase
      .from("store_theme_settings")
      .select("id")
      .eq("store_id", storeId)
      .maybeSingle();

    const writeResult = row
      ? await supabase
          .from("store_theme_settings")
          .update({ settings: settingsJson as unknown as Json })
          .eq("store_id", storeId)
      : await supabase
          .from("store_theme_settings")
          .insert({
            store_id: storeId,
            theme_id: "",
            settings: settingsJson as unknown as Json,
          });

    if (writeResult.error) {
      return { success: false, error: "فشل حفظ المسودة: " + writeResult.error.message };
    }

    // 6. Mark generation as applied
    await supabase
      .from("ai_generations")
      .update({ review_status: "applied" } as any)
      .eq("id", generationId)
      .eq("store_id", storeId);

    revalidatePath("/dashboard/themes/customize");
    revalidatePath("/dashboard/ai");

    return { success: true, error: null };
  } catch (err) {
    console.error("applyAiThemeConfigAsDraftAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

// ─────────────────────────────────────────────────────────────
// ACTION 3: Reject AI Theme Config
// ─────────────────────────────────────────────────────────────
export async function rejectAiThemeConfigAction(generationId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    if (!generationId) return { success: false, error: "معرّف التوليد مطلوب" };

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    const { error } = await supabase
      .from("ai_generations")
      .update({ review_status: "rejected" } as any)
      .eq("id", generationId)
      .eq("store_id", storeId);

    if (error) return { success: false, error: "فشل تحديث حالة التوليد" };

    revalidatePath("/dashboard/ai");
    return { success: true, error: null };
  } catch (err) {
    console.error("rejectAiThemeConfigAction error:", err);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

// ─────────────────────────────────────────────────────────────
// ACTION 4: Get recent AI theme generations
// ─────────────────────────────────────────────────────────────
export async function getAiThemeGenerationsAction(limit = 5): Promise<{
  generations: Array<{
    id: string;
    config_output: AiThemeConfig | null;
    review_status: "pending" | "applied" | "rejected" | null;
    created_at: string;
  }>;
  error: string | null;
}> {
  try {
    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ai_generations")
      .select("id, config_output, review_status, created_at")
      .eq("store_id", storeId)
      .eq("type", "theme_config" as any)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { generations: [], error: error.message };

    return {
      generations: (data ?? []).map((g: any) => ({
        id: g.id,
        config_output: g.config_output
          ? (aiThemeConfigOutputSchema.safeParse(g.config_output).data ?? null)
          : null,
        review_status: g.review_status,
        created_at: g.created_at,
      })),
      error: null,
    };
  } catch (err) {
    console.error("getAiThemeGenerationsAction error:", err);
    return { generations: [], error: "فشل جلب سجل التوليدات" };
  }
}
