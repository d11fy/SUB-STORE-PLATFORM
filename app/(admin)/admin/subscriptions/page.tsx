import { getAdminSubscriptions } from "@/actions/admin";
import { ExtendTrialAction } from "./subscription-actions";
import { Crown, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الاشتراكات والتجارب المجانية | سبأ ستور",
};

export default async function AdminSubscriptionsPage() {
  const subscriptions = await getAdminSubscriptions();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">الاشتراكات</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة اشتراكات المتاجر وفترات التجربة المجانية</p>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-cairo font-bold text-foreground mb-2">لا توجد اشتراكات</h3>
          <p className="text-muted-foreground text-sm">لم يقم أي متجر بالاشتراك في باقة حتى الآن.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-cairo">
                <tr>
                  <th className="px-6 py-4 font-semibold">المتجر</th>
                  <th className="px-6 py-4 font-semibold">الباقة</th>
                  <th className="px-6 py-4 font-semibold">تاريخ البداية</th>
                  <th className="px-6 py-4 font-semibold">تاريخ الانتهاء</th>
                  <th className="px-6 py-4 font-semibold">الحالة</th>
                  <th className="px-6 py-4 font-semibold text-left">تمديد التجربة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {sub.stores?.name}
                    </td>
                    <td className="px-6 py-4">
                      {sub.packages?.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(sub.current_period_start).toLocaleDateString("ar-EG")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {sub.status === 'trial' && sub.trial_ends_at 
                          ? new Date(sub.trial_ends_at).toLocaleDateString("ar-EG")
                          : new Date(sub.current_period_end).toLocaleDateString("ar-EG")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                        sub.status === 'trial' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {sub.status === 'active' ? 'نشط' : 
                         sub.status === 'trial' ? 'فترة تجريبية' : 
                         sub.status === 'expired' ? 'منتهي' : sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      {(sub.status === 'trial' || sub.status === 'expired') && sub.store_id ? (
                        <div className="flex justify-end">
                          <ExtendTrialAction subscriptionId={sub.id} storeId={sub.store_id} />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">غير متاح</span>
                      )}
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
