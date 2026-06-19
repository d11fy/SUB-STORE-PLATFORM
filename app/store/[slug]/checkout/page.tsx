import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { CheckoutForm } from "./checkout-form";
import type { Metadata } from "next";

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: store } = await supabase.from("stores").select("name").eq("slug", slug).maybeSingle();
  return {
    title: store ? `إتمام الطلب | ${store.name}` : "إتمام الطلب",
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // Fetch store — includes settings JSONB for shipping_enabled flag
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, currency, requires_shipping, settings")
    .eq("slug", slug)
    .maybeSingle();

  if (storeError || !store) {
    console.error("Checkout: store fetch failed", storeError);
    notFound();
  }

  // shipping_enabled in settings JSONB overrides the DB column when explicitly set to false
  const storeSettings = (store.settings as any) ?? {};
  const requiresShipping =
    (store.requires_shipping ?? true) && storeSettings.shipping_enabled !== false;

  // Fetch active shipping methods (only needed for physical stores)
  const { data: shippingMethods } = await supabase
    .from("shipping_methods")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Fetch active payment methods
  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="text-right">
        <h1 className="text-2xl font-black text-foreground">إتمام عملية الشراء</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {requiresShipping
            ? "الرجاء ملء معلوماتك للتوصيل واختيار طريقة الدفع المناسبة"
            : "الرجاء إدخال معلوماتك واختيار طريقة الدفع المناسبة لإتمام الطلب"}
        </p>
      </div>

      <CheckoutForm
        storeSlug={slug}
        shippingMethods={shippingMethods || []}
        paymentMethods={paymentMethods || []}
        currency={store.currency}
        requiresShipping={requiresShipping}
      />
    </div>
  );
}
