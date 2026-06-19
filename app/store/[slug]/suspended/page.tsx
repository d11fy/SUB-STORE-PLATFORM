import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldOff, Phone, Mail } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: store } = await supabase.from("stores").select("name").eq("slug", slug).maybeSingle();
  return { title: store ? `${store.name} — المتجر متوقف` : "المتجر متوقف" };
}

export default async function StoreSuspendedPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, logo_url, email, whatsapp, phone")
    .eq("slug", slug)
    .maybeSingle();

  if (!store) notFound();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4"
      dir="rtl"
      style={{ fontFamily: "'Cairo', 'Segoe UI', sans-serif" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 flex flex-col items-center gap-4">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <ShieldOff className="w-8 h-8 text-white/60" />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">{store.name}</h1>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <ShieldOff className="w-7 h-7 text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">المتجر متوقف مؤقتاً</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              هذا المتجر متوقف حالياً بسبب انتهاء الاشتراك أو تعليق الحساب.
              يرجى التواصل مع صاحب المتجر للمزيد من المعلومات.
            </p>
          </div>

          {/* Contact */}
          {(store.whatsapp || store.email || store.phone) && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">للتواصل مع المتجر</p>
              <div className="flex flex-col gap-2">
                {store.whatsapp && (
                  <a
                    href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
                  >
                    <Phone className="w-4 h-4" />
                    واتساب: {store.whatsapp}
                  </a>
                )}
                {store.email && (
                  <a
                    href={`mailto:${store.email}`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <Mail className="w-4 h-4" />
                    {store.email}
                  </a>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 pt-2">
            مشغّل بواسطة{" "}
            <Link href="/" className="text-blue-600 hover:underline font-medium">
              سبأ ستور
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
