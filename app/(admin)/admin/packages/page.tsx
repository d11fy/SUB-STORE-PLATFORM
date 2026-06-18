import { getAdminPackages } from "@/actions/admin";
import { PackageForm } from "./package-form";
import { Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إدارة الباقات | سبأ ستور",
};

export default async function AdminPackagesPage() {
  const packages = await getAdminPackages();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">الباقات والأسعار</h1>
          <p className="text-sm text-muted-foreground mt-1">تعديل حدود الباقات المقدمة للتجار</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-cairo font-bold text-foreground">{pkg.name}</h3>
                <p className="text-sm text-muted-foreground">{pkg.price_monthly} ₪ / شهر</p>
              </div>
            </div>
            
            <div className="text-sm space-y-2 mb-6 flex-1 text-muted-foreground">
              <p>دومين مخصص: <span className="text-foreground font-medium">{pkg.has_custom_domain ? "نعم" : "لا"}</span></p>
              <p>الثيمات: <span className="text-foreground font-medium">{pkg.max_themes} ثيم</span></p>
              <p>إشعارات البريد: <span className="text-foreground font-medium">{pkg.has_email_notif ? "نعم" : "لا"}</span></p>
            </div>

            <PackageForm 
              pkgId={pkg.id} 
              maxProducts={pkg.max_products} 
              maxAiCredits={pkg.max_ai_credits} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
