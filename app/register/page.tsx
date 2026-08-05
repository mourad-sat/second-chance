import Link from "next/link";
import { PublicRegistrationForm } from "@/components/PublicRegistrationForm";
import { Printer, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "التسجيل القبلي | برنامج الفرصة الثانية",
  description: "استمارة التسجيل القبلي الخارجية للاستفادة من برنامج الفرصة الثانية."
};

export const dynamic = "force-dynamic";

export default function PublicRegistrationPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-3 py-5 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-200/60">
          <div className="border-t-[7px] border-blue-800 px-3 pt-3 sm:px-6 sm:pt-5">
            <img
              src="/branding/registration-header-clean.jpg"
              alt="شعارات وزارة التربية الوطنية وجمعية نور الأمل وقطاع الشباب"
              width={886}
              height={232}
              className="mx-auto block h-auto w-full max-w-[886px] object-contain"
            />
          </div>
          <div className="border-t border-slate-100 bg-gradient-to-b from-white to-blue-50/60 px-5 py-6 text-center sm:px-8 sm:py-8">
            <p className="text-sm font-black text-emerald-700">برنامج الفرصة الثانية – الجيل الجديد</p>
            <h1 className="mt-2 text-3xl font-black text-blue-950 sm:text-4xl">استمارة التسجيل القبلي</h1>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              يرجى تعبئة المعلومات بدقة. إرسال الاستمارة يثبت إيداع طلب التسجيل القبلي، ولا يعني القبول النهائي في البرنامج.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
                <ShieldCheck size={17} /> تُستعمل بياناتك فقط لدراسة الطلب والتواصل معك.
              </div>
              <Link href="/registration-receipt" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-900">
                <Printer size={17} /> طباعة بطاقة تسجيل سابقة
              </Link>
            </div>
          </div>
        </header>

        <PublicRegistrationForm />

        <footer className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-xs leading-6 text-slate-500">
          يرجى عدم إرسال طلبات متعددة للشخص نفسه. احتفظ برقم التسجيل الذي يظهر بعد إرسال الاستمارة.
        </footer>
      </div>
    </main>
  );
}
