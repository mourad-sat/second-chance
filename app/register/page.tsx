import Link from "next/link";
import { PublicRegistrationForm } from "@/components/PublicRegistrationForm";
import { Clock3, Printer, ShieldCheck } from "lucide-react";

const OFFICIAL_HEADER_URL = "https://i.ibb.co/BVzhsFV4/1.jpg";

export const metadata = {
  title: "التسجيل القبلي | برنامج الفرصة الثانية",
  description: "استمارة التسجيل القبلي الخارجية للاستفادة من برنامج الفرصة الثانية."
};

export const dynamic = "force-dynamic";

export default function PublicRegistrationPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/60 px-2 py-3 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
          <div className="bg-white px-2 py-2 sm:px-6 sm:py-4">
            <img
              src={OFFICIAL_HEADER_URL}
              alt="شعارات وزارة التربية الوطنية وجمعية نور الأمل وقطاع الشباب"
              width={1600}
              height={500}
              loading="eager"
              referrerPolicy="no-referrer"
              className="mx-auto block h-auto max-h-[310px] w-full object-contain"
            />
          </div>

          <div className="mx-3 mb-3 rounded-xl bg-gradient-to-l from-blue-950 via-blue-800 to-blue-950 px-5 py-3 text-center text-white shadow-md sm:mx-5 sm:mb-5">
            <h1 className="text-2xl font-black sm:text-3xl">استمارة التسجيل القبلي</h1>
          </div>

          <div className="border-t border-slate-100 bg-white px-4 pb-5 text-center sm:px-8">
            <p className="text-sm font-black text-emerald-700">برنامج الفرصة الثانية – الجيل الجديد</p>
            <p className="mx-auto mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              يرجى تعبئة جميع المعلومات بدقة. إيداع الطلب لا يعني القبول النهائي في البرنامج.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
                <ShieldCheck size={17} /> بياناتك محمية وتستخدم فقط لدراسة الطلب.
              </div>
              <Link href="/registration-receipt" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-900">
                <Printer size={17} /> طباعة بطاقة تسجيل سابقة
              </Link>
              <Link href="/application-status" className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-900 transition hover:bg-blue-50">
                <Clock3 size={17} /> تتبع حالة الطلب
              </Link>
            </div>
          </div>
        </header>

        <div className="mt-5">
          <PublicRegistrationForm />
        </div>

        <footer className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-xs leading-6 text-slate-500 shadow-sm">
          يرجى عدم إرسال طلبات متعددة للشخص نفسه. احتفظ برقم التسجيل الذي يظهر بعد إرسال الاستمارة.
        </footer>
      </div>
    </main>
  );
}
