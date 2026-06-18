import { z } from "zod";

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const themeSettingsSchema = z.object({
  primary_color: z
    .string()
    .trim()
    .regex(hexColorRegex, "اللون الأساسي يجب أن يكون بصيغة Hex صالحة (مثال: #1B4FD8)"),
  secondary_color: z
    .string()
    .trim()
    .regex(hexColorRegex, "اللون الثانوي يجب أن يكون بصيغة Hex صالحة"),
  accent_color: z
    .string()
    .trim()
    .regex(hexColorRegex, "لون التمييز يجب أن يكون بصيغة Hex صالحة"),
  font_family: z.enum(
    ["Cairo", "Tajawal", "Changa", "Alexandria", "Amiri", "IBM Plex Sans Arabic"],
    {
      message: "خط المتجر المحدد غير مدعوم",
    }
  ),
  hero_title: z
    .string()
    .trim()
    .max(150, "عنوان البانر الرئيسي طويل جداً (الحد الأقصى 150 حرفاً)")
    .optional()
    .nullable()
    .or(z.literal("")),
  hero_subtitle: z
    .string()
    .trim()
    .max(300, "العنوان الفرعي طويل جداً (الحد الأقصى 300 حرفاً)")
    .optional()
    .nullable()
    .or(z.literal("")),
  hero_image_url: z
    .string()
    .trim()
    .url("رابط صورة البانر غير صالح")
    .optional()
    .nullable()
    .or(z.literal("")),
  logo_url: z
    .string()
    .trim()
    .url("رابط الشعار غير صالح")
    .optional()
    .nullable()
    .or(z.literal("")),
  favicon_url: z
    .string()
    .trim()
    .url("رابط الفايكون غير صالح")
    .optional()
    .nullable()
    .or(z.literal("")),
  sections_order: z
    .array(z.string())
    .optional()
    .nullable(),
  hidden_sections: z
    .array(z.string())
    .optional()
    .nullable(),
  footer_content: z
    .string()
    .trim()
    .max(500, "نص الفوتر طويل جداً (الحد الأقصى 500 حرفاً)")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type ThemeSettingsInput = z.infer<typeof themeSettingsSchema>;
