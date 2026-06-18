import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, Clock, ShieldCheck, XCircle, FileText, Landmark, User, MapPin } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ProofUploadForm } from "./proof-upload-form";
import type { Metadata } from "next";

interface OrderStatusPageProps {
  params: Promise<{ slug: string; orderId: string }>;
}

export async function generateMetadata({ params }: OrderStatusPageProps): Promise<Metadata> {
  const { slug, orderId } = await params;
  const supabase = createAdminClient();
  const { data: store } = await supabase.from("stores").select("name").eq("slug", slug).maybeSingle();
  return {
    title: store ? `حالة الطلب | ${store.name}` : "حالة الطلب",
  };
}

export default async function OrderStatusPage({ params }: OrderStatusPageProps) {
  const { slug, orderId } = await params;
  const supabase = createAdminClient();

  // Fetch store
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, currency, name")
    .eq("slug", slug)
    .maybeSingle();

  if (storeError || !store) {
    notFound();
  }

  // Fetch order (confirm store ownership)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("store_id", store.id)
    .maybeSingle();

  if (orderError || !order) {
    notFound();
  }

  // Fetch order items
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  // Fetch payment proof if uploaded
  const { data: proof } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("order_id", order.id)
    .maybeSingle();

  // Fetch payment method
  const { data: paymentMethod } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("id", order.payment_method_id ?? "")
    .maybeSingle();

  // Fetch shipping method
  const { data: shippingMethod } = await supabase
    .from("shipping_methods")
    .select("*")
    .eq("id", order.shipping_method_id ?? "")
    .maybeSingle();

  // Format order status with Arabic label and Tailwind classes
  const statusConfig = {
    جديد: { label: "جديد (بانتظار التأكيد)", bg: "bg-blue-50 text-blue-700 border-blue-200" },
    بانتظار_تأكيد_الدفع: { label: "بانتظار تأكيد الدفع", bg: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" },
    تم_تأكيد_الدفع: { label: "تم تأكيد الدفع", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    فشل_الدفع: { label: "فشل / رفض الدفع", bg: "bg-red-50 text-red-700 border-red-200" },
    قيد_التجهيز: { label: "قيد التجهيز والتحضير", bg: "bg-violet-50 text-violet-700 border-violet-200" },
    تم_الشحن: { label: "تم الشحن والتوصيل", bg: "bg-sky-50 text-sky-700 border-sky-200" },
    مكتمل: { label: "مكتمل وتم الاستلام", bg: "bg-teal-50 text-teal-700 border-teal-200" },
    ملغي: { label: "ملغي", bg: "bg-muted text-muted-foreground border-border" },
  };

  const currentStatus = statusConfig[order.status as keyof typeof statusConfig] || {
    label: order.status,
    bg: "bg-muted text-foreground border-border",
  };

  const requiresTransfer = paymentMethod?.type === "bank_transfer" || paymentMethod?.type === "local_wallet";
  const showUploadForm = requiresTransfer && (!proof || proof.review_status === "rejected");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-cairo">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6 text-right">
        <div>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted border border-border">
            {order.status === "تم_تأكيد_الدفع" || order.status === "مكتمل" ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <Clock className="h-5 w-5 text-amber-600" />
            )}
          </span>
          <h1 className="text-2xl font-black text-foreground mt-3">تفاصيل حالة الطلب</h1>
          <p className="text-xs text-muted-foreground mt-1">
            رقم الطلب: <span className="font-bold font-numbers text-foreground select-all">{order.order_number}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold ${currentStatus.bg}`}>
            {currentStatus.label}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-right">
        {/* Right side: Payment upload or Transfer info (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Guide Banner */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-foreground text-sm">متابعة حالة الطلب</h3>
            <div className="text-xs leading-relaxed text-muted-foreground space-y-3">
              {order.status === "جديد" && paymentMethod?.type === "cash_on_delivery" && (
                <p className="text-emerald-700 font-semibold">
                  ✓ تم تسجيل طلبك بنجاح كطلب دفع عند الاستلام. يقوم فريق العمل بمراجعة الطلبات والاتصال بك لتأكيد العنوان وشحن البضائع في أقرب وقت.
                </p>
              )}
              {order.status === "بانتظار_تأكيد_الدفع" && !proof && (
                <p className="text-amber-700 font-semibold">
                  ⚠️ بانتظار تحويل الدفعة. يرجى إتمام التحويل المالي باستخدام البيانات أدناه وإرفاق صورة الإيصال ليتم تفعيل وتأكيد الطلب.
                </p>
              )}
              {order.status === "بانتظار_تأكيد_الدفع" && proof && (
                <p className="text-blue-700 font-semibold">
                  ✓ تم إرفاق إيصال الدفعة بنجاح! طلبك قيد التحقق المالي حالياً من قبل التاجر وسيتم تحديث الحالة فور المراجعة.
                </p>
              )}
              {order.status === "تم_تأكيد_الدفع" && (
                <p className="text-emerald-700 font-semibold">
                  ✓ تم تأكيد دفع قيمة الطلب بنجاح! يتم الآن تجهيز طلبيتك للشحن.
                </p>
              )}
              {order.status === "فشل_الدفع" && (
                <div className="space-y-2">
                  <p className="text-destructive font-bold">
                    ❌ تم رفض إثبات الدفع المرفوع لطلبك!
                  </p>
                  {proof?.rejection_reason && (
                    <p className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-destructive font-medium">
                      سبب الرفض: {proof.rejection_reason}
                    </p>
                  )}
                  <p className="text-[11px]">
                    يرجى إعادة المحاولة ورفع صورة إيصال صحيحة وواضحة لتسهيل عملية المراجعة.
                  </p>
                </div>
              )}
              {order.status === "قيد_التجهيز" && (
                <p className="text-violet-700 font-semibold">
                  📦 نقوم الآن بتجهيز وحزم المنتجات الخاصة بك في المستودع تمهيداً لتسليمها لشركة التوصيل.
                </p>
              )}
              {order.status === "تم_الشحن" && (
                <p className="text-sky-700 font-semibold">
                  🚚 تم شحن طلبك وهو الآن في طريقه إليك! سيقوم مندوب التوصيل بالاتصال بك قريباً لتسليم الشحنة.
                </p>
              )}
              {order.status === "مكتمل" && (
                <p className="text-teal-700 font-semibold">
                  🎉 تم تسليم واكتمال هذا الطلب بنجاح. شكراً لثقتكم بنا وتوقكم من متجرنا!
                </p>
              )}
              {order.status === "ملغي" && (
                <p className="text-muted-foreground font-semibold">
                  ✖ تم إلغاء هذا الطلب. إذا كان لديك أي استفسار يرجى التواصل مع إدارة المتجر مباشرة.
                </p>
              )}
            </div>
          </div>

          {/* Bank Transfer Instructions Card */}
          {requiresTransfer && !proof && (
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2 justify-end">
                <span>بيانات تحويل الدفعة المالية</span>
                <Landmark className="h-4 w-4 text-primary" />
              </h3>
              <div className="bg-muted border border-border p-4 rounded-xl text-xs space-y-3 text-muted-foreground">
                {paymentMethod.bank_name && (
                  <p>اسم الجهة/البنك: <span className="text-foreground font-bold">{paymentMethod.bank_name}</span></p>
                )}
                {paymentMethod.account_holder_name && (
                  <p>اسم صاحب الحساب: <span className="text-foreground font-bold">{paymentMethod.account_holder_name}</span></p>
                )}
                {paymentMethod.account_number && (
                  <p>رقم الحساب/المحفظة: <span className="text-foreground font-black font-numbers select-all">{paymentMethod.account_number}</span></p>
                )}
                {paymentMethod.iban && (
                  <p>الآيبان IBAN: <span className="text-foreground font-black font-numbers select-all">{paymentMethod.iban}</span></p>
                )}
                {paymentMethod.instructions && (
                  <p className="border-t border-border pt-3 mt-3 whitespace-pre-line text-[11px] leading-relaxed">
                    {paymentMethod.instructions}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Proof Details (If proof uploaded) */}
          {proof && (
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-foreground text-sm">تفاصيل إثبات الدفع المرفق</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-muted border border-border p-3 rounded-xl">
                  <span className="text-muted-foreground block mb-0.5">اسم المحوّل</span>
                  <span className="font-semibold text-foreground">{proof.payer_name}</span>
                </div>
                <div className="bg-muted border border-border p-3 rounded-xl">
                  <span className="text-muted-foreground block mb-0.5">الرقم المرجعي للعملية</span>
                  <span className="font-semibold text-foreground font-numbers">{proof.transaction_reference || "غير متوفر"}</span>
                </div>
                <div className="bg-muted border border-border p-3 rounded-xl">
                  <span className="text-muted-foreground block mb-0.5">تاريخ الرفع</span>
                  <span className="font-semibold text-foreground font-numbers">
                    {new Date(proof.uploaded_at).toLocaleString("ar-EG")}
                  </span>
                </div>
                <div className="bg-muted border border-border p-3 rounded-xl">
                  <span className="text-muted-foreground block mb-0.5">حالة المراجعة</span>
                  <span className={cn(
                    "font-bold",
                    proof.review_status === "approved" ? "text-emerald-600" :
                    proof.review_status === "rejected" ? "text-destructive" : "text-amber-600 animate-pulse"
                  )}>
                    {proof.review_status === "approved" ? "تمت الموافقة" :
                     proof.review_status === "rejected" ? "مرفوض" : "قيد المراجعة والتدقيق"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Show Upload Form */}
          {showUploadForm && (
            <ProofUploadForm orderId={order.id} storeSlug={slug} />
          )}
        </div>

        {/* Left side: Invoice Summary & Shipping details (1/3 width) */}
        <div className="space-y-6">
          {/* Client Info Card */}
          <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-foreground text-xs border-b border-border pb-2 flex items-center gap-1.5 justify-end">
              <span>تفاصيل المشحن والمستلم</span>
              <User className="h-4 w-4 text-primary" />
            </h3>
            <div className="space-y-2 text-xs text-foreground leading-relaxed">
              <p>الاسم: <span className="text-foreground font-medium">{order.full_name}</span></p>
              <p dir="ltr" className="text-right">الهاتف: <span className="text-foreground font-medium font-numbers">{order.phone}</span></p>
              {order.email && <p>البريد: <span className="text-foreground font-medium font-sans">{order.email}</span></p>}
              <div className="border-t border-border pt-2 mt-2 flex items-start gap-2 justify-end">
                <div className="text-right flex-1">
                  <span className="text-muted-foreground block">عنوان التوصيل</span>
                  <span className="text-foreground font-medium">{order.city}، {order.address}</span>
                </div>
                <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
              </div>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-foreground text-xs border-b border-border pb-2 flex items-center gap-1.5 justify-end">
              <span>ملخص الفاتورة</span>
              <FileText className="h-4 w-4 text-primary" />
            </h3>

            {/* Items */}
            <div className="space-y-3 font-sans divide-y divide-border">
              {orderItems?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs pt-2 first:pt-0">
                  <span className="text-muted-foreground font-numbers">x{item.quantity}</span>
                  <span className="text-foreground text-right font-cairo flex-1 px-3 line-clamp-1">{item.product_name}</span>
                  <span className="font-bold text-muted-foreground font-numbers">
                    {formatCurrency(item.total_price, store.currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>تكلفة المنتجات</span>
                <span className="font-bold text-foreground font-numbers">{formatCurrency(order.subtotal, store.currency)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>تكلفة التوصيل</span>
                <span className="font-bold text-foreground font-numbers">{formatCurrency(order.shipping_cost, store.currency)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="font-bold text-foreground">المجموع النهائي</span>
                <span className="font-black text-emerald-600 text-sm font-numbers">
                  {formatCurrency(order.total_amount, store.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Help helper function to set styling
function className(status: string) {
  return "w-10 h-10 rounded-xl flex items-center justify-center bg-muted border border-border shrink-0";
}
