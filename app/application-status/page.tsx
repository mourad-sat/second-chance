import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { PublicApplicationStatus } from "@/components/PublicApplicationStatus";

export const metadata = {
  title: "تتبع حالة الطلب | برنامج الفرصة الثانية",
  description: "الاستعلام عن حالة طلب التسجيل القبلي في برنامج الفرصة الثانية."
};

export const dynamic = "force-dynamic";

export default function ApplicationStatusPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-7 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg">
          <img src="https://i.ibb.co/BVzhsFV4/1.jpg" alt="شعارات الشركاء وجمعية نور الأمل" width={886} height={232} className="block h-auto w-full object-contain" />
          <div className="bg-slate-950 p-6 text-white sm:p-9">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-blue-700 p-4"><Clock3 size={30} /></div>
              <div>
                <p className="text-sm font-semibold text-emerald-300">برنامج الفرصة الثانية – الجيل الجديد</p>
                <h1 className="mt-2 text-3xl font-black">تتبع حالة طلب التسجيل</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">تحقق من المرحلة التي وصل إليها طلبكم باستعمال رقم التسجيل ورقم مسار.</p>
              </div>
            </div>
          </div>
        </header>

        <PublicApplicationStatus />

        <div className="mt-6 text-center">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><ArrowRight size={18} /> العودة إلى استمارة التسجيل</Link>
        </div>
      </div>
    </main>
  );
}
