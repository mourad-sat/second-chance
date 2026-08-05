import Link from "next/link";
import { PublicRegistrationForm } from "@/components/PublicRegistrationForm";
import { CheckCircle2, Clock3, FileCheck2, Printer, ShieldCheck, Sparkles } from "lucide-react";

const OFFICIAL_HEADER_URL = "https://i.ibb.co/Wvn9YX6y/1235.png";

const steps = [
  "المعلومات الشخصية",
  "معلومات الاتصال",
  "المسار الدراسي",
  "الرغبات والتوجهات",
  "المراجعة والإرسال"
];

export const metadata = {
  title: "التسجيل القبلي | برنامج الفرصة الثانية",
  description: "استمارة التسجيل القبلي الخارجية للاستفادة من برنامج الفرصة الثانية."
};

export const dynamic = "force-dynamic";

export default function PublicRegistrationPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_42%,_#eef2ff)] px-2 py-3 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-[0_24px_70px_-32px_rgba(30,64,175,0.38)]">
          <div className="bg-white px-2 py-2 sm:px-8 sm:py-5">
            <img
              src={OFFICIAL_HEADER_URL}
              alt="شعارات وزارة التربية الوطنية وجمعية نور الأمل وقطاع الشباب"
              width={2048}
              height={512}
              loading="eager"
              referrerPolicy="no-referrer"
              className="mx-auto block h-auto max-h-[330px] w-full object-contain"
            />
          </div>

          <div className="mx-3 overflow-hidden rounded-2xl bg-gradient-to-l from-blue-950 via-blue-800 to-blue-950 text-white shadow-xl sm:mx-6">
            <div className="flex flex-col items-center justify-between gap-3 px-5 py-4 text-center sm:flex-row sm:px-8">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <FileCheck2 size={24} />
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-black sm:text-3xl">استمارة التسجيل القبلي</h1>
                  <p className="mt-1 text-xs font-semibold text-blue-100">برنامج الفرصة الثانية – الجيل الجديد</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-blue-50">
                التسجيل الإلكتروني الرسمي
              </div>
            </div>
          </div>

          <div className="bg-white px-4 py-5 sm:px-8 sm:py-7">
            <p className="mx-auto max-w-3xl text-center text-sm leading-7 text-slate-600">
              يرجى تعبئة جميع المعلومات بدقة. إيداع الطلب يثبت التسجيل القبلي فقط ولا يعني القبول النهائي في البرنامج.
            </p>

            <div className="mt-6 overflow-x-auto pb-2">
              <div className="mx-auto flex min-w-[780px] max-w-5xl items-center justify-between">
                {steps.map((label, index) => (
                  <div key={label} className="relative flex flex-1 items-center last:flex-none">
                    <div className="flex min-w-[130px] flex-col items-center text-center">
                      <span className={`grid h-11 w-11 place-items-center rounded-full text-sm font-black shadow-sm ${index === 0 ? "bg-blue-800 text-white ring-4 ring-blue-100" : "border border-slate-200 bg-white text-slate-500"}`}>
                        {index + 1}
                      </span>
                      <span className={`mt-2 text-xs font-black ${index === 0 ? "text-blue-900" : "text-slate-500"}`}>{label}</span>
                    </div>
                    {index < steps.length - 1 && <div className="mx-2 h-0.5 flex-1 bg-slate-200" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[1.3fr_1fr]">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 shrink-0 text-blue-700" size={22} />
                  <div>
                    <h2 className="text-sm font-black text-blue-950">قبل البدء</h2>
                    <div className="mt-3 grid gap-2 text-xs font-semibold leading-6 text-slate-700 sm:grid-cols-2">
                      <p className="flex items-start gap-2"><CheckCircle2 className="mt-1 shrink-0 text-emerald-600" size={15} /> جهّز رقم مسار وصورة شخصية واضحة.</p>
                      <p className="flex items-start gap-2"><CheckCircle2 className="mt-1 shrink-0 text-emerald-600" size={15} /> العمر المقبول من 14 إلى 20 سنة.</p>
                      <p className="flex items-start gap-2"><CheckCircle2 className="mt-1 shrink-0 text-emerald-600" size={15} /> الحقول التي تحمل علامة * إلزامية.</p>
                      <p className="flex items-start gap-2"><CheckCircle2 className="mt-1 shrink-0 text-emerald-600" size={15} /> راجع المعلومات قبل الإرسال النهائي.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
                  <ShieldCheck size={17} /> بيانات محمية
                </div>
                <Link href="/registration-receipt" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-800 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-blue-900">
                  <Printer size={17} /> طباعة البطاقة
                </Link>
                <Link href="/application-status" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-900 transition hover:-translate-y-0.5 hover:bg-blue-50">
                  <Clock3 size={17} /> تتبع الطلب
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6">
          <PublicRegistrationForm />
        </div>

        <footer className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-xs leading-6 text-slate-500 shadow-sm">
          يرجى عدم إرسال طلبات متعددة للشخص نفسه. احتفظ برقم التسجيل الذي يظهر بعد إرسال الاستمارة.
        </footer>
      </div>
    </main>
  );
}
