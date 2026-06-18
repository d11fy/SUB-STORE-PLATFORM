import type { Metadata } from "next";
import { Globe } from "lucide-react";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";

export const metadata: Metadata = {
  title: "إعدادات النطاق",
  description: "ربط نطاق مخصص بمتجرك",
};

export default function DomainPage() {
  return (
    <div className="page-shell">
      <PremiumPageHeader
        icon={Globe}
        title="النطاق المخصص"
        description="اربط نطاقك الخاص بمتجرك لتقديم تجربة احترافية لعملائك."
      />

      <div className="glass-card p-8 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
          <Globe className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-cairo font-bold text-foreground">
          النطاقات المخصصة — قريباً
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ستتمكن قريباً من ربط نطاقك الخاص (مثال:{" "}
          <span className="font-mono text-primary">store.example.com</span>) بمتجرك مباشرةً.
          <br />
          هذه الميزة قيد التطوير وستُضاف في التحديث القادم.
        </p>
        <p className="text-xs text-muted-foreground border border-border rounded-xl px-4 py-3 bg-muted/30">
          متجرك متاح الآن عبر الرابط الافتراضي:{" "}
          <span className="font-mono text-primary font-bold">saba.store/[اسم-متجرك]</span>
        </p>
      </div>
    </div>
  );
}
