// ============================================================
// Saba Store — Shipping Method Zod Schema
// ============================================================
import { z } from "zod";

export const shippingMethodSchema = z.object({
  name: z
    .string()
    .min(1, "اسم طريقة الشحن مطلوب")
    .trim()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(100, "الاسم طويل جداً"),
  type: z.enum(["fixed", "city_based", "free", "pickup", "custom"], {
    message: "نوع الشحن غير صالح",
  }),
  base_price: z.coerce
    .number({ message: "السعر يجب أن يكون رقماً" })
    .min(0, "السعر يجب أن يكون 0 أو أكثر"),
  free_shipping_threshold: z.coerce
    .number({ message: "الحد يجب أن يكون رقماً" })
    .min(0, "الحد يجب أن يكون 0 أو أكثر")
    .optional()
    .nullable()
    .or(z.literal("")),
  pickup_address: z.string().trim().max(300, "العنوان طويل جداً").optional().nullable().or(z.literal("")),
  estimated_days_min: z.coerce
    .number({ message: "الحد الأدنى للأيام يجب أن يكون رقماً" })
    .int("يجب أن يكون عدداً صحيحاً")
    .min(0, "يجب أن يكون 0 أو أكثر")
    .optional()
    .nullable()
    .or(z.literal("")),
  estimated_days_max: z.coerce
    .number({ message: "الحد الأقصى للأيام يجب أن يكون رقماً" })
    .int("يجب أن يكون عدداً صحيحاً")
    .min(0, "يجب أن يكون 0 أو أكثر")
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z.string().trim().max(500, "الملاحظات طويلة جداً").optional().nullable().or(z.literal("")),
  is_active: z.boolean().default(true),
  
  // Custom structure for city rates
  zones: z
    .array(
      z.object({
        city_name: z.string().min(1, "اسم المدينة مطلوب").trim(),
        price: z.coerce
          .number({ message: "السعر يجب أن يكون رقماً" })
          .min(0, "السعر يجب أن يكون 0 أو أكثر"),
        estimated_days_min: z.coerce
          .number()
          .int()
          .min(0)
          .optional()
          .nullable()
          .or(z.literal("")),
        estimated_days_max: z.coerce
          .number()
          .int()
          .min(0)
          .optional()
          .nullable()
          .or(z.literal("")),
      })
    )
    .optional()
    .default([]),
});

export type ShippingMethodInput = z.infer<typeof shippingMethodSchema>;
