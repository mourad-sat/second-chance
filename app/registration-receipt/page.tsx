import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { PublicRegistrationReceipt } from "@/components/PublicRegistrationReceipt";

export const metadata = {
  title: "بطاقة التسجيل القبلي | برنامج الفرصة الثانية",
  description: "استرجاع وطباعة بطاقة التسجيل القبلي للمترشح."
};

export const dynamic = "force-dynamic";

export default function RegistrationReceiptPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-7 rounded-3xl bg-slate-950 p-6 text-white sm:p-9">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-600 p-4"><GraduationCap size={30} /></div>
            <div>
              <p className="text-sm font-semibold text-emerald-300">جمعية نور الأمل</p>
              <h1 className="mt-2 text-3xl font-black">بطاقة التسجيل القبلي</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">استرجع وصل التسجيل، ثم اطبعه أو احفظه بصيغة PDF لتقديمه عند استكمال إجراءات البرنامج.</p>
            </div>
          </div>
        </header>

        <PublicRegistrationReceipt />

        <div className="receipt-controls mt-6 text-center">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowRight size={18} /> العودة إلى استمارة التسجيل</Link>
        </div>
      </div>
    </main>
  );
}
