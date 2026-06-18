// ============================================================
// Saba Store — Zod Validation Schemas for AI Tools
// ============================================================
import { z } from "zod";
import type { AiToolType } from "@/lib/ai/mock-responses";

// ============================================================
// VALID AI TOOL TYPES
// ============================================================
const validToolTypes: AiToolType[] = [
  "product_name",
  "product_description",
  "product_seo_title",
  "product_seo_description",
  "homepage_title",
  "homepage_description",
  "about_us",
  "store_slogan",
  "return_policy",
  "privacy_policy",
  "terms_of_service",
  "instagram_post",
  "short_ad",
  "promo_message",
  "category_description",
];

// ============================================================
// SANITIZE INPUT — Strip dangerous HTML/JS
// ============================================================
const sanitizedString = z
  .string()
  .trim()
  .max(1000, "الإدخال طويل جداً — الحد الأقصى 1000 حرف")
  .refine(
    (val) => {
      // Block HTML tags and script patterns
      const dangerousPatterns = /<script|<\/script|javascript:|on\w+\s*=/i;
      return !dangerousPatterns.test(val);
    },
    { message: "الإدخال يحتوي على محتوى غير مسموح به" }
  );

// ============================================================
// AI GENERATION REQUEST SCHEMA
// ============================================================
export const aiGenerateSchema = z.object({
  toolType: z
    .string()
    .refine(
      (val): val is AiToolType => validToolTypes.includes(val as AiToolType),
      { message: "نوع الأداة غير صالح" }
    ),
  input: z.record(z.string(), sanitizedString).refine(
    (val) => {
      // Ensure at least one non-empty value
      return Object.values(val).some((v) => v.trim().length > 0);
    },
    { message: "يجب إدخال قيمة واحدة على الأقل" }
  ),
});

export type AiGenerateInput = z.infer<typeof aiGenerateSchema>;

// ============================================================
// AI SAVE CONTENT SCHEMA (saving generated content to store/product)
// ============================================================
export const aiSaveContentSchema = z.object({
  generatedText: z
    .string()
    .min(1, "النص المولّد مطلوب")
    .max(10000, "النص طويل جداً"),
  targetType: z.enum([
    "hero_title",
    "hero_subtitle",
    "footer_content",
    "store_description",
  ]),
});

export type AiSaveContentInput = z.infer<typeof aiSaveContentSchema>;
