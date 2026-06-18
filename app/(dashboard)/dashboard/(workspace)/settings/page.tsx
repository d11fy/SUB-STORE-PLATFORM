// ============================================================
// Saba Store — Settings Page
// ============================================================
import { getMerchantStoreWithPackage } from "@/actions/store-utils";
import { SettingsForm } from "./settings-form";
import type { Metadata } from "next";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { Settings2 } from "lucide-react";

export const metadata: Metadata = {
  title: "إعدادات المتجر",
  description: "إدارة إعدادات المتجر العامة والهوية وتفاصيل الاتصال",
};

export default async function SettingsPage() {
  const store = await getMerchantStoreWithPackage();

  return (
    <div className="page-shell">
      <PremiumPageHeader
        icon={Settings2}
        title="إعدادات المتجر"
        description="قم بتحديث هوية متجرك وعملته وحالته التشغيلية وروابط التواصل الاجتماعي."
      />

      <SettingsForm store={store} />
    </div>
  );
}
