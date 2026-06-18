import { getDashboardStats } from "@/actions/admin";
import { Store, Users, ShoppingBag, CreditCard, Activity, Crown } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إدارة المنصة | سبأ ستور",
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "إجمالي المتاجر",
      value: stats.storesCount,
      icon: Store,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "المتاجر النشطة",
      value: stats.activeStoresCount,
      icon: Activity,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "التجار المسجلين",
      value: stats.merchantsCount,
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "إجمالي الطلبات",
      value: stats.ordersCount,
      icon: ShoppingBag,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "المبيعات المسجلة",
      value: `${stats.totalSales} ₪`,
      icon: CreditCard,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      title: "الاشتراكات النشطة",
      value: stats.subscriptionsCount,
      icon: Crown,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-cairo font-bold text-foreground">نظرة عامة</h1>
          <p className="text-sm text-muted-foreground mt-1">إحصائيات وأداء منصة سبأ ستور</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-card border border-border rounded-2xl p-6 flex items-start gap-4 hover:border-primary/20 transition-colors">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
              <h3 className="text-2xl font-bold text-foreground">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
