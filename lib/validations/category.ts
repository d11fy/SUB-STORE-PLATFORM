// ============================================================
// Saba Store — Category Zod Schema
// ============================================================
import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "اسم التصنيف مطلوب")
    .trim()
    .min(2, "اسم التصنيف يجب أن يكون حرفين على الأقل")
    .max(100, "اسم التصنيف طويل جداً"),
  slug: z
    .string()
    .min(1, "رابط التصنيف مطلوب")
    .trim()
    .min(2, "الرابط يجب أن يكون حرفين على الأقل")
    .max(100, "الرابط طويل جداً")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "الرابط يجب أن يحتوي على حروف صغيرة، أرقام، وشرطات فقط"),
  description: z.string().trim().max(500, "الوصف طويل جداً").optional().nullable().or(z.literal("")),
  sort_order: z.coerce
    .number({ message: "الترتيب يجب أن يكون رقماً" })
    .int("الترتيب يجب أن يكون عدداً صحيحاً")
    .default(0),
  is_active: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type CategoryWithProductCount = any; // Represent count join
