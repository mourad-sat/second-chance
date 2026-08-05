"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Printer, Search, ShieldCheck, UserRound } from "lucide-react";

const OFFICIAL_HEADER_URL = "https://i.ibb.co/BVzhsFV4/1.jpg";

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
    setLoading(true);
    setError("");
    setReceipt(null);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/public-registration/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationNumber: form.get("registrationNumber"),
          masarNumber: form.get("masarNumber")
        })
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.message || "تعذر تحميل البطاقة.");
      setReceipt(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل البطاقة.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="space-y-6">
      <form onSubmit={lookup} className="receipt-controls rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">استرجاع بطاقة التسجيل</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">أدخل رقم التسجيل ورقم مسار كما تم تسجيلهما لحماية بيانات المترشح.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">رقم التسجيل *<input required name="registrationNumber" placeholder="SC-2026-XXXXXXXX" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" /></label>
          <label className="text-sm font-bold text-slate-700">رقم مسار *<input required name="masarNumber" placeholder="G123456789" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" /></label>
        </div>
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
        <button disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" /> : <Search size={19} />}
          {loading ? "جارٍ تحميل البطاقة..." : "عرض بطاقة التسجيل"}
        </button>
      </form>

      {receipt && (
        <>
          <article id="registration-receipt" className="mx-auto overflow-hidden rounded-[2rem] border border-blue-200 bg-white shadow-2xl shadow-slate-300/50">
            <div className="h-3 bg-gradient-to-l from-emerald-600 via-blue-700 to-blue-950" />

            <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-7">
              <img
                src={OFFICIAL_HEADER_URL}
                alt="شعارات وزارة التربية الوطنية وجمعية نور الأمل وقطاع الشباب"
                width={886}
                height={232}
                crossOrigin="anonymous"
                className="mx-auto block h-auto w-full max-w-[886px] object-contain"
              />
            </div>

            <header className="flex flex-col gap-5 bg-slate-950 px-7 py-6 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-300">جمعية نور الأمل</p>
                <h1 className="mt-1 text-2xl font-black">بطاقة التسجيل القبلي</h1>
                <p className="mt-1 text-sm text-slate-300">برنامج الفرصة الثانية – الجيل الجديد</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-center">
                <p className="text-[11px] text-slate-300">رقم التسجيل</p>
                <p className="mt-1 font-mono text-lg font-black tracking-wider">{receipt.registrationNumber}</p>
              </div>
            </header>

            <div className="grid gap-7 p-7 sm:grid-cols-[180px_1fr] sm:p-9">
              <div className="flex flex-col items-center">
                <div className="grid h-52 w-40 place-items-center overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-lg ring-1 ring-slate-200">
                  {receipt.photoUrl ? <img src={receipt.photoUrl} alt="صورة المترشح" className="h-full w-full object-cover" /> : <UserRound size={58} className="text-slate-400" />}
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-800">
                  <CheckCircle2 size={15} /> مسجل قبليًا
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950">{receipt.fullName}</h2>
                <p className="mt-1 text-sm text-slate-500">وصل إلكتروني يثبت إيداع طلب التسجيل القبلي، ولا يمثل قبولًا نهائيًا.</p>

                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Info label="رقم مسار" value={receipt.masarNumber} />
                  <Info label="تاريخ التسجيل" value={new Date(receipt.registrationDate).toLocaleDateString("ar-MA")} />
                  <Info label="العمر" value={receipt.age === null ? "غير محدد" : `${receipt.age} سنة`} />
                  <Info label="الجنس" value={receipt.gender || "غير محدد"} />
                  <Info label="آخر مستوى دراسي" value={receipt.lastEducationLevel || "غير محدد"} />
                  <Info label="الرغبة الأولى" value={receipt.careerChoice1 || "لم تحدد"} />
                </dl>

                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm leading-7 text-blue-950">
                  <ShieldCheck className="mt-1 shrink-0 text-blue-700" size={20} />
                  <p>يجب الاحتفاظ بهذه البطاقة وتقديمها عند التواصل مع إدارة البرنامج. ستتم مراجعة الطلب والاتصال بالمترشح لاستكمال إجراءات القبول والتوجيه.</p>
                </div>
              </div>
            </div>

            <footer className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-7 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>منصة تدبير برنامج الفرصة الثانية</span>
              <span>تم إنشاء البطاقة إلكترونيًا بتاريخ {new Date().toLocaleDateString("ar-MA")}</span>
            </footer>
          </article>

          <div className="receipt-controls flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 font-black text-white hover:bg-emerald-800"><Printer size={19} /> طباعة البطاقة أو حفظها PDF</button>
            <button onClick={() => setReceipt(null)} className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50">استرجاع بطاقة أخرى</button>
          </div>
        </>
      )}

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          body * { visibility: hidden !important; }
          #registration-receipt, #registration-receipt * { visibility: visible !important; }
          #registration-receipt {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #registration-receipt img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-[11px] font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-black text-slate-900">{value}</dd>
    </div>
  );
}
