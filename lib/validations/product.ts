// ============================================================
// Saba Store — Product Zod Schema
// ============================================================
import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(1, "اسم المنتج مطلوب")
    .trim()
    .min(2, "اسم المنتج يجب أن يكون حرفين على الأقل")
    .max(150, "اسم المنتج طويل جداً"),
  slug: z
    .string()
    .min(1, "رابط المنتج مطلوب")
    .trim()
    .min(2, "الرابط يجب أن يكون حرفين على الأقل")
    .max(150, "الرابط طويل جداً")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "الرابط يجب أن يحتوي على حروف صغيرة، أرقام، وشرطات فقط"),
  description: z.string().trim().max(2000, "الوصف طويل جداً").optional().nullable().or(z.literal("")),
  short_description: z.string().trim().max(500, "الوصف المختصر طويل جداً").optional().nullable().or(z.literal("")),
  price: z.coerce
    .number({ message: "السعر يجب أن يكون رقماً" })
    .min(0, "السعر يجب أن يكون 0 أو أكثر"),
  compare_price: z.coerce
    .number({ message: "سعر التخفيض يجب أن يكون رقماً" })
    .min(0, "سعر التخفيض يجب أن يكون 0 أو أكثر")
    .optional()
    .nullable()
    .or(z.literal("")),
  sku: z.string().trim().max(50, "رمز SKU طويل جداً").optional().nullable().or(z.literal("")),
  stock_quantity: z.coerce
    .number({ message: "الكمية يجب أن تكون رقماً" })
    .int("الكمية يجب أن تكون عدداً صحيحاً")
    .min(0, "الكمية يجب أن تكون 0 أو أكثر"),
  category_id: z.string().uuid("التصنيف المختار غير صالح").optional().nullable().or(z.literal("")),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  product_type: z.enum(["physical", "digital", "subscription", "service"]).default("physical"),
  subscription_duration_value: z.coerce.number().int().min(1).optional().nullable(),
  subscription_duration_unit: z.enum(["day", "week", "month", "year"]).optional().nullable(),
  meta_title: z.string().trim().max(70, "عنوان SEO يجب أن لا يتجاوز 70 حرفاً").optional().nullable().or(z.literal("")),
  meta_description: z.string().trim().max(160, "وصف SEO يجب أن لا يتجاوز 160 حرفاً").optional().nullable().or(z.literal("")),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductStatus = "active" | "hidden" | "out_of_stock";
export type ProductWithImages = any; // Will represent mapped object
