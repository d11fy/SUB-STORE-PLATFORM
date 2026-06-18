import { notFound } from "next/navigation";
import { getAdminStoreDetails } from "@/actions/admin";
import { StoreStatusActions } from "./store-actions";
import { Store, Globe, Calendar, Package, Crown, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تفاصيل المتجر | الإدارة",
};

export default async function AdminStoreDetailsPage({ params }: { params: { id: string } }) {
  const store = await getAdminStoreDetails(params.id);

  if (!store) {
    notFound();
  }

  const pkg = store.packages;
  const sub = store.subscriptions;
  const owner = store.users;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
            {store.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <Store className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-cairo font-bold text-foreground">{store.name}</h1>
            <p className="text-muted-foreground dir-ltr text-right">{store.slug}.sabastore.com</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
            store.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
            store.status === 'suspended' ? 'bg-rose-500/10 text-rose-500' :
            'bg-amber-500/10 text-amber-500'
          }`}>
            {store.status === 'active' ? 'نشط' : store.status === 'suspended' ? 'موقوف' : 'قيد المراجعة'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Owner Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-cairo font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            بيانات التاجر
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">الاسم الكامل</p>
              <p className="font-medium text-foreground">{owner?.full_name || "غير محدد"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
              <p className="font-medium text-foreground">{owner?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
              <p className="font-medium text-foreground">{new Date(owner?.created_at).toLocaleDateString("ar-EG")}</p>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-cairo font-bold text-foreground flex items-center gap-2">
            <Crown className="w-5 h-5 text-muted-foreground" />
            الاشتراك والباقة
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">الباقة الحالية</p>
              <p className="font-medium text-foreground inline-flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                {pkg?.name || "لا يوجد باقة"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">حالة الاشتراك</p>
              <p className="font-medium text-foreground">
                {sub?.status === 'active' ? 'نشط' : 
                 sub?.status === 'trial' ? 'فترة تجريبية' : 
                 sub?.status === 'expired' ? 'منتهي' : 'لا يوجد'}
              </p>
            </div>
            {sub?.trial_ends_at && (
              <div>
                <p className="text-sm text-muted-foreground">نهاية التجربة المجانية</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {new Date(sub.trial_ends_at).toLocaleDateString("ar-EG")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Actions Container */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-cairo font-bold text-foreground">إجراءات الإدارة</h3>
        
        <div className="flex flex-col gap-4">
          <div className="border border-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-foreground">حالة المتجر</p>
              <p className="text-sm text-muted-foreground">تغيير حالة المتجر يؤثر على ظهوره للعملاء وإمكانية دخول التاجر</p>
            </div>
            <StoreStatusActions storeId={store.id} currentStatus={store.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
