import { getAdminMerchants } from "@/actions/admin";
import { Users, Mail, Calendar, Store } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إدارة التجار | سبأ ستور",
};

export default async function AdminMerchantsPage() {
  const merchants = await getAdminMerchants();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">التجار</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة جميع التجار المسجلين في المنصة</p>
        </div>
      </div>

      {merchants.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-cairo font-bold text-foreground mb-2">لا يوجد تجار</h3>
          <p className="text-muted-foreground text-sm">لم يقم أي تاجر بالتسجيل في المنصة بعد.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-cairo">
                <tr>
                  <th className="px-6 py-4 font-semibold">الاسم</th>
                  <th className="px-6 py-4 font-semibold">البريد الإلكتروني</th>
                  <th className="px-6 py-4 font-semibold">تاريخ التسجيل</th>
                  <th className="px-6 py-4 font-semibold">المتاجر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {merchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {merchant.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={merchant.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
                          ) : (
                            <span className="font-bold text-primary font-cairo">
                              {merchant.full_name?.charAt(0) || "?"}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-foreground font-cairo">
                          {merchant.full_name || "غير محدد"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {merchant.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(merchant.created_at).toLocaleDateString("ar-EG")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Store className="w-4 h-4 text-muted-foreground" />
                        {merchant.stores?.length || 0} متجر
                      </div>
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
