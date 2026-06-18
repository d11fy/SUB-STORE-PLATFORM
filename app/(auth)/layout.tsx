import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "سجّل دخولك إلى سبأ ستور",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-mesh-gradient flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white font-cairo font-bold text-sm shadow-brand">
            س
          </div>
          <span className="font-cairo font-bold text-lg text-foreground group-hover:text-primary transition-colors">
            سبأ ستور
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            الأسعار
          </Link>
          <Link href="/features" className="hover:text-foreground transition-colors">
            المميزات
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground">
        <p>
          جميع الحقوق محفوظة © {new Date().getFullYear()} سبأ ستور
        </p>
      </footer>
    </div>
  );
}
