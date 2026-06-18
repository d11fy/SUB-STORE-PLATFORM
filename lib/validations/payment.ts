// ============================================================
// Saba Store — Payment Method Zod Schema
// ============================================================
import { z } from "zod";

export const paymentMethodSchema = z.object({
  name: z
    .string()
    .min(1, "اسم طريقة الدفع مطلوب")
    .trim()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(100, "الاسم طويل جداً"),
  type: z.enum(["bank_transfer", "local_wallet", "cash_on_delivery", "custom"], {
    message: "نوع طريقة الدفع غير صالح",
  }),
  account_holder_name: z.string().trim().max(100, "اسم صاحب الحساب طويل جداً").optional().nullable().or(z.literal("")),
  bank_name: z.string().trim().max(100, "اسم البنك/المزود طويل جداً").optional().nullable().or(z.literal("")),
  account_number: z.string().trim().max(50, "رقم الحساب طويل جداً").optional().nullable().or(z.literal("")),
  iban: z.string().trim().max(34, "رقم الـ IBAN طويل جداً").optional().nullable().or(z.literal("")),
  instructions: z.string().trim().max(1000, "التعليمات طويلة جداً").optional().nullable().or(z.literal("")),
  notes: z.string().trim().max(500, "الملاحظات طويلة جداً").optional().nullable().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
