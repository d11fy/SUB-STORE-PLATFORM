// ============================================================
// Saba Store — AI Server Actions
// Secure: store_id from auth, credits validation, Zod
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId } from "./store-utils";
import { getAiProvider } from "@/lib/ai/ai-provider";
import { getToolMeta } from "@/lib/ai/prompts";
import { aiGenerateSchema, aiSaveContentSchema } from "@/lib/validations/ai";
import { aiGenerationRateLimit } from "@/lib/rate-limit";
import type { AiToolType } from "@/lib/ai/mock-responses";

// ============================================================
// GENERATE AI CONTENT
// ============================================================
export async function generateAiContent(
  toolType: string,
  input: Record<string, string>
): Promise<{
  data: { text: string; creditsUsed: number; creditsRemaining: number } | null;
  error: string | null;
}> {
  try {
    // 1. Validate input
    const validated = aiGenerateSchema.safeParse({ toolType, input });
    if (!validated.success) {
      return {
        data: null,
        error: validated.error.issues[0]?.message ?? "بيانات غير صالحة",
      };
    }

    const validatedToolType = validated.data.toolType as AiToolType;
    const validatedInput = validated.data.input;

    // 2. Get store from authenticated user (NEVER from client)
    const storeId = await getMerchantStoreId();

    // 3. Rate limit check (10 generations per minute per store)
    if (!aiGenerationRateLimit(storeId).allowed) {
      return {
        data: null,
        error: "تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار دقيقة ثم المحاولة مجدداً.",
      };
    }

    // 4. Get tool metadata for credits cost
    const toolMeta = getToolMeta(validatedToolType);
    const creditsNeeded = toolMeta?.creditsPerUse ?? 1;

    // 5. Check credits balance
    const supabase = await createClient();
    const { data: credits, error: creditsError } = await supabase
      .from("ai_credits")
      .select("*")
      .eq("store_id", storeId)
      .single();

    if (creditsError || !credits) {
      return {
        data: null,
        error: "لم يتم العثور على رصيد الذكاء الاصطناعي. يرجى التواصل مع الدعم.",
      };
    }

    const remaining = credits.credits_total - credits.credits_used;
    if (remaining < creditsNeeded) {
      return {
        data: null,
        error: `رصيد الذكاء الاصطناعي غير كافٍ. المتبقي: ${remaining} رصيد، المطلوب: ${creditsNeeded} رصيد. يرجى ترقية باقتك.`,
      };
    }

    // 6. Generate content via AI provider
    const provider = getAiProvider();
    const result = await provider.generateContent(validatedToolType, validatedInput);

    // 7. Deduct credits ONLY after successful generation
    const newUsed = credits.credits_used + creditsNeeded;
    const { error: updateError } = await supabase
      .from("ai_credits")
      .update({ credits_used: newUsed })
      .eq("store_id", storeId);

    if (updateError) {
      console.error("Failed to deduct AI credits:", updateError);
      // Non-critical — content was generated, log and continue
    }

    // 8. Get user ID for logging
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 9. Log the generation in ai_generations
    // Use the existing columns from the schema
    await supabase.from("ai_generations").insert({
      store_id: storeId,
      type: validatedToolType as any,
      prompt_input: JSON.stringify(validatedInput),
      generated_text: result.text,
      credits_used: creditsNeeded,
      model_used: `${result.provider}/${result.model}`,
      is_published: false,
    });

    const creditsRemaining = credits.credits_total - newUsed;

    return {
      data: {
        text: result.text,
        creditsUsed: creditsNeeded,
        creditsRemaining,
      },
      error: null,
    };
  } catch (err: any) {
    console.error("AI generation error:", err);
    return {
      data: null,
      error: "فشل التوليد. يرجى المحاولة مرة أخرى.",
    };
  }
}

// ============================================================
// GET AI CREDITS
// ============================================================
export async function getAiCredits(): Promise<{
  data: {
    total: number;
    used: number;
    remaining: number;
    resetAt: string;
  } | null;
  error: string | null;
}> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { data: credits, error } = await supabase
      .from("ai_credits")
      .select("*")
      .eq("store_id", storeId)
      .single();

    if (error || !credits) {
      return { data: null, error: "لم يتم العثور على رصيد الذكاء الاصطناعي" };
    }

    return {
      data: {
        total: credits.credits_total,
        used: credits.credits_used,
        remaining: credits.credits_total - credits.credits_used,
        resetAt: credits.reset_at,
      },
      error: null,
    };
  } catch (err: any) {
    console.error("Error fetching AI credits:", err);
    return { data: null, error: "فشل جلب رصيد الذكاء الاصطناعي" };
  }
}

// ============================================================
// GET AI GENERATIONS HISTORY
// ============================================================
export async function getAiGenerations(limit: number = 20): Promise<{
  data: any[];
  error: string | null;
}> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ai_generations")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data: data ?? [], error: null };
  } catch (err: any) {
    console.error("Error fetching AI generations:", err);
    return { data: [], error: "فشل جلب سجل التوليدات" };
  }
}

// ============================================================
// SAVE GENERATED CONTENT TO STORE THEME SETTINGS
// ============================================================
export async function saveAiContentToStore(
  targetType: string,
  content: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const validated = aiSaveContentSchema.safeParse({
      generatedText: content,
      targetType,
    });

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message ?? "بيانات غير صالحة",
      };
    }

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    // Map target type to the correct field in draft_config
    const fieldMap: Record<string, string> = {
      hero_title: "hero_title",
      hero_subtitle: "hero_subtitle",
      footer_content: "footer_content",
      store_description: "store_description",
    };

    const field = fieldMap[validated.data.targetType];
    if (!field) {
      return { success: false, error: "نوع الحقل غير مدعوم" };
    }

    // Save atomically to settings.draft_config via RPC to avoid race conditions and direct live updates
    const { error: rpcError } = await (supabase as any).rpc("update_theme_settings_jsonb", {
      p_store_id: storeId,
      p_path: ["draft_config", field],
      p_value: validated.data.generatedText,
    });

    if (rpcError) throw rpcError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/ai");

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error saving AI content:", err);
    return {
      success: false,
      error: "فشل حفظ المحتوى. يرجى المحاولة مرة أخرى.",
    };
  }
}
