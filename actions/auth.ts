// ============================================================
// Saba Store — Auth Server Actions
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations/auth";
import type { User } from "@/lib/types/database";

// ============================================================
// SIGN IN
// ============================================================
export async function signIn(
  formData: LoginInput
): Promise<{ error: string | null }> {
  const validated = loginSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "خطأ في البيانات" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "يرجى تأكيد البريد الإلكتروني أو تعطيل التحقق من البريد مؤقتًا" };
    }
    return { error: "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى" };
  }

  revalidatePath("/", "layout");

  // Check if user has a store
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (store) {
      redirect("/dashboard");
    } else {
      redirect("/dashboard/onboarding");
    }
  }

  redirect("/dashboard");
}

// ============================================================
// SIGN UP (Register)
// ============================================================
export async function signUp(
  formData: Omit<RegisterInput, "terms" | "confirm_password"> & { terms: boolean; confirm_password: string }
): Promise<{ error: string | null }> {
  const validated = registerSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "خطأ في البيانات" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        full_name: validated.data.full_name,
        role: "merchant",
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already exists")) {
      return { error: "هذا البريد مستخدم بالفعل" };
    }
    if (error.message.includes("weak_password") || error.message.includes("Weak password") || error.message.includes("Password should be at least")) {
      return { error: "كلمة المرور ضعيفة، استخدم 8 أحرف على الأقل" };
    }
    return { error: `حدث خطأ: ${error.message}` };
  }

  revalidatePath("/", "layout");

  // إذا أعاد Supabase session مباشرة (التحقق من البريد معطّل)، وجّه للـ onboarding
  if (data.session) {
    redirect("/dashboard/onboarding");
  }

  // التحقق من البريد الإلكتروني مفعّل — أخبر المستخدم بالتحقق
  redirect("/verify-email");
}

// ============================================================
// SIGN OUT
// ============================================================
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// ============================================================
// GET CURRENT USER (Server Component helper)
// ============================================================
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

// ============================================================
// GET MERCHANT STORE (Server Component helper)
// ============================================================
export async function getMerchantStore() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select(
      `
      *,
      packages (*),
      subscriptions (*)
    `
    )
    .eq("owner_id", user.id)
    .single();

  return store;
}
