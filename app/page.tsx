import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Store,
  Shield,
  Globe,
  Sparkles,
  Package,
  CreditCard,
  Truck,
  Check,
  Star,
  Smartphone,
  Wallet,
  Play,
  Building,
  Coins,
  Gift,
  Shirt,
  Laptop,
  BookOpen,
  Gem,
  LayoutTemplate,
  UserCheck,
  ShoppingCart,
  Repeat,
  Landmark,
  Eye,
  UserPlus,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "سبأ ستور — منصة التجارة الإلكترونية العربية",
  description:
    "أنشئ متجرك الإلكتروني الاحترافي بالعربية في دقائق. منصة SaaS متكاملة للتجار في فلسطين والأردن.",
};

// ============================================================
// DATA
// ============================================================
const trustItems = [
  { name: "فلسطين", icon: "🇵🇸" },
  { name: "الأردن", icon: "🇯🇴" },
  { name: "محافظ إلكترونية", label: "Jawwal Pay / Zain Cash", icon: <Wallet className="h-4 w-4 text-[#1B4FD8]" /> },
  { name: "تحويلات بنكية", label: "بنوك محلية", icon: <Building className="h-4 w-4 text-[#1B4FD8]" /> },
  { name: "الدفع عند الاستلام", label: "التوصيل للمنزل", icon: <Coins className="h-4 w-4 text-[#1B4FD8]" /> },
];

const features = [
  {
    icon: Store,
    title: "متجر عربي متكامل",
    desc: "واجهة متجر احترافية مهيأة بالكامل للغة العربية وتجربة المستخدم السريعة وسهولة التصفح.",
    color: "text-[#1B4FD8]",
    bg: "bg-blue-50/75",
  },
  {
    icon: CreditCard,
    title: "دفع محلي مرن",
    desc: "إعداد المحافظ المحلية (Jawwal Pay، Zain Cash)، التحويلات البنكية، والدفع عند الاستلام دون تعقيدات.",
    color: "text-emerald-600",
    bg: "bg-emerald-50/75",
  },
  {
    icon: Sparkles,
    title: "ذكاء اصطناعي مدمج",
    desc: "ولّد أسماء المنتجات، أوصافها، ومحتوى متجرك التسويقي بكفاءة عالية وباللغة العربية الفصحى.",
    color: "text-amber-500",
    bg: "bg-amber-50/75",
  },
  {
    icon: Truck,
    title: "شحن وتوصيل ذكي",
    desc: "أضف أسعار شحن مخصصة ومختلفة لكل مدينة ومنطقة مع تتبع حالة الطلبات والطلبيات المكتملة.",
    color: "text-purple-600",
    bg: "bg-purple-50/75",
  },
  {
    icon: Shield,
    title: "أمان واستقرار تام",
    desc: "بنية تحتية سحابية تضمن تشغيل متجرك بأعلى درجات الأمان وحماية البيانات والنسخ الاحتياطي.",
    color: "text-sky-600",
    bg: "bg-sky-50/75",
  },
  {
    icon: Globe,
    title: "نطاق مخصص (Domain)",
    desc: "اربط نطاقك الخاص (e.g. mystore.com) بسهولة أو استخدم نطاقنا الفرعي المجاني مدى الحياة.",
    color: "text-indigo-600",
    bg: "bg-indigo-50/75",
  },
];

const stepsData = [
  {
    step: "١",
    title: "أنشئ حسابك بالكامل",
    desc: "سجل حسابك خلال ثوانٍ معدودة، واختر اسماً ورابطاً فريداً لمتجرك لتبدأ فترتك التجريبية المجانية فوراً.",
    icon: UserPlus,
    iconColor: "text-[#1B4FD8]",
    iconBg: "bg-blue-50/80",
  },
  {
    step: "٢",
    title: "أضف منتجاتك للبيع",
    desc: "ارفع صور المنتجات، وحدد الأسعار، واستعن بمساعد الذكاء الاصطناعي الذكي لكتابة أوصاف المنتجات بضغطة زر.",
    icon: Package,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50/80",
  },
  {
    step: "٣",
    title: "استقبل المدفوعات والطلبات",
    desc: "شارك رابط متجرك الفريد على منصات التواصل واستقبل إشعارات المبيعات وتأكيدات الدفع مباشرة في لوحة التحكم.",
    icon: ShoppingBag,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50/80",
  },
];

const themesData = [
  {
    key: "fashion",
    title: "قالب الأزياء",
    category: "الملابس والأزياء",
    tagline: "هيرو سينمائي، بطاقات بورتريه 3:4، أقسام موسمية تحريرية.",
    accent: "#e11d48",
    icon: Shirt,
  },
  {
    key: "electronics",
    title: "قالب الإلكترونيات",
    category: "الإلكترونيات والتقنية",
    tagline: "عروض يومية، مواصفات في الكروت، تصنيفات تقنية سريعة.",
    accent: "#2563eb",
    icon: Laptop,
  },
  {
    key: "subscriptions",
    title: "قالب الاشتراكات",
    category: "الاشتراكات الرقمية",
    tagline: "تسعير SaaS، جدول مقارنة الباقات، تفعيل فوري.",
    accent: "#7c3aed",
    icon: Repeat,
  },
  {
    key: "books",
    title: "قالب الكتب والمحتوى",
    category: "الكتب والدورات الرقمية",
    tagline: "مكتبة رقمية، بطاقات غلاف، شارات نوع الملف.",
    accent: "#d97706",
    icon: BookOpen,
  },
  {
    key: "accessories",
    title: "قالب الإكسسوارات",
    category: "المجوهرات والهدايا",
    tagline: "فاتح فاخر، سبليت هيرو ذهبي وعاجي، بطاقات أنيقة.",
    accent: "#f59e0b",
    icon: Gem,
  },
  {
    key: "blank",
    title: "القالب المحايد",
    category: "مرن لجميع الأنشطة",
    tagline: "حياد كامل، قابل للتخصيص، حرف أولي للمتجر.",
    accent: "#6366f1",
    icon: LayoutTemplate,
  },
  {
    key: "personal_services",
    title: "قالب الخدمات",
    category: "الاستشارات والتدريب",
    tagline: "هيرو شخصي، باقات خدمات، شهادات عملاء.",
    accent: "#e11d48",
    icon: UserCheck,
  },
  {
    key: "general",
    title: "قالب المتجر العام",
    category: "السوبرماركت والبضائع",
    tagline: "شبكة أقسام، فلاش ديلز، بنر ترويجي متعدد التصنيفات.",
    accent: "#059669",
    icon: ShoppingCart,
  },
];

const packages = [
  {
    name: "الانطلاقة",
    price: 49,
    desc: "مثالية للمتاجر الناشئة والبدء التجريبي بأقل التكاليف وبأفضل الأدوات.",
    features: [
      "إضافة حتى 50 منتج نشط",
      "نطاق فرعي مجاني (slug.sabastore.com)",
      "2 ثيم أساسي احترافي",
      "50 رصيد ذكاء اصطناعي شهرياً",
      "إعداد المحافظ المحلية والدفع عند الاستلام",
      "لوحة تحكم إحصائيات مبسطة",
    ],
    cta: "ابدأ تجربتك المجانية",
    popular: false,
    slug: "starter",
  },
  {
    name: "النمو",
    price: 99,
    desc: "الخيار الأفضل للمتاجر النامية التي تحتاج ميزات تسويق متقدمة ونطاقاً خاصاً.",
    features: [
      "إضافة حتى 500 منتج نشط",
      "دعم ربط النطاق المخصص الخاص بك",
      "8 ثيمات متميزة بالكامل",
      "300 رصيد ذكاء اصطناعي شهرياً",
      "تخصيص أسعار الشحن حسب المدن",
      "تقارير مبيعات وتحليلات متقدمة",
      "نظام كوبونات الخصم والتخفيضات",
    ],
    cta: "ابدأ تجربتك المجانية",
    popular: true,
    slug: "growth",
  },
  {
    name: "الاحتراف",
    price: 199,
    desc: "للمتاجر الرائدة التي تبحث عن أقصى درجات التخصيص والأولوية والدعم المستمر.",
    features: [
      "عدد منتجات غير محدود",
      "ربط نطاق مخصص مجاني",
      "جميع الثيمات مع تخصيص كامل للـ CSS",
      "1000 رصيد ذكاء اصطناعي شهرياً",
      "إرسال إشعارات مباشرة عبر WhatsApp للعملاء",
      "تقارير مفصلة للمبيعات والعملاء والأرباح",
      "دعم فني مخصص وأولوية على مدار الساعة",
    ],
    cta: "ابدأ تجربتك المجانية",
    popular: false,
    slug: "pro",
  },
];

// ============================================================
// COMPONENT
// ============================================================
export default function LandingPage() {
  return (
    <div className="bg-[#FAF9F6] text-slate-900 min-h-screen font-cairo overflow-x-hidden selection:bg-[#1B4FD8]/10 selection:text-[#1B4FD8]">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-[#FAF9F6]/90 border-b border-slate-200/40 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">

          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4FD8] via-[#3B82F6] to-[#7C3AED] flex items-center justify-center text-white font-cairo font-black text-xl shadow-[0_4px_20px_rgba(27,79,216,0.3)] group-hover:scale-105 transition-all duration-300">
              س
            </div>
            <div className="flex flex-col">
              <span className="font-cairo font-black text-2xl tracking-tight text-slate-900 group-hover:text-[#1B4FD8] transition-colors leading-none">
                سبأ ستور
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 font-sans">Saba Store</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[15px] font-semibold text-slate-600 hover:text-[#1B4FD8] hover:translate-y-[-1px] transition-all duration-200">المميزات</a>
            <a href="#how-it-works" className="text-[15px] font-semibold text-slate-600 hover:text-[#1B4FD8] hover:translate-y-[-1px] transition-all duration-200">كيف نعمل</a>
            <a href="#themes" className="text-[15px] font-semibold text-slate-600 hover:text-[#1B4FD8] hover:translate-y-[-1px] transition-all duration-200">الثيمات</a>
            <a href="#pricing" className="text-[15px] font-semibold text-slate-600 hover:text-[#1B4FD8] hover:translate-y-[-1px] transition-all duration-200">الأسعار</a>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/login" className="text-[15px] font-bold text-slate-600 hover:text-[#1B4FD8] transition-colors px-3 py-2">
              تسجيل الدخول
            </Link>
            <Link
              href="/register"
              className={cn(
                "group px-6 py-3 rounded-xl font-cairo font-bold text-sm text-white",
                "bg-[#1B4FD8] hover:bg-[#153eb2]",
                "shadow-[0_4px_14px_rgba(27,79,216,0.25)] hover:shadow-[0_8px_25px_rgba(27,79,216,0.35)]",
                "hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300",
                "flex items-center gap-2"
              )}
            >
              ابدأ مجاناً
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[-4px] rtl-flip" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-6 pb-12 lg:pt-10 lg:pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-[-5%] w-[450px] h-[450px] bg-[#1B4FD8]/2 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-[-5%] w-[380px] h-[380px] bg-[#7C3AED]/2 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

          {/* Text */}
          <div className="lg:col-span-5 space-y-6 text-right z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-100/60 text-[#1B4FD8] text-xs font-bold shadow-sm">
              <Sparkles className="h-3.5 w-3.5 fill-current text-[#1B4FD8]" />
              <span>تجربة مجانية ٣ أيام — بدون بطاقة ائتمان</span>
            </div>

            <h1 className="font-cairo font-black text-slate-950 leading-[1.3] tracking-tight text-3xl sm:text-4xl lg:text-[2.65rem] xl:text-[3.15rem] text-balance">
              أنشئ متجرك <br className="hidden lg:inline" />
              <span>وابدأ البيع </span>
              <span className="text-[#1B4FD8]">خلال دقائق معدودة</span>
            </h1>

            <p className="text-sm sm:text-[15px] text-slate-600 font-ibm leading-relaxed max-w-xl font-medium">
              المنصة العربية المتكاملة لتأسيس وإدارة متجرك الإلكتروني في فلسطين والأردن. كل ما تحتاجه لإطلاق علامتك التجارية، وتلقي المدفوعات المحلية، وتوصيل طلباتك بسهولة وبدون أي عمولات على مبيعاتك.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              <Link
                href="/register"
                className={cn(
                  "group w-full sm:w-auto px-7 py-3.5 rounded-xl font-cairo font-bold text-base text-white text-center",
                  "bg-[#1B4FD8] hover:bg-[#153eb2] hover:-translate-y-0.5 active:translate-y-0",
                  "transition-all duration-300 shadow-[0_8px_25px_rgba(27,79,216,0.2)] hover:shadow-[0_8px_30px_rgba(27,79,216,0.35)]",
                  "flex items-center justify-center gap-2"
                )}
              >
                ابدأ تجربتك المجانية
                <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-[-4px] rtl-flip" />
              </Link>
              <a
                href="#how-it-works"
                className={cn(
                  "w-full sm:w-auto px-7 py-3.5 rounded-xl font-cairo font-bold text-base text-slate-700 text-center",
                  "border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300",
                  "transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                )}
              >
                <Play className="h-4 w-4 fill-slate-500 text-slate-500" />
                شاهد كيف تعمل المنصة
              </a>
            </div>
          </div>

          {/* Visual Mockup */}
          <div className="lg:col-span-7 relative flex justify-center items-center h-[520px] sm:h-[580px] w-full z-10 mt-6 lg:mt-0">

            <div className="absolute inset-0 bg-[#1B4FD8]/3 blur-3xl rounded-3xl pointer-events-none scale-90 sm:scale-100" />

            {/* Main Dashboard Card */}
            <div className="w-[88%] sm:w-[92%] bg-white rounded-2xl border border-slate-200/60 shadow-[0_30px_60px_rgba(0,0,0,0.03)] overflow-hidden scale-95 sm:scale-100 select-none">
              <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100/70 bg-slate-50/70">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-[10px] sm:text-xs text-slate-400 font-mono font-bold" dir="ltr">sabastore.com/dashboard</span>
                </div>
              </div>
              <div className="p-4 sm:p-5 grid grid-cols-3 gap-3 bg-white text-right">
                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400">مبيعات اليوم</p>
                  <p className="text-sm sm:text-base font-extrabold text-[#1B4FD8] font-sans mt-0.5">١,٤٥٠ ₪</p>
                </div>
                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400">الطلبيات النشطة</p>
                  <p className="text-sm sm:text-base font-extrabold text-emerald-600 font-sans mt-0.5">١٨ طلباً</p>
                </div>
                <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400">زوار المتجر</p>
                  <p className="text-sm sm:text-base font-extrabold text-amber-600 font-sans mt-0.5">٤٨٢ زائر</p>
                </div>
                <div className="col-span-3 mt-2 space-y-2">
                  <p className="text-[10px] font-bold text-slate-500">آخر العمليات المكتملة</p>
                  <div className="border border-slate-100/60 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800">ORD-٢٠٢٦-١٠٢</span>
                    <span className="text-slate-500 font-medium">أحمد م. (رام الله)</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[9px] font-bold">تم الشحن</span>
                    <span className="font-bold text-slate-700 font-sans">١٨٠ ₪</span>
                  </div>
                  <div className="border border-slate-100/60 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800">ORD-٢٠٢٦-١٠١</span>
                    <span className="text-slate-500 font-medium">يارا ع. (عمان)</span>
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[9px] font-bold">تم الدفع</span>
                    <span className="font-bold text-slate-700 font-sans">٢٤٠ ₪</span>
                  </div>
                </div>
                <div className="col-span-3 mt-1 h-20 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#1B4FD8]/5 to-transparent" />
                  <span className="text-[9px] text-slate-400 font-bold z-10">نشاط المبيعات والأرباح اليومية</span>
                  <svg className="absolute bottom-0 left-0 w-full h-10 text-[#1B4FD8]/80" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M 0 80 Q 20 25, 40 60 T 80 15 T 100 35 L 100 100 L 0 100 Z" fill="currentColor" fillOpacity="0.03" />
                    <path d="M 0 80 Q 20 25, 40 60 T 80 15 T 100 35" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="absolute -bottom-4 left-1 sm:-left-4 z-20 w-[170px] sm:w-[195px] h-[290px] sm:h-[340px] bg-white rounded-[2rem] border-[6px] border-slate-900 shadow-[0_25px_50px_rgba(0,0,0,0.06)] overflow-hidden scale-95 sm:scale-100">
              <div className="w-full h-4 bg-slate-900 flex justify-center items-center">
                <div className="w-10 h-1.5 bg-black rounded-full" />
              </div>
              <div className="p-2.5 space-y-2.5 bg-[#FAF8F5] h-full overflow-y-auto no-scrollbar text-right">
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-[10px] text-slate-800">متجر الأناقة</span>
                  <div className="w-4 h-4 rounded-full bg-[#1B4FD8] flex items-center justify-center text-white">
                    <Store className="h-2 w-2" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#7C3AED] to-[#1B4FD8] rounded-lg p-2 text-white text-right space-y-0.5 shadow-sm">
                  <p className="text-[7px] opacity-85">تخفيضات الافتتاح</p>
                  <p className="text-[10px] font-black">خصم يصل إلى ٣٠%</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-100 p-2 space-y-1">
                  <div className="h-16 bg-gradient-to-tr from-slate-100 to-slate-50 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <Package className="h-6 w-6 text-slate-300" />
                    <span className="absolute top-1 right-1 text-[7px] bg-red-500 text-white px-1 py-0.5 rounded-full font-bold">رائج</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-800">حذاء كلاسيكي بيج</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-[#1B4FD8] font-sans">٢٢٠ ₪</span>
                    <button className="text-[7px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold">أضف</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating: New Order */}
            <div className="absolute -top-4 left-0 sm:-left-8 z-30 bg-white/95 backdrop-blur-md border border-slate-100 p-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center gap-3 max-w-[190px] scale-95 sm:scale-100 hover:scale-[1.02] transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Check className="h-4 w-4" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 leading-none">طلب جديد مؤكد</p>
                <p className="text-xs font-black text-slate-900 mt-1 font-sans">١٨٠.٠٠ ₪</p>
              </div>
            </div>

            {/* Floating: Payment */}
            <div className="absolute top-24 -right-10 sm:-right-12 z-30 bg-white/95 backdrop-blur-md border border-slate-100 p-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center gap-3 max-w-[190px] scale-95 sm:scale-100 hover:scale-[1.02] transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1B4FD8] shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 leading-none">تم تأكيد الدفع</p>
                <p className="text-xs font-black text-blue-700 mt-1">Jawwal Pay</p>
              </div>
            </div>

            {/* Floating: Product Added */}
            <div className="absolute bottom-20 -right-8 sm:-right-10 z-30 bg-white/95 backdrop-blur-md border border-slate-100 p-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center gap-3 max-w-[190px] scale-95 sm:scale-100 hover:scale-[1.02] transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 leading-none">تم إضافة منتج</p>
                <p className="text-xs font-black text-slate-900 mt-1">ساعة يد ذكية</p>
              </div>
            </div>

            {/* Floating: Free Trial Badge */}
            <div className="absolute -top-10 right-6 sm:right-12 z-30 bg-gradient-to-l from-[#1B4FD8] to-[#4F46E5] text-white px-4 py-2 rounded-2xl shadow-[0_10px_25px_rgba(27,79,216,0.15)] text-[10px] font-extrabold flex items-center gap-2 scale-95 sm:scale-100 hover:scale-[1.02] transition-all duration-300">
              <Gift className="h-3.5 w-3.5 text-amber-300" />
              <span>فترة تجربة ٣ أيام مجانية</span>
            </div>

          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="relative -mt-4 mb-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/85 backdrop-blur-md border border-slate-200/50 rounded-3xl py-5 px-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-6">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-6 bg-[#1B4FD8] rounded-full" />
              <span className="text-sm font-extrabold text-slate-800 font-cairo">حل متكامل وموثوق للتجارة المحلية:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6">
              {trustItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs font-bold text-slate-700 bg-slate-50/80 border border-slate-100 hover:border-blue-100/50 hover:bg-white px-4 py-2.5 rounded-xl transition-all duration-300 shrink-0">
                  {typeof item.icon === "string" ? (
                    <span className="text-sm leading-none">{item.icon}</span>
                  ) : (
                    <span className="text-[#1B4FD8]">{item.icon}</span>
                  )}
                  <span className="font-cairo">{item.name}</span>
                  {item.label && (
                    <span className="text-[9px] text-slate-400 font-sans font-bold">({item.label})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 bg-slate-50/50 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-[-10%] w-[350px] h-[350px] bg-blue-50/30 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-cairo font-black text-slate-900 text-3xl sm:text-4xl leading-tight text-balance">
              أطلق متجرك الإلكتروني في ٣ خطوات
            </h2>
            <p className="text-slate-500 text-sm font-ibm max-w-lg mx-auto">
              دورة عمل مبسطة للغاية تمكنك من البدء بالبيع وجني الأرباح فوراً
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stepsData.map((step, idx) => (
              <div key={idx} className="bg-white border border-slate-100 p-8 rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.015)] relative group hover:border-[#1B4FD8]/30 hover:shadow-lg transition-all duration-300">
                <div className="absolute top-5 left-6 text-slate-200/50 font-sans font-black text-6xl leading-none opacity-40 group-hover:text-[#1B4FD8]/10 group-hover:scale-110 transition-all duration-300">
                  {step.step}
                </div>
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm", step.iconBg)}>
                  <step.icon className={cn("h-5 w-5", step.iconColor)} />
                </div>
                <h3 className="font-cairo font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm font-ibm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-cairo font-black text-slate-900 text-3xl sm:text-4xl leading-tight text-balance">
              كل الميزات التي تحتاجها لمتجر ناجح
            </h2>
            <p className="text-slate-500 text-sm font-ibm">
              أدوات تسويقية ووسائل إدارة احترافية مصممة خصيصاً لتناسب متطلبات التاجر العربي
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-[#FAF9F6]/20 border border-slate-200/50 p-6 rounded-2xl flex gap-4 hover:bg-white hover:border-[#1B4FD8]/20 hover:shadow-[0_15px_40px_rgba(27,79,216,0.02)] transition-all duration-300 text-right">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", feature.bg)}>
                  <feature.icon className={cn("h-5 w-5", feature.color)} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-cairo font-bold text-slate-900 text-base">{feature.title}</h4>
                  <p className="text-slate-500 text-sm font-ibm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI CONTENT GENERATOR ── */}
      <section className="py-24 bg-slate-50/50 border-y border-slate-200/40 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-[-10%] w-[400px] h-[400px] bg-amber-50/40 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

          <div className="lg:col-span-5 space-y-6 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold shadow-sm">
              <Sparkles className="h-3.5 w-3.5 fill-current animate-pulse" />
              <span>تقنية الذكاء الاصطناعي المدمجة</span>
            </div>
            <h2 className="font-cairo font-black text-slate-900 text-3xl sm:text-4xl leading-tight text-balance">
              ولّد محتوى متجرك وأوصاف المنتجات بضغطة زر
            </h2>
            <p className="text-slate-600 text-[15px] font-ibm leading-relaxed">
              نوفر لك مساعداً ذكياً مهيأً خصيصاً لمجال التجارة الإلكترونية باللغة العربية. اكتب فقط اسم المنتج، وسيقوم الذكاء الاصطناعي بصياغة وصف جذاب ومميزات لمنتجاتك بطريقة احترافية لزيادة مبيعاتك.
            </p>
            <div className="space-y-3.5">
              {[
                "صياغة أوصاف منتجات جذابة ومحفزة للشراء",
                "توليد أفكار وعناوين تسويقية لمتجرك وصفحاتك",
                "تعديل بيانات الـ SEO لتحسين ظهورك المجاني في Google",
              ].map((text, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-slate-700 text-sm font-bold justify-start">
                  <Check className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/60 shadow-lg p-6 sm:p-8 text-right relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <span className="font-cairo font-bold text-sm text-[#1B4FD8] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 fill-current text-amber-500" />
                مساعد الذكاء الاصطناعي لسبأ
              </span>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-200" />
                <div className="w-2 h-2 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400">اسم المنتج المراد وصفه</label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-800 font-bold">
                  حذاء كاجوال بيج كلاسيكي
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-400">سيتم التوليد فوراً باللغة العربية</span>
                  <label className="text-[11px] font-bold text-slate-400">نبرة الخطاب (Tone)</label>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-700 font-bold inline-block">
                  إقناعي وجذاب
                </div>
              </div>
              <div className="pt-1">
                <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-cairo font-bold text-xs shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all duration-300">
                  <Sparkles className="h-3.5 w-3.5 fill-current" />
                  <span>توليد وصف المنتج ذكياً</span>
                </button>
              </div>
              <div className="pt-1">
                <div className="bg-gradient-to-l from-amber-500/5 to-transparent border-r-4 border-amber-500 p-4 rounded-l-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
                    <span>الوصف المقترح:</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-ibm">
                    &quot;تألق بثقة وجاذبية مع حذاء الكاجوال الكلاسيكي المذهل باللون البيج الدافئ. مصمم خصيصاً ليمنح قدميك الراحة الكاملة طوال اليوم بفضل خامته الممتازة ونعله المرن والخفيف.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOCAL PAYMENTS ── */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <div className="lg:col-span-6 grid grid-cols-2 gap-4 relative">
            <div className="absolute inset-0 bg-[#1B4FD8]/2 rounded-3xl blur-3xl pointer-events-none" />
            <div className="bg-white border border-slate-100 p-6 rounded-2xl space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:border-[#1B4FD8]/20 hover:shadow-md transition-all duration-300 text-right">
              <div className="w-10 h-10 rounded-xl bg-blue-50/60 flex items-center justify-center shadow-sm border border-blue-100/50">
                <Smartphone className="h-5 w-5 text-[#1B4FD8]" />
              </div>
              <h4 className="font-cairo font-bold text-slate-950 text-base">بوابة Jawwal Pay</h4>
              <p className="text-xs text-slate-500 font-ibm leading-relaxed">استقبل أموالك في فلسطين مباشرة على محفظتك، مع توفير خيار الدفع الذكي عبر QR السريع.</p>
            </div>
            <div className="bg-white border border-slate-100 p-6 rounded-2xl space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:border-emerald-500/20 hover:shadow-md transition-all duration-300 text-right">
              <div className="w-10 h-10 rounded-xl bg-emerald-50/60 flex items-center justify-center shadow-sm border border-emerald-100/50">
                <CreditCard className="h-5 w-5 text-emerald-600" />
              </div>
              <h4 className="font-cairo font-bold text-slate-950 text-base">محفظة Zain Cash</h4>
              <p className="text-xs text-slate-500 font-ibm leading-relaxed">سهل لعملائك في الأردن الدفع عبر زين كاش بخطوات دفع مختصرة وفورية دون تعقيدات.</p>
            </div>
            <div className="bg-white border border-slate-100 p-6 rounded-2xl space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:border-indigo-500/20 hover:shadow-md transition-all duration-300 text-right col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50/60 flex items-center justify-center shadow-sm border border-indigo-100/50">
                  <Landmark className="h-5 w-5 text-indigo-600" />
                </div>
                <h4 className="font-cairo font-bold text-slate-950 text-base">التحويلات البنكية المباشرة</h4>
              </div>
              <p className="text-xs text-slate-500 font-ibm leading-relaxed mt-2">
                أضف حساباتك في بنك فلسطين، البنك العربي، أو أي بنك محلي آخر. يرفع العميل صورة إشعار التحويل وتؤكده بضغطة واحدة من لوحة التحكم لتتحول حالة الطلب تلقائياً.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6 text-right lg:pl-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold shadow-sm">
              <Wallet className="h-3.5 w-3.5" />
              <span>دعم كامل للمدفوعات المحلية والبنكية</span>
            </div>
            <h2 className="font-cairo font-black text-slate-900 text-3xl sm:text-4xl leading-tight text-balance">
              تجاوز تعقيدات بوابات الدفع الدولية بالحلول المحلية
            </h2>
            <p className="text-slate-600 text-[15px] font-ibm leading-relaxed">
              ندرك جيداً تحديات الدفع في فلسطين والأردن. لهذا، لا تحتاج إلى سجلات تجارية دولية أو ربط معقد لتستقبل أموالك؛ نوفر لك خيارات دفع مرنة ومألوفة تناسب عملائك وتجعل الشراء متاحاً للجميع وبكل أريحية.
            </p>
            <div className="flex gap-4">
              <div className="flex-1 bg-slate-50/60 border border-slate-100 p-5 rounded-xl text-right shadow-sm hover:bg-white hover:border-slate-200 transition-colors">
                <p className="text-sm font-bold text-slate-800">دون عمولات إضافية</p>
                <p className="text-[11px] text-slate-400 font-ibm mt-1">لا نقتطع أي نسب أو رسوم خفية من تعاملاتك المباشرة.</p>
              </div>
              <div className="flex-1 bg-slate-50/60 border border-slate-100 p-5 rounded-xl text-right shadow-sm hover:bg-white hover:border-slate-200 transition-colors">
                <p className="text-sm font-bold text-slate-800">تأكيد يدوي ذكي</p>
                <p className="text-[11px] text-slate-400 font-ibm mt-1">يرفع العميل صورة الوصل وتؤكد أنت صلاحية الطلب بضغطة زر.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THEMES ── */}
      <section id="themes" className="py-24 bg-slate-50/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-cairo font-black text-slate-900 text-3xl sm:text-4xl leading-tight text-balance">
              ثيمات جاهزة لكل نشاط تجاري
            </h2>
            <p className="text-slate-500 text-sm font-ibm max-w-lg mx-auto">
              ٨ قوالب احترافية مصممة لأنواع مختلفة من المتاجر — اختر ثيمك وخصّصه بكل حرية
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {themesData.map((theme) => (
              <div
                key={theme.key}
                className="bg-white border border-slate-100/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_20px_45px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col group text-right"
              >
                {/* Header */}
                <div
                  className="h-40 flex flex-col items-center justify-center relative overflow-hidden border-b border-slate-100/60"
                  style={{ background: `linear-gradient(145deg, ${theme.accent}10 0%, ${theme.accent}05 100%)` }}
                >
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(${theme.accent}50 1px, transparent 1px)`,
                      backgroundSize: "20px 20px",
                    }}
                  />
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 relative z-10 shadow-sm"
                    style={{ backgroundColor: `${theme.accent}18`, border: `1px solid ${theme.accent}25` }}
                  >
                    <theme.icon className="h-7 w-7" style={{ color: theme.accent }} />
                  </div>
                  <span
                    className="relative z-10 text-[10px] font-bold px-3 py-1 rounded-full"
                    style={{ color: theme.accent, backgroundColor: `${theme.accent}12`, border: `1px solid ${theme.accent}20` }}
                  >
                    {theme.category}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-cairo font-bold text-slate-900 text-base mb-1.5">{theme.title}</h3>
                  <p className="text-slate-500 text-xs font-ibm leading-relaxed flex-1">{theme.tagline}</p>

                  <div className="flex flex-col gap-2 pt-4 mt-auto">
                    <Link
                      href={`/dashboard/themes/preview/${theme.key}`}
                      className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl py-2.5 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <span>معاينة الثيم</span>
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center justify-center gap-2 text-xs font-bold text-white rounded-xl py-2.5 transition-all duration-200 hover:opacity-90"
                      style={{ backgroundColor: theme.accent }}
                    >
                      <span>جرّب هذا الثيم مجاناً</span>
                      <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-cairo font-black text-slate-900 text-3xl sm:text-4xl leading-tight text-balance">
              باقات اشتراك واضحة وتناسب الجميع
            </h2>
            <p className="text-slate-500 text-sm font-ibm">
              جميع الباقات تشمل تجربة مجانية لـ ٣ أيام كاملة دون الحاجة لبطاقات ائتمان
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {packages.map((pkg, idx) => (
              <div
                key={idx}
                className={cn(
                  "bg-white border p-8 rounded-3xl flex flex-col justify-between relative text-right transition-all duration-300",
                  pkg.popular
                    ? "border-blue-600 ring-2 ring-blue-600/10 shadow-[0_25px_50px_rgba(27,79,216,0.08)] scale-[1.02]"
                    : "border-slate-150 shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:border-slate-300 hover:shadow-sm"
                )}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 z-10 shrink-0">
                    <span className="bg-gradient-to-r from-[#1B4FD8] to-[#4F46E5] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                      <Star className="h-3.5 w-3.5 fill-current text-amber-300 animate-pulse" />
                      الباقة الأكثر اختياراً
                    </span>
                  </div>
                )}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-cairo font-black text-slate-900 text-xl">باقة {pkg.name}</h3>
                    <p className="text-slate-400 text-xs font-ibm leading-relaxed min-h-[40px]">{pkg.desc}</p>
                  </div>
                  <div className="flex items-baseline gap-1 py-4 border-y border-slate-100">
                    <span className="font-cairo font-black text-5xl text-slate-950 font-sans">{pkg.price}</span>
                    <span className="text-slate-500 text-xs font-bold">₪ / شهرياً</span>
                  </div>
                  <ul className="space-y-4">
                    {pkg.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-650">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="font-ibm leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-8 mt-auto">
                  <Link
                    href="/register"
                    className={cn(
                      "w-full py-3.5 px-6 rounded-xl font-cairo font-bold text-sm text-center block transition-all duration-300",
                      pkg.popular
                        ? "bg-[#1B4FD8] text-white hover:bg-[#153eb2] shadow-[0_6px_20px_rgba(27,79,216,0.3)] hover:scale-[1.01]"
                        : "border border-slate-200 text-slate-700 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300"
                    )}
                  >
                    {pkg.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-[#1B4FD8] to-[#4F46E5] rounded-[2rem] overflow-hidden py-16 px-8 sm:px-16 shadow-[0_20px_50px_rgba(27,79,216,0.2)] text-center">
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute -top-12 -left-12 w-64 h-64 bg-white rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-[#7C3AED] rounded-full blur-2xl" />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="font-cairo font-black text-white text-3xl sm:text-4xl leading-tight text-balance">
                ابدأ رحلة مبيعاتك اليوم مع سبأ ستور
              </h2>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed font-medium">
                أنشئ متجرك مجاناً بالكامل لمدة ٣ أيام، واستكشف جميع الأدوات والخصائص دون الحاجة لإدخال أي بطاقة بنكية.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className={cn(
                    "w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-xl font-cairo font-bold text-base bg-white text-[#1B4FD8]",
                    "hover:bg-blue-50 transition-all duration-300",
                    "shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.15)] hover:-translate-y-0.5"
                  )}
                >
                  <span>ابدأ تجربتك المجانية الآن</span>
                  <ArrowLeft className="h-5 w-5 rtl-flip" />
                </Link>
              </div>
              <p className="text-xs text-blue-200/80">
                · تجربة ٣ أيام كاملة · لا يتطلب بطاقة ائتمان · إلغاء فوري في أي وقت ·
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-slate-200/40 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B4FD8] to-[#7C3AED] flex items-center justify-center text-white font-cairo font-bold text-base shadow-md">
              س
            </div>
            <span className="font-cairo font-black text-lg text-slate-900">سبأ ستور</span>
          </Link>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-slate-500">
            <Link href="/privacy" className="hover:text-[#1B4FD8] transition-colors font-cairo">سياسة الخصوصية</Link>
            <Link href="/terms" className="hover:text-[#1B4FD8] transition-colors font-cairo">شروط الاستخدام</Link>
            <Link href="/contact" className="hover:text-[#1B4FD8] transition-colors font-cairo">اتصل بنا</Link>
          </div>
          <p className="text-xs text-slate-400 font-sans font-medium">
            © {new Date().getFullYear()} سبأ ستور (Saba Store). جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}
