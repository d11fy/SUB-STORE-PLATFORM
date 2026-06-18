// ============================================================
// Saba Store — Payments Server Actions
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId } from "./store-utils";
import { paymentMethodSchema, type PaymentMethodInput } from "@/lib/validations/payment";
import type { PaymentMethod } from "@/lib/types/database";

// ============================================================
// GET ALL PAYMENT METHODS
// ============================================================
export async function getPaymentMethods(): Promise<{ data: PaymentMethod[] | null; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { data: data as PaymentMethod[], error: null };
  } catch (err: any) {
    console.error("Error fetching payment methods:", err);
    return { data: null, error: "فشل جلب طرق الدفع" };
  }
}

// ============================================================
// CREATE PAYMENT METHOD
// ============================================================
export async function createPaymentMethod(
  formData: PaymentMethodInput
): Promise<{ data: PaymentMethod | null; error: string | null }> {
  try {
    const validated = paymentMethodSchema.safeParse(formData);
    if (!validated.success) {
      return { data: null, error: validated.error.issues[0]?.message ?? "بيانات غير صالحة" };
    }

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    // Insert payment method
    const { data: method, error: insertError } = await supabase
      .from("payment_methods")
      .insert({
        store_id: storeId,
        name: validated.data.name,
        type: validated.data.type,
        account_holder_name: validated.data.account_holder_name || null,
        bank_name: validated.data.bank_name || null,
        account_number: validated.data.account_number || null,
        iban: validated.data.iban || null,
        instructions: validated.data.instructions || null,
        qr_image_url: null,
        is_active: validated.data.is_active,
        sort_order: 0,
      })
      .select()
      .single();

    if (insertError || !method) throw insertError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/payments");
    return { data: method as PaymentMethod, error: null };
  } catch (err: any) {
    console.error("Error creating payment method:", err);
    return { data: null, error: "فشل إضافة طريقة الدفع، يرجى المحاولة لاحقاً" };
  }
}

// ============================================================
// UPDATE PAYMENT METHOD
// ============================================================
export async function updatePaymentMethod(
  methodId: string,
  formData: PaymentMethodInput
): Promise<{ data: PaymentMethod | null; error: string | null }> {
  try {
    const validated = paymentMethodSchema.safeParse(formData);
    if (!validated.success) {
      return { data: null, error: validated.error.issues[0]?.message ?? "بيانات غير صالحة" };
    }

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    // Verify ownership and update
    const { data: method, error: updateError } = await supabase
      .from("payment_methods")
      .update({
        name: validated.data.name,
        type: validated.data.type,
        account_holder_name: validated.data.account_holder_name || null,
        bank_name: validated.data.bank_name || null,
        account_number: validated.data.account_number || null,
        iban: validated.data.iban || null,
        instructions: validated.data.instructions || null,
        is_active: validated.data.is_active,
      })
      .eq("id", methodId)
      .eq("store_id", storeId)
      .select()
      .single();

    if (updateError || !method) throw updateError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/payments");
    return { data: method as PaymentMethod, error: null };
  } catch (err: any) {
    console.error("Error updating payment method:", err);
    return { data: null, error: "فشل تعديل طريقة الدفع، يرجى المحاولة لاحقاً" };
  }
}

// ============================================================
// TOGGLE METHOD ACTIVE STATUS
// ============================================================
export async function togglePaymentMethodActive(
  methodId: string,
  isActive: boolean
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("payment_methods")
      .update({ is_active: isActive })
      .eq("id", methodId)
      .eq("store_id", storeId);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/payments");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error toggling payment active:", err);
    return { success: false, error: "فشل تحديث حالة طريقة الدفع" };
  }
}

// ============================================================
// DELETE PAYMENT METHOD
// ============================================================
export async function deletePaymentMethod(
  methodId: string
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", methodId)
      .eq("store_id", storeId);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/payments");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error deleting payment method:", err);
    return { success: false, error: "فشل حذف طريقة الدفع" };
  }
}
