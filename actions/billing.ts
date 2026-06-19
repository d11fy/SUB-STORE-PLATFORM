"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMerchantStoreId } from "./store-utils";
import type { Subscription } from "@/lib/types/database";

// ============================================================
// GET MY SUBSCRIPTION
// ============================================================
export async function getMySubscription(): Promise<{
  data: Subscription | null;
  error: string | null;
}> {
  try {
    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) throw error;
    return { data: data as Subscription | null, error: null };
  } catch (err: any) {
    return { data: null, error: "فشل جلب بيانات الاشتراك" };
  }
}

// ============================================================
// SUBMIT PAYMENT PROOF
// ============================================================
export async function submitPaymentProof(
  fileBase64: string,
  fileName: string,
  fileType: string
): Promise<{ success: boolean; error: string | null }> {
  if (!fileBase64 || !fileName) {
    return { success: false, error: "الملف مطلوب" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(fileType)) {
    return { success: false, error: "صيغة الملف غير مدعومة (JPG، PNG، WEBP، PDF)" };
  }

  const storeId = await getMerchantStoreId();

  // Decode base64
  const base64Data = fileBase64.split(";base64,").pop();
  if (!base64Data) return { success: false, error: "محتوى الملف غير صالح" };

  const fileBuffer = Buffer.from(base64Data, "base64");
  if (fileBuffer.length > 5 * 1024 * 1024) {
    return { success: false, error: "حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)" };
  }

  const ext = fileName.split(".").pop() ?? "png";
  const filePath = `subscriptions/${storeId}/proof_${Date.now()}.${ext}`;

  const adminSupabase = createAdminClient();

  // Upload to storage
  const { error: uploadError } = await adminSupabase.storage
    .from("payment-proofs")
    .upload(filePath, fileBuffer, { contentType: fileType, upsert: true });

  if (uploadError) {
    return { success: false, error: "فشل رفع الملف، يرجى المحاولة مرة أخرى" };
  }

  // Update subscription: set proof URL + status = pending
  const { error: updateError } = await adminSupabase
    .from("subscriptions")
    .update({
      payment_proof_url: filePath,
      status: "pending",
      admin_note: null,
    })
    .eq("store_id", storeId);

  if (updateError) {
    return { success: false, error: "فشل تحديث حالة الاشتراك" };
  }

  revalidatePath("/dashboard/billing");
  revalidatePath("/admin/subscriptions");
  return { success: true, error: null };
}

