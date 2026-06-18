// ============================================================
// Saba Store — Products Server Actions
// ============================================================
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMerchantStoreId, getMerchantStoreWithPackage } from "./store-utils";
import { productSchema, type ProductInput } from "@/lib/validations/product";
import type { Product } from "@/lib/types/database";

// ============================================================
// GET ALL PRODUCTS
// ============================================================
export async function getProducts(options?: {
  search?: string;
  categoryId?: string;
  status?: string;
}): Promise<{ data: Product[] | null; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select(`*, categories:category_id (*)`)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (options?.search) {
      query = query.ilike("name", `%${options.search}%`);
    }

    if (options?.categoryId && options.categoryId !== "all") {
      query = query.eq("category_id", options.categoryId);
    }

    if (options?.status && options.status !== "all") {
      if (options.status === "active") {
        query = query.eq("is_active", true).gt("stock_quantity", 0);
      } else if (options.status === "hidden") {
        query = query.eq("is_active", false);
      } else if (options.status === "out_of_stock") {
        query = query.eq("is_active", true).eq("stock_quantity", 0);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data: data as any[], error: null };
  } catch (err: any) {
    console.error("Error fetching products:", err);
    return { data: null, error: "فشل جلب المنتجات" };
  }
}

// ============================================================
// CREATE PRODUCT
// ============================================================
export async function createProduct(
  formData: ProductInput
): Promise<{ data: Product | null; error: string | null }> {
  try {
    const validated = productSchema.safeParse(formData);
    if (!validated.success) {
      return { data: null, error: validated.error.issues[0]?.message ?? "بيانات غير صالحة" };
    }

    const store = await getMerchantStoreWithPackage();
    const supabase = await createClient();

    // Check package limit
    const maxProducts = store.packages?.max_products ?? null;
    if (maxProducts !== null) {
      const { count, error: countError } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id);

      if (countError) throw countError;

      const currentCount = count ?? 0;
      if (currentCount >= maxProducts) {
        return {
          data: null,
          error: `لقد وصلت للحد الأقصى لعدد المنتجات المسموح بها في باقتك الحالية (${store.packages?.name}: ${maxProducts} منتج). يرجى ترقية باقتك لإضافة المزيد من المنتجات.`,
        };
      }
    }

    // Verify slug unique per store_id
    const { data: existingSlug } = await supabase
      .from("products")
      .select("id")
      .eq("store_id", store.id)
      .eq("slug", validated.data.slug)
      .maybeSingle();

    if (existingSlug) {
      return {
        data: null,
        error: "رابط المنتج (slug) مستخدم بالفعل في متجرك، يرجى اختيار رابط آخر.",
      };
    }

    // Insert product (cast as any: product_type and related columns not yet in DB schema)
    const { data: product, error: insertError } = await supabase
      .from("products")
      .insert({
        store_id: store.id,
        name: validated.data.name,
        slug: validated.data.slug,
        description: validated.data.description ?? null,
        short_description: validated.data.short_description ?? null,
        price: validated.data.price,
        compare_price: typeof validated.data.compare_price === "number" ? validated.data.compare_price : null,
        sku: validated.data.sku ?? null,
        stock_quantity: validated.data.stock_quantity,
        category_id: validated.data.category_id || null,
        is_active: validated.data.is_active,
        is_featured: validated.data.is_featured,
        barcode: null,
        track_inventory: true,
        is_digital: validated.data.product_type === "digital",
        weight: null,
        tags: [],
        attributes: {},
      } as any)
      .select()
      .single();

    if (insertError || !product) throw insertError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    return { data: product as any, error: null };
  } catch (err: any) {
    console.error("Error creating product:", err);
    return { data: null, error: "فشل إضافة المنتج، يرجى المحاولة لاحقاً" };
  }
}

// ============================================================
// UPDATE PRODUCT
// ============================================================
export async function updateProduct(
  productId: string,
  formData: ProductInput
): Promise<{ data: Product | null; error: string | null }> {
  try {
    const validated = productSchema.safeParse(formData);
    if (!validated.success) {
      return { data: null, error: validated.error.issues[0]?.message ?? "بيانات غير صالحة" };
    }

    const storeId = await getMerchantStoreId();
    const supabase = await createClient();

    // Verify product belongs to store
    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("id")
      .eq("store_id", storeId)
      .eq("id", productId)
      .maybeSingle();

    if (fetchError || !existingProduct) {
      return { data: null, error: "المنتج غير موجود أو لا تملك صلاحية تعديله" };
    }

    // Verify slug unique if changed
    const { data: existingSlug } = await supabase
      .from("products")
      .select("id")
      .eq("store_id", storeId)
      .eq("slug", validated.data.slug)
      .neq("id", productId)
      .maybeSingle();

    if (existingSlug) {
      return {
        data: null,
        error: "رابط المنتج (slug) مستخدم بالفعل في متجرك، يرجى اختيار رابط آخر.",
      };
    }

    // Update product
    const { data: product, error: updateError } = await supabase
      .from("products")
      .update({
        name: validated.data.name,
        slug: validated.data.slug,
        description: validated.data.description ?? null,
        short_description: validated.data.short_description ?? null,
        price: validated.data.price,
        compare_price: typeof validated.data.compare_price === "number" ? validated.data.compare_price : null,
        sku: validated.data.sku ?? null,
        stock_quantity: validated.data.stock_quantity,
        category_id: validated.data.category_id || null,
        is_active: validated.data.is_active,
        is_featured: validated.data.is_featured,
        is_digital: validated.data.product_type === "digital",
      } as any)
      .eq("id", productId)
      .eq("store_id", storeId)
      .select()
      .single();

    if (updateError || !product) throw updateError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    return { data: product as any, error: null };
  } catch (err: any) {
    console.error("Error updating product:", err);
    return { data: null, error: "فشل تعديل المنتج، يرجى المحاولة لاحقاً" };
  }
}

// ============================================================
// DELETE PRODUCT
// ============================================================
export async function deleteProduct(
  productId: string
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    // Verify ownership & delete
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("store_id", storeId);

    if (deleteError) throw deleteError;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error deleting product:", err);
    return { success: false, error: "فشل حذف المنتج، يرجى المحاولة لاحقاً" };
  }
}

// ============================================================
// GET PRODUCT IMAGES
// ============================================================
export async function getProductImages(
  productId: string
): Promise<{ data: { id: string; url: string; alt_text: string | null; sort_order: number; is_primary: boolean }[] | null; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("product_images")
      .select("id, url, alt_text, sort_order, is_primary")
      .eq("product_id", productId)
      .eq("store_id", storeId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Error fetching product images:", err);
    return { data: null, error: "فشل جلب صور المنتج" };
  }
}

// ============================================================
// UPLOAD PRODUCT IMAGE (base64 → store-assets bucket)
// ============================================================
export async function uploadProductImage(
  productId: string,
  fileBase64: string,
  fileName: string,
  fileType: string,
  altText: string = ""
): Promise<{ data: { id: string; url: string } | null; error: string | null }> {
  if (!productId || !fileBase64) {
    return { data: null, error: "بيانات غير مكتملة" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(fileType)) {
    return { data: null, error: "صيغة الصورة غير مدعومة (JPG, PNG, WEBP فقط)" };
  }

  const storeId = await getMerchantStoreId();
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", storeId)
    .single();

  if (!product) return { data: null, error: "المنتج غير موجود أو غير مصرح" };

  const base64Data = fileBase64.split(";base64,").pop();
  if (!base64Data) return { data: null, error: "محتوى الصورة غير صالح" };

  const fileBuffer = Buffer.from(base64Data, "base64");
  if (fileBuffer.length > 5 * 1024 * 1024) {
    return { data: null, error: "حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)" };
  }

  const fileExt = fileName.split(".").pop() || "jpg";
  const filePath = `${storeId}/products/${productId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("store-assets")
    .upload(filePath, fileBuffer, { contentType: fileType, upsert: false });

  if (uploadError) {
    console.error("Product image upload error:", uploadError);
    return { data: null, error: "فشل رفع الصورة" };
  }

  const { data: { publicUrl } } = supabase.storage.from("store-assets").getPublicUrl(filePath);

  const { data: existingImages } = await supabase
    .from("product_images")
    .select("sort_order, is_primary")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = existingImages && existingImages.length > 0 ? existingImages[0].sort_order + 1 : 0;
  const isPrimary = !existingImages || existingImages.length === 0;

  const { data: imageRecord, error: insertError } = await supabase
    .from("product_images")
    .insert({
      store_id: storeId,
      product_id: productId,
      url: publicUrl,
      alt_text: altText || null,
      sort_order: nextSortOrder,
      is_primary: isPrimary,
    })
    .select("id, url")
    .single();

  if (insertError || !imageRecord) {
    console.error("Product image DB insert error:", insertError);
    return { data: null, error: "فشل حفظ بيانات الصورة" };
  }

  revalidatePath("/dashboard/products");
  return { data: imageRecord, error: null };
}

// ============================================================
// DELETE PRODUCT IMAGE
// ============================================================
export async function deleteProductImage(
  imageId: string
): Promise<{ success: boolean; error: string | null }> {
  const storeId = await getMerchantStoreId();

  try {
    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId)
      .eq("store_id", storeId);

    if (deleteError) throw deleteError;

    revalidatePath("/dashboard/products");
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Error deleting product image:", err);
    return { success: false, error: "فشل حذف الصورة" };
  }
}
