import { z } from "zod";

const phoneRegex = /^(?:\+?(?:970|972|962))?[0-9]{9,10}$/;

export const checkoutSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "الاسم الكامل يجب أن يكون 3 أحرف على الأقل")
    .max(100, "الاسم طويل جداً"),
  phone: z
    .string()
    .trim()
    .min(9, "رقم الهاتف يجب أن يكون 9 أرقام على الأقل")
    .regex(phoneRegex, "رقم الهاتف غير صالح (يجب أن يكون رقم جوال فلسطيني أو أردني)"),
  email: z
    .string()
    .trim()
    .email("البريد الإلكتروني غير صالح")
    .optional()
    .or(z.literal("")),
  // Delivery fields — required only when store.requires_shipping = true.
  // The server validates them contextually; the client hides them for digital stores.
  country: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(300, "العنوان طويل جداً")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(500, "الملاحظات طويلة جداً")
    .optional()
    .or(z.literal("")),
  shipping_method_id: z.string().uuid("يرجى اختيار طريقة شحن صالحة").optional().nullable().or(z.literal("")),
  payment_method_id: z.string().uuid("يرجى اختيار طريقة دفع صالحة"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
