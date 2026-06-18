"use server";

import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId } from "./store-utils";
import { revalidatePath } from "next/cache";
import type { Customer, Order } from "@/lib/types/database";

const PAGE_SIZE = 20;

export type CustomerWithOrders = Customer & {
  recent_orders: Pick<Order, "id" | "order_number" | "status" | "total_amount" | "created_at">[];
};

export async function getCustomersAction(opts?: {
  search?: string;
  page?: number;
}): Promise<{ data: Customer[]; count: number; error: string | null }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();
    const page = Math.max(1, opts?.page ?? 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .range(from, to);

    const s = opts?.search?.trim();
    if (s) {
      query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { data: data ?? [], count: count ?? 0, error: null };
  } catch {
    return { data: [], count: 0, error: "فشل جلب العملاء" };
  }
}

export async function getCustomerDetailsAction(
  customerId: string
): Promise<{ data: CustomerWithOrders | null; error: string | null }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .eq("store_id", storeId)
      .single();

    if (error) throw error;

    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, status, total_amount, created_at")
      .eq("store_id", storeId)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(10);

    return { data: { ...customer, recent_orders: orders ?? [] }, error: null };
  } catch {
    return { data: null, error: "فشل جلب بيانات العميل" };
  }
}

export async function updateCustomerAction(
  customerId: string,
  updates: {
    full_name?: string;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    notes?: string | null;
  }
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("customers")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", customerId)
      .eq("store_id", storeId);

    if (error) throw error;

    revalidatePath("/dashboard/customers");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "فشل تحديث بيانات العميل" };
  }
}

export async function deleteCustomerAction(
  customerId: string
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId)
      .eq("store_id", storeId);

    if (error) throw error;

    revalidatePath("/dashboard/customers");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "فشل حذف العميل" };
  }
}
