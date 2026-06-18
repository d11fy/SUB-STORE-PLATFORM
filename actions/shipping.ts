// ============================================================
// Saba Store — Shipping Server Actions
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId } from "./store-utils";
import { shippingMethodSchema, type ShippingMethodInput } from "@/lib/validations/shipping";
import type { ShippingMethod, ShippingZone } from "@/lib/types/database";

// ============================================================
// GET ALL SHIPPING METHODS
// ============================================================
export async function getShippingMethods(): Promise<{
  data: (ShippingMethod & { shipping_zones?: ShippingZone[] })[] | null;
  error: string | null;
}> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { data: methods, error: methodsError } = await supabase
      .from("shipping_methods")
      .select(`*, shipping_zones (*)`)
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (methodsError) throw methodsError;

    return { data: methods as any[], error: null };
  } catch (err: any) {
    console.error("Error fetching shipping methods:", err);
    return { data: null, error: "فشل جلب طرق الشحن" };
  }
}

// ============================================================
// CREATE SHIPPING METHOD
// ============================================================
export async function createShippingMethod(
  formData: ShippingMethodInput
): Promise<{ data: ShippingMethod | null; error: string | null }> {
  try {
    const validated = shippingMethodSchema.safeParse(formData);
    if (!validated.success) {
      return { data: null, error: validated.error.issues[0]?.message ?? "بيانات غير صالحة" };
    }

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    // Insert shipping method
    const { data: method, error: insertError } = await supabase
      .from("shipping_methods")
      .insert({
        store_id: storeId,
        name: validated.data.name,
        type: validated.data.type,
        base_price: validated.data.base_price,
        free_shipping_threshold: validated.data.free_shipping_threshold || null,
        pickup_address: validated.data.pickup_address || null,
        estimated_days_min: validated.data.estimated_days_min || null,
        estimated_days_max: validated.data.estimated_days_max || null,
        notes: validated.data.notes || null,
        is_active: validated.data.is_active,
        sort_order: 0,
      })
      .select()
      .single();

    if (insertError || !method) throw insertError;

    // Handle city based rates/zones
    if (validated.data.type === "city_based" && validated.data.zones && validated.data.zones.length > 0) {
      const zoneRows = validated.data.zones.map((zone) => ({
        store_id: storeId,
        shipping_method_id: method.id,
        city_name: zone.city_name,
        price: zone.price,
        estimated_days_min: zone.estimated_days_min || null,
        estimated_days_max: zone.estimated_days_max || null,
        is_active: true,
      }));

      const { error: zoneInsertError } = await supabase.from("shipping_zones").insert(zoneRows);
      if (zoneInsertError) throw zoneInsertError;
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/shipping");
    return { data: method as ShippingMethod, error: null };
  } catch (err: any) {
    console.error("Error creating shipping method:", err);
    return { data: null, error: "فشل إضافة طريقة الشحن، يرجى المحاولة لاحقاً" };
  }
}

// ============================================================
// UPDATE SHIPPING METHOD
// ============================================================
export async function updateShippingMethod(
  methodId: string,
  formData: ShippingMethodInput
): Promise<{ data: ShippingMethod | null; error: string | null }> {
  try {
    const validated = shippingMethodSchema.safeParse(formData);
    if (!validated.success) {
      return { data: null, error: validated.error.issues[0]?.message ?? "بيانات غير صالحة" };
    }

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    // Update shipping method
    const { data: method, error: updateError } = await supabase
      .from("shipping_methods")
      .update({
        name: validated.data.name,
        type: validated.data.type,
        base_price: validated.data.base_price,
        free_shipping_threshold: validated.data.free_shipping_threshold || null,
        pickup_address: validated.data.pickup_address || null,
        estimated_days_min: validated.data.estimated_days_min || null,
        estimated_days_max: validated.data.estimated_days_max || null,
        notes: validated.data.notes || null,
        is_active: validated.data.is_active,
      })
      .eq("id", methodId)
      .eq("store_id", storeId)
      .select()
      .single();

    if (updateError || !method) throw updateError;

    // Delete old zones and sync new ones if city_based
    await supabase.from("shipping_zones").delete().eq("shipping_method_id", methodId).eq("store_id", storeId);

    if (validated.data.type === "city_based" && validated.data.zones && validated.data.zones.length > 0) {
      const zoneRows = validated.data.zones.map((zone) => ({
        store_id: storeId,
        shipping_method_id: methodId,
        city_name: zone.city_name,
        price: zone.price,
        estimated_days_min: zone.estimated_days_min || null,
        estimated_days_max: zone.estimated_days_max || null,
        is_active: true,
      }));

      const { error: zoneInsertError } = await supabase.from("shipping_zones").insert(zoneRows);
      if (zoneInsertError) throw zoneInsertError;
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/shipping");
    return { data: method as ShippingMethod, error: null };
  } catch (err: any) {
    console.error("Error updating shipping method:", err);
    return { data: null, error: "فشل تعديل طريقة الشحن، يرجى المحاولة لاحقاً" };
  }
}

// ============================================================
// TOGGLE METHOD ACTIVE STATUS
// ============================================================
export async function toggleShippingMethodActive(
  methodId: string,
  isActive: boolean
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("shipping_methods")
      .update({ is_active: isActive })
      .eq("id", methodId)
      .eq("store_id", storeId);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/shipping");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error toggling shipping active:", err);
    return { success: false, error: "فشل تحديث حالة طريقة الشحن" };
  }
}

// ============================================================
// DELETE SHIPPING METHOD
// ============================================================
export async function deleteShippingMethod(
  methodId: string
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("shipping_methods")
      .delete()
      .eq("id", methodId)
      .eq("store_id", storeId);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/shipping");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error deleting shipping method:", err);
    return { success: false, error: "فشل حذف طريقة الشحن" };
  }
}
