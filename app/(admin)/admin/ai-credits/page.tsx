import { getAdminAiCredits } from "@/actions/admin";
import { AddCreditsAction } from "./ai-credits-actions";
import { Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "أرصدة الذكاء الاصطناعي | سبأ ستور",
};

export default async function AdminAiCreditsPage() {
  const credits = await getAdminAiCredits();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">أرصدة الذكاء الاصطناعي</h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة أرصدة توليد المحتوى للمتاجر</p>
        </div>
      </div>

      {credits.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-cairo font-bold text-foreground mb-2">لا يوجد أرصدة</h3>
          <p className="text-muted-foreground text-sm">لم يتم تسجيل أي أرصدة لأي متجر بعد.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-cairo">
                <tr>
                  <th className="px-6 py-4 font-semibold">المتجر</th>
                  <th className="px-6 py-4 font-semibold text-center">الرصيد الشهري الكلي</th>
                  <th className="px-6 py-4 font-semibold text-center">الرصيد المتبقي</th>
                  <th className="px-6 py-4 font-semibold text-center">آخر استخدام</th>
                  <th className="px-6 py-4 font-semibold text-left">إجراءات يدوية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {credits.map((credit) => {
                  const creditsRemaining = credit.credits_total - credit.credits_used;
                  const percentage = Math.max(0, Math.min(100, (creditsRemaining / (credit.credits_total || 1)) * 100));
                  const isLow = percentage <= 10;
                  
                  return (
                    <tr key={credit.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {credit.stores?.name}
                      </td>
                      <td className="px-6 py-4 text-center text-muted-foreground">
                        {credit.credits_total}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`font-bold ${isLow ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {creditsRemaining}
                          </span>
                          <div className="w-full max-w-[100px] h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-muted-foreground">
                        {new Date(credit.updated_at).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="px-6 py-4">
                        {credit.store_id && (
                          <AddCreditsAction storeId={credit.store_id} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
