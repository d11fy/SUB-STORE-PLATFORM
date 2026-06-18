import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

interface OrderConfirmationPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orderId?: string }>;
}

export async function generateMetadata({ params }: OrderConfirmationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: store } = await supabase.from("stores").select("name").eq("slug", slug).maybeSingle();
  return {
    title: store ? `شكراً لطلبك | ${store.name}` : "شكراً لطلبك",
  };
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationPageProps) {
  const { slug } = await params;
  const { orderId } = await searchParams;

  return (
    <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6 font-cairo">
      <div className="bg-card border border-border p-8 rounded-2xl space-y-6 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-foreground">تم تسجيل طلبك بنجاح!</h1>
          <p className="text-muted-foreground text-xs leading-relaxed">
            نشكرك على التسوق من متجرنا. لقد تم استلام طلبك وبدأ معالجته في النظام.
          </p>
        </div>

        {orderId ? (
          <div className="pt-2">
            <Link
              href={`/store/${slug}/orders/${orderId}`}
              className="w-full py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              متابعة حالة الطلب وإرفاق الوصل
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        ) : (
          <div className="pt-2">
            <Link
              href={`/store/${slug}/products`}
              className="w-full py-3 bg-muted border border-border text-foreground text-xs font-bold rounded-xl hover:bg-muted/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              تصفح المزيد من المنتجات
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
