"use client";

import { useState, useTransition } from "react";
import { savePlatformSettings } from "@/actions/admin";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

interface SettingsFormProps {
  initial: Record<string, unknown>;
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [maintenanceMode, setMaintenanceMode] = useState(!!initial.maintenance_mode);
  const [freezeRegistrations, setFreezeRegistrations] = useState(!!initial.freeze_registrations);
  const [aiEnabled, setAiEnabled] = useState(initial.ai_features_enabled !== false);
  const [announcement, setAnnouncement] = useState((initial.announcement as string) ?? "");

  const handleSave = () => {
    startTransition(async () => {
      try {
        await savePlatformSettings({
          maintenance_mode: maintenanceMode,
          freeze_registrations: freezeRegistrations,
          ai_features_enabled: aiEnabled,
          announcement,
        });
        toast.success("تم حفظ الإعدادات بنجاح");
      } catch {
        toast.error("فشل حفظ الإعدادات");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toggle settings */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
        {[
          {
            label: "وضع الصيانة",
            description: "تعطيل الواجهة الأمامية لجميع المتاجر مؤقتاً",
            value: maintenanceMode,
            onChange: setMaintenanceMode,
            danger: true,
          },
          {
            label: "تجميد التسجيلات الجديدة",
            description: "منع إنشاء حسابات تجار جديدة",
            value: freezeRegistrations,
            onChange: setFreezeRegistrations,
            danger: true,
          },
          {
            label: "ميزات الذكاء الاصطناعي",
            description: "تفعيل/تعطيل جميع أدوات AI على مستوى المنصة",
            value: aiEnabled,
            onChange: setAiEnabled,
            danger: false,
          },
        ].map((setting) => (
          <div key={setting.label} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-cairo font-bold text-foreground">{setting.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
            </div>
            <button
              role="switch"
              aria-checked={setting.value}
              onClick={() => setting.onChange(!setting.value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                setting.value
                  ? setting.danger
                    ? "bg-rose-500"
                    : "bg-primary"
                  : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  setting.value ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Announcement banner */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <div>
          <p className="text-sm font-cairo font-bold text-foreground">رسالة الإعلان</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            تُعرض كشريط إشعار في أعلى جميع لوحات التحكم (اتركها فارغة لإخفائها)
          </p>
        </div>
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          rows={3}
          placeholder="مثال: سيتم إجراء أعمال صيانة يوم الجمعة من 2 - 4 صباحاً..."
          className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all font-cairo"
        />
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-cairo font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}
