"use client";

import { FormEvent, useState } from "react";
import { BadgeCheck, CheckCircle2, Loader2, Printer, Search, ShieldCheck, UserRound } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const OFFICIAL_HEADER_URL = "https://i.ibb.co/Wvn9YX6y/1235.png";

const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
  PRE_REGISTERED: { label: "مسجل قبليًا", badge: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  UNDER_REVIEW: { label: "قيد الدراسة", badge: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  WAITLISTED: { label: "لائحة الانتظار", badge: "bg-orange-50 text-orange-800 ring-orange-200", dot: "bg-orange-500" },
  ACCEPTED: { label: "مقبول", badge: "bg-blue-50 text-blue-800 ring-blue-200", dot: "bg-blue-500" },
  REJECTED: { label: "مرفوض", badge: "bg-red-50 text-red-800 ring-red-200", dot: "bg-red-500" },
  ENROLLED: { label: "مسجل نهائيًا", badge: "bg-indigo-50 text-indigo-800 ring-indigo-200", dot: "bg-indigo-500" },
  WITHDRAWN: { label: "منسحب", badge: "bg-slate-100 text-slate-700 ring-slate-300", dot: "bg-slate-500" },
  COMPLETED: { label: "أتم البرنامج", badge: "bg-violet-50 text-violet-800 ring-violet-200", dot: "bg-violet-500" }
};

type Receipt = {
  registrationNumber: string;
  registrationDate: string;
  masarNumber: string;
  fullName: string;
  age: number | null;
  gender: string | null;
  lastEducationLevel: string | null;
  careerChoice1: string | null;
  status: string;
  photoUrl: string | null;
};

async function readResponse(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { message: text || "حدث خطأ غير متوقع." }; }
}

export function PublicRegistrationReceipt() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(""); setReceipt(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/public-registration/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: form.get("registrationNumber"), masarNumber: form.get("masarNumber") })
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.message || "تعذر تحميل البطاقة.");
      setReceipt(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل البطاقة.");
    } finally { setLoading(false); }
  }

  const status = receipt ? (statusConfig[receipt.status] || { label: receipt.status, badge: "bg-slate-100 text-slate-800 ring-slate-300", dot: "bg-slate-500" }) : null;
  const verificationUrl = receipt && typeof window !== "undefined"
    ? `${window.location.origin}/verify/${encodeURIComponent(receipt.registrationNumber)}`
    : "";

  return (
    <div dir="rtl" className="space-y-6">
      <form onSubmit={lookup} className="receipt-controls overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-xl shadow-slate-200/50">
        <div className="border-b border-slate-100 bg-gradient-to-l from-blue-950 to-blue-800 px-6 py-5 text-white">
          <h2 className="text-xl font-black">استرجاع بطاقة التسجيل</h2>
          <p className="mt-1 text-sm text-blue-100">أدخل رقم التسجيل ورقم مسار لحماية بيانات المترشح.</p>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="رقم التسجيل"><input required name="registrationNumber" placeholder="SC-2026-XXXXXXXX" className="receipt-input" /></Field>
            <Field label="رقم مسار"><input required name="masarNumber" placeholder="G123456789" className="receipt-input" /></Field>
          </div>
          {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
          <button disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <Search size={19} />}
            {loading ? "جارٍ تحميل البطاقة..." : "عرض بطاقة التسجيل"}
          </button>
        </div>
      </form>

      {receipt && status && (
        <>
          <article id="registration-receipt" className="receipt-card relative mx-auto overflow-hidden rounded-[1.5rem] border-2 border-blue-900 bg-white shadow-2xl shadow-slate-300/60">
            <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at center, #0f3d8f 1px, transparent 1px)", backgroundSize: "18px 18px" }} />

            <div className="relative border-b border-slate-200 bg-white px-5 py-3">
              <img src={OFFICIAL_HEADER_URL} alt="شعارات الشركاء" width={2048} height={512} crossOrigin="anonymous" className="mx-auto block h-auto max-h-[165px] w-full object-contain" />
            </div>

            <div className="relative grid items-center gap-4 bg-gradient-to-l from-blue-950 via-blue-900 to-blue-800 px-6 py-4 text-white sm:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-bold text-emerald-300">برنامج الفرصة الثانية – الجيل الجديد</p>
                <h1 className="mt-1 text-2xl font-black">بطاقة التسجيل القبلي</h1>
                <p className="mt-1 text-xs text-blue-100">وصل إلكتروني رسمي لإثبات إيداع طلب التسجيل</p>
              </div>
              <div className="min-w-[230px] rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-center backdrop-blur-sm">
                <p className="text-[10px] font-bold text-blue-100">رقم التسجيل</p>
                <p className="mt-1 font-mono text-xl font-black tracking-wider">{receipt.registrationNumber}</p>
              </div>
            </div>

            <div className="relative grid gap-6 p-6 sm:grid-cols-[155px_1fr_135px]">
              <div className="flex flex-col items-center">
                <div className="grid h-48 w-36 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-md ring-1 ring-slate-300">
                  {receipt.photoUrl ? <img src={receipt.photoUrl} alt="صورة المترشح" className="h-full w-full object-cover" /> : <UserRound size={54} className="text-slate-400" />}
                </div>
                <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ring-1 ${status.badge}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} /> {status.label}
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-blue-700">المترشح(ة)</p>
                <h2 className="mt-1 truncate text-2xl font-black text-slate-950">{receipt.fullName}</h2>
                <dl className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Info label="رقم مسار" value={receipt.masarNumber} />
                  <Info label="تاريخ التسجيل" value={new Date(receipt.registrationDate).toLocaleDateString("ar-MA")} />
                  <Info label="العمر" value={receipt.age === null ? "غير محدد" : `${receipt.age} سنة`} />
                  <Info label="الجنس" value={receipt.gender || "غير محدد"} />
                  <Info label="آخر مستوى دراسي" value={receipt.lastEducationLevel || "غير محدد"} />
                  <Info label="الرغبة الأولى" value={receipt.careerChoice1 || "لم تحدد"} />
                </dl>
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-6 text-blue-950">
                  <ShieldCheck className="mt-0.5 shrink-0 text-blue-700" size={18} />
                  <p>هذه البطاقة تثبت إيداع طلب التسجيل القبلي فقط، ولا تعني القبول النهائي في البرنامج.</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                <QRCodeSVG value={verificationUrl} size={105} level="H" includeMargin />
                <p className="mt-1 text-[10px] font-black text-slate-600">التحقق من البطاقة</p>
                <p className="mt-1 text-[9px] leading-4 text-slate-400">امسح الرمز لعرض حالة التسجيل</p>
              </div>
            </div>

            <footer className="relative grid gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3 text-[10px] text-slate-500 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <span>منصة تدبير برنامج الفرصة الثانية</span>
              <span className="inline-flex items-center justify-center gap-1 font-black text-blue-900"><BadgeCheck size={15} /> وثيقة منشأة إلكترونيًا</span>
              <span className="text-left">تاريخ الإنشاء: {new Date().toLocaleDateString("ar-MA")}</span>
            </footer>
          </article>

          <div className="receipt-controls flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-7 py-3 font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-800"><Printer size={19} /> طباعة البطاقة أو حفظها PDF</button>
            <button onClick={() => setReceipt(null)} className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50">استرجاع بطاقة أخرى</button>
          </div>
        </>
      )}

      <style jsx global>{`
        .receipt-input { margin-top:.5rem; width:100%; border-radius:.75rem; border:1px solid #cbd5e1; padding:.8rem 1rem; outline:none; transition:.2s; }
        .receipt-input:focus { border-color:#2563eb; box-shadow:0 0 0 4px #dbeafe; }
        @media print {
          html, body { width:210mm !important; min-height:297mm !important; margin:0 !important; padding:0 !important; background:#fff !important; }
          body * { visibility:hidden !important; }
          #registration-receipt, #registration-receipt * { visibility:visible !important; }
          #registration-receipt {
            position:absolute !important;
            top:8mm !important;
            right:8mm !important;
            left:8mm !important;
            width:auto !important;
            max-width:none !important;
            margin:0 !important;
            border-radius:4mm !important;
            border:1.2pt solid #0f3d8f !important;
            box-shadow:none !important;
            overflow:hidden !important;
            break-inside:avoid !important;
            page-break-inside:avoid !important;
            transform:none !important;
            -webkit-print-color-adjust:exact !important;
            print-color-adjust:exact !important;
          }
          #registration-receipt img { max-height:42mm !important; object-fit:contain !important; }
          #registration-receipt svg { max-width:28mm !important; max-height:28mm !important; }
          .receipt-controls { display:none !important; }
          @page { size:A4 portrait; margin:0; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-sm font-bold text-slate-700">{label} *{children}</label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <dt className="text-[10px] font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-xs font-black text-slate-900">{value}</dd>
    </div>
  );
}
