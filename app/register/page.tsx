import Link from "next/link";
import { PublicRegistrationForm } from "@/components/PublicRegistrationForm";
import { GraduationCap, Printer, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "التسجيل القبلي | برنامج الفرصة الثانية",
  description: "استمارة التسجيل القبلي الخارجية للاستفادة من برنامج الفرصة الثانية."
};

export const dynamic = "force-dynamic";

export default function PublicRegistrationPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-7 rounded-3xl bg-slate-950 p-6 text-white sm:p-9">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-blue-600 p-4"><GraduationCap size={30} /></div>
            <div>
              <p className="text-sm font-semibold text-blue-300">برنامج الفرصة الثانية</p>
              <h1 className="mt-2 text-3xl font-bold">استمارة التسجيل القبلي</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">املأ المعلومات بدقة. إرسال الاستمارة لا يعني القبول النهائي؛ ستراجع إدارة البرنامج الطلب وتتواصل معك لاستكمال المراحل.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-xs text-slate-300"><ShieldCheck size={17} className="text-emerald-400" /> تُستعمل بياناتك فقط لدراسة طلب التسجيل والتواصل معك.</div>
            <Link href="/registration-receipt" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"><Printer size={17} /> طباعة بطاقة تسجيل سابقة</Link>
          </div>
        </header>

        <PublicRegistrationForm />

        <footer className="mt-6 text-center text-xs leading-6 text-slate-500">يرجى عدم إرسال طلبات متعددة للشخص نفسه. احتفظ برقم الطلب الذي يظهر بعد الإرسال.</footer>
      </div>
    </main>
  );
}
