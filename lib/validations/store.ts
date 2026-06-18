// ============================================================
// Saba Store — Zod Validation Schemas
// Store: Creation, Settings, Onboarding
// ============================================================
import { z } from "zod";

// ============================================================
// SLUG HELPER
// ============================================================
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ============================================================
// STORE CREATION SCHEMA (Onboarding Wizard)
// ============================================================
export const createStoreSchema = z.object({
  name: z
    .string()
    .min(1, "اسم المتجر مطلوب")
    .trim()
    .min(2, "اسم المتجر يجب أن يكون حرفين على الأقل")
    .max(100, "اسم المتجر طويل جداً"),
  slug: z
    .string()
    .min(1, "رابط المتجر مطلوب")
    .trim()
    .min(3, "رابط المتجر يجب أن يكون 3 أحرف على الأقل")
    .max(63, "رابط المتجر طويل جداً")
    .regex(
      slugRegex,
      "رابط المتجر يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط"
    ),
  category: z.string().min(1, "فئة المتجر مطلوبة"),
  package_id: z
    .string()
    .min(1, "الباقة مطلوبة")
    .uuid("باقة غير صالحة"),
  description: z
    .string()
    .trim()
    .max(500, "وصف المتجر طويل جداً")
    .optional(),
  country: z.string(),
  currency: z.string(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;

// ============================================================
// STORE SETTINGS SCHEMA
// ============================================================
export const storeSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "اسم المتجر مطلوب")
    .trim()
    .min(2, "اسم المتجر يجب أن يكون حرفين على الأقل")
    .max(100, "اسم المتجر طويل جداً"),
  description: z.string().trim().max(500, "الوصف طويل جداً").optional().nullable().or(z.literal("")),
  email: z
    .string()
    .email("البريد الإلكتروني غير صالح")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .min(9, "رقم الهاتف غير صالح")
    .optional()
    .or(z.literal("")),
  whatsapp: z
    .string()
    .min(9, "رقم الواتساب غير صالح")
    .optional()
    .or(z.literal("")),
  address: z.string().max(300, "العنوان طويل جداً").optional().nullable().or(z.literal("")),
  city: z.string().max(100, "المدينة طويلة جداً").optional().nullable().or(z.literal("")),
  country: z.string().length(2, "رمز الدولة يجب أن يكون حرفين").default("PS"),
  currency: z.string().default("ILS"),
  meta_title: z.string().max(70, "العنوان لا يجب أن يتجاوز 70 حرفًا").optional().nullable().or(z.literal("")),
  meta_description: z.string().max(160, "الوصف لا يجب أن يتجاوز 160 حرفًا").optional().nullable().or(z.literal("")),
  social_links: z
    .object({
      instagram: z.string().optional().or(z.literal("")),
      facebook: z.string().optional().or(z.literal("")),
      tiktok: z.string().optional().or(z.literal("")),
      twitter: z.string().optional().or(z.literal("")),
      whatsapp: z.string().optional().or(z.literal("")),
    })
    .optional(),
  logo_url: z.string().optional().nullable().or(z.literal("")),
  cover_url: z.string().optional().nullable().or(z.literal("")),
  requires_shipping: z.boolean().default(true),
  is_maintenance: z.boolean().default(false),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;

// ============================================================
// SLUG AVAILABILITY CHECK
// ============================================================
export const checkSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(63)
    .regex(slugRegex, "رابط غير صالح"),
});

export type CheckSlugInput = z.infer<typeof checkSlugSchema>;
