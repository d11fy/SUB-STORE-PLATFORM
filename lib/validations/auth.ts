// ============================================================
// Saba Store — Zod Validation Schemas
// Auth: Login, Register
// ============================================================
import { z } from "zod";

// ============================================================
// LOGIN SCHEMA
// ============================================================
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صالح")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة")
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================
// REGISTER SCHEMA
// ============================================================
export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(1, "الاسم الكامل مطلوب")
      .trim()
      .min(2, "الاسم يجب أن يكون حرفين على الأقل")
      .max(100, "الاسم طويل جداً"),
    email: z
      .string()
      .min(1, "البريد الإلكتروني مطلوب")
      .email("البريد الإلكتروني غير صالح")
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(1, "كلمة المرور مطلوبة")
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d)/,
        "كلمة المرور يجب أن تحتوي على أحرف وأرقام"
      ),
    confirm_password: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
    terms: z.boolean().refine((val) => val === true, {
      message: "يجب الموافقة على الشروط والأحكام",
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirm_password"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================================
// FORGOT PASSWORD SCHEMA
// ============================================================
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صالح")
    .trim()
    .toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ============================================================
// RESET PASSWORD SCHEMA
// ============================================================
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "كلمة المرور الجديدة مطلوبة")
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d)/,
        "كلمة المرور يجب أن تحتوي على أحرف وأرقام"
      ),
    confirm_password: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirm_password"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
