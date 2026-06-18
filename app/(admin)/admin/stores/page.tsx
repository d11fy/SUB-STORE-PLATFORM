import Link from "next/link";
import { getAdminStores } from "@/actions/admin";
import { Store as StoreIcon, ExternalLink, Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إدارة المتاجر | سبأ ستور",
};

export default async function AdminStoresPage() {
  const stores = await getAdminStores();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">المتاجر</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة جميع المتاجر المسجلة في المنصة</p>
        </div>
      </div>

      {stores.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <StoreIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-cairo font-bold text-foreground mb-2">لا توجد متاجر</h3>
          <p className="text-muted-foreground text-sm">لم يقم أي تاجر بإنشاء متجر بعد.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-cairo">
                <tr>
                  <th className="px-6 py-4 font-semibold">المتجر</th>
                  <th className="px-6 py-4 font-semibold">التاجر</th>
                  <th className="px-6 py-4 font-semibold">الباقة</th>
                  <th className="px-6 py-4 font-semibold">حالة المتجر</th>
                  <th className="px-6 py-4 font-semibold">حالة الاشتراك</th>
                  <th className="px-6 py-4 font-semibold text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <StoreIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground font-cairo">{store.name}</p>
                          <p className="text-xs text-muted-foreground dir-ltr text-right">{store.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{store.users?.full_name || "غير معروف"}</p>
                      <p className="text-xs text-muted-foreground">{store.users?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                        {store.packages?.name || "بدون باقة"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        store.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                        store.status === 'suspended' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {store.status === 'active' ? 'نشط' : store.status === 'suspended' ? 'موقوف' : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        store.subscriptions?.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                        store.subscriptions?.status === 'trial' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {store.subscriptions?.status === 'active' ? 'نشط' : 
                         store.subscriptions?.status === 'trial' ? 'فترة تجريبية' : 
                         store.subscriptions?.status === 'expired' ? 'منتهي' : 'لا يوجد'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left space-x-2 space-x-reverse">
                      <Link 
                        href={`/admin/stores/${store.id}`}
                        className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        إدارة
                      </Link>
                      <a 
                        href={`/store/${store.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="عرض المتجر"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
