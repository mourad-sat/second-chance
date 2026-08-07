import Link from "next/link";
import { PublicRegistrationForm } from "@/components/PublicRegistrationForm";
import { CalendarDays, Clock3, Printer, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "التسجيل القبلي | برنامج الفرصة الثانية",
  description: "استمارة التسجيل القبلي الخارجية للاستفادة من برنامج الفرصة الثانية."
};

export const dynamic = "force-dynamic";

// Registration portal visual refresh: production rebuild marker.
export default function PublicRegistrationPage() {
  return (
    <main dir="rtl" className="public-registration-page min-h-screen px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="public-registration-brand mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-emerald-100 bg-white shadow-lg shadow-emerald-900/10 sm:h-20 sm:w-20">
              <img src="/branding/nour-al-amal-mark.svg" alt="شعار جمعية نور الأمل" className="h-12 w-12 object-contain sm:h-14 sm:w-14" />
            </span>
            <div>
              <h1 className="text-xl font-black text-emerald-900 sm:text-2xl">مدرسة الفرصة الثانية</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">منصة تسجيل المترشحين الجدد — استمارة التسجيل القبلي</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-800 shadow-sm">
              <CalendarDays size={15} /> الموسم الدراسي 2026 / 2027
            </span>
            <Link href="/registration-receipt" className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-sm hover:bg-emerald-50">
              <Printer size={15} /> طباعة الوصل
            </Link>
            <Link href="/application-status" className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-sm hover:bg-emerald-50">
              <Clock3 size={15} /> تتبع الطلب
            </Link>
          </div>
        </header>

        <div className="public-registration-shell">
          <PublicRegistrationForm />
        </div>

        <footer className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-center text-xs font-semibold leading-6 text-emerald-800">
          <ShieldCheck size={17} className="shrink-0" />
          جميع معلوماتك آمنة وسرية ولن يتم استخدامها إلا لأغراض التسجيل والدراسة.
        </footer>
      </div>
    </main>
  );
}
