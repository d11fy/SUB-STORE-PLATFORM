import { getPlatformSettings } from "@/actions/admin";
import { Settings, Info } from "lucide-react";
import type { Metadata } from "next";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "إعدادات المنصة | الإدارة",
};

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">إعدادات المنصة</h1>
          <p className="text-sm text-muted-foreground mt-1">التحكم في سلوك المنصة على مستوى النظام</p>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-blue-700">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">
          تُحفظ الإعدادات كسجل في نظام المراجعة. كل تغيير يُسجّل ويمكن مراجعته في صفحة سجلات المنصة.
        </p>
      </div>

      <SettingsForm initial={settings} />
    </div>
  );
}
