import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6" dir="rtl">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600">
          <ShieldX size={30} />
        </div>
        <p className="mt-5 text-sm font-semibold text-red-600">الوصول غير مسموح</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">ليست لديك صلاحية لفتح هذه الوحدة</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">تم تحديد الوحدات المتاحة وفق الدور المسند إلى حسابك. تواصل مع مدير المنصة إذا كانت مسؤولياتك تتطلب صلاحية إضافية.</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">العودة إلى لوحة القيادة</Link>
      </section>
    </main>
  );
}
