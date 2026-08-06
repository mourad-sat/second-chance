import Link from "next/link";
import { ArrowRight, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-[#f2f5f4] p-5">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xl shadow-emerald-950/5 md:p-12">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-50 text-emerald-700"><FileQuestion size={36} /></span>
        <p className="mt-6 text-sm font-black text-emerald-700">خطأ 404</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">الصفحة غير موجودة</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">قد يكون الرابط قديمًا أو تم نقل الصفحة. يمكنك العودة إلى لوحة القيادة ومتابعة العمل بصورة طبيعية.</p>
        <Link href="/" className="btn-primary mt-7"><ArrowRight size={17} /> العودة إلى لوحة القيادة</Link>
      </section>
    </main>
  );
}
