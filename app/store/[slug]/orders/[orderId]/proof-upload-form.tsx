"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Camera, UploadCloud, CheckCircle2 } from "lucide-react";
import { submitPaymentProof } from "@/actions/checkout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProofUploadFormProps {
  orderId: string;
  storeSlug: string;
}

export function ProofUploadForm({ orderId, storeSlug }: ProofUploadFormProps) {
  const router = useRouter();
  const [payerName, setPayerName] = useState("");
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)");
        return;
      }
      setFile(selectedFile);
    }
  };

  const toBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!payerName.trim()) {
      toast.error("يرجى إدخال اسم المحوّل");
      return;
    }

    if (!file) {
      toast.error("يرجى اختيار ملف الوصل / الإثبات");
      return;
    }

    setIsSubmitting(true);
    try {
      const fileBase64 = await toBase64(file);
      const res = await submitPaymentProof(
        orderId,
        payerName,
        reference || null,
        fileBase64,
        file.name,
        file.type
      );

      if (res.success) {
        toast.success("تم إرسال إثبات الدفع بنجاح! 🎉");
        router.refresh();
      } else {
        toast.error(res.error || "فشل إرسال إثبات الدفع");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء رفع الملف");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-2xl space-y-4 text-right">
      <h3 className="font-bold text-foreground text-sm border-b border-border pb-2">إرفاق إثبات التحويل المالي</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        يرجى ملء تفاصيل المحول ورفع لقطة شاشة للتحويل البنكي أو المحفظة لتسجيل وتأكيد الدفعة تلقائياً.
      </p>

      {/* Payer Name */}
      <div className="form-group space-y-1">
        <label className="text-xs text-muted-foreground font-semibold">اسم المرسل / المحوّل كاملاً <span className="text-destructive">*</span></label>
        <input
          type="text"
          placeholder="مثال: أحمد خليل"
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-input border border-border hover:border-primary/30 text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/50 text-xs"
          required
        />
      </div>

      {/* Transaction reference */}
      <div className="form-group space-y-1">
        <label className="text-xs text-muted-foreground font-semibold">رقم العملية أو المرجع <span className="text-muted-foreground/60">(اختياري)</span></label>
        <input
          type="text"
          placeholder="مثال: Ref-897210"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-input border border-border hover:border-primary/30 text-foreground text-left focus:outline-none focus:ring-1 focus:ring-primary/50 text-xs"
        />
      </div>

      {/* File Upload Selector */}
      <div className="form-group space-y-2">
        <label className="text-xs text-muted-foreground font-semibold">صورة الوصل أو ملف PDF الإثبات <span className="text-destructive">*</span></label>
        <div className="relative border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-6 text-center cursor-pointer transition-all bg-muted/20">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="space-y-2 flex flex-col items-center">
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            {file ? (
              <p className="text-xs font-bold text-primary font-sans">{file.name}</p>
            ) : (
              <>
                <p className="text-xs text-foreground">اسحب الملف أو اضغط لاختياره</p>
                <p className="text-[10px] text-muted-foreground">يسمح بالصور (PNG, JPG, WEBP) وملفات PDF بحد أقصى 5 ميجابايت</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/95 transition-all shadow-[0_4px_15px_rgba(27,79,216,0.25)] flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جارٍ إرسال الملف...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            تأكيد وإرسال الإثبات
          </>
        )}
      </button>
    </form>
  );
}
