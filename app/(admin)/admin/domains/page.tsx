import { adminGetAllDomainsAction } from "@/actions/domain";
import { Globe } from "lucide-react";
import type { Metadata } from "next";
import type { StoreDomain } from "@/lib/types/database";

export const metadata: Metadata = { title: "إدارة النطاقات | سبأ ستور" };

type DomainWithStore = StoreDomain & { stores: { name: string; slug: string } | null };

function StatusBadge({ domain }: { domain: DomainWithStore }) {
  const raw = (domain.dns_records as Record<string, unknown>) ?? {};
  const status = (raw.status as string) ?? (domain.is_verified ? "active" : "pending_dns");

  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending_dns: "bg-amber-50 text-amber-700 border-amber-200",
    verifying: "bg-blue-50 text-blue-700 border-blue-200",
    invalid: "bg-rose-50 text-rose-700 border-rose-200",
    failed: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const labels: Record<string, string> = {
    active: "مفعّل",
    pending_dns: "بانتظار DNS",
    verifying: "جارٍ التحقق",
    invalid: "DNS خاطئ",
    failed: "فشل",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] ?? styles.pending_dns}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default async function AdminDomainsPage() {
  const { data: domains, error } = await adminGetAllDomainsAction();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-cairo font-bold text-foreground">النطاقات المخصصة</h1>
        <p className="text-sm text-muted-foreground mt-1">جميع النطاقات المضافة عبر المنصة</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {domains.length === 0 && !error && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Globe className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-cairo font-medium">لا توجد نطاقات مضافة</p>
        </div>
      )}

      {domains.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-cairo">
                <tr>
                  <th className="px-6 py-4 font-semibold">النطاق</th>
                  <th className="px-6 py-4 font-semibold">المتجر</th>
                  <th className="px-6 py-4 font-semibold">الحالة</th>
                  <th className="px-6 py-4 font-semibold">رئيسي؟</th>
                  <th className="px-6 py-4 font-semibold">آخر فحص</th>
                  <th className="px-6 py-4 font-semibold">رسالة الخطأ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {domains.map((domain) => {
                  const raw = (domain.dns_records as Record<string, unknown>) ?? {};
                  const lastChecked = raw.last_checked_at as string | null;
                  const errorMsg = raw.error_message as string | null;
                  return (
                    <tr key={domain.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-foreground" dir="ltr">{domain.domain}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{domain.stores?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{domain.stores?.slug}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge domain={domain} />
                      </td>
                      <td className="px-6 py-4">
                        {domain.is_primary ? (
                          <span className="text-xs font-medium text-primary">نعم</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {lastChecked ? new Date(lastChecked).toLocaleString("ar-SA") : "—"}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-[200px] truncate">
                        {errorMsg ?? "—"}
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
