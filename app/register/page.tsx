import Link from "next/link";
import { PublicRegistrationPhotoGuard } from "@/components/PublicRegistrationPhotoGuard";
import { RegistrationBrandLogo } from "@/components/RegistrationBrandLogo";
import { CalendarDays, Clock3, Printer, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "التسجيل القبلي | برنامج الفرصة الثانية",
  description: "استمارة التسجيل القبلي الخارجية للاستفادة من برنامج الفرصة الثانية."
};

export const dynamic = "force-dynamic";

export default function PublicRegistrationPage() {
  return (
    <main dir="rtl" className="public-registration-page min-h-screen px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="public-registration-brand mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center">
            <RegistrationBrandLogo />
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
          <PublicRegistrationPhotoGuard />
        </div>

        <footer className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-center text-xs font-semibold leading-6 text-emerald-800">
          <ShieldCheck size={17} className="shrink-0" />
          جميع معلوماتك آمنة وسرية ولن يتم استخدامها إلا لأغراض التسجيل والدراسة.
        </footer>
      </div>
    </main>
  );
}
