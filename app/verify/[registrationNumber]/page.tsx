import Link from "next/link";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const OFFICIAL_HEADER_URL = "https://i.ibb.co/BVzhsFV4/1.jpg";

const statusLabels: Record<string, string> = {
  PRE_REGISTERED: "مسجل قبليًا",
  UNDER_REVIEW: "قيد الدراسة",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  ENROLLED: "مسجل نهائيًا",
  WITHDRAWN: "منسحب",
  COMPLETED: "أتم البرنامج"
};

export default async function VerifyRegistrationPage({ params }: { params: { registrationNumber: string } }) {
  const registrationNumber = decodeURIComponent(params.registrationNumber).trim().toUpperCase();
  const beneficiary = await prisma.beneficiary.findFirst({
    where: { registrationNumber },
    select: {
      registrationNumber: true,
      registrationDate: true,
      firstName: true,
      lastName: true,
      status: true
    }
  });

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="h-3 bg-gradient-to-l from-emerald-600 via-blue-700 to-blue-950" />
        <div className="border-b border-slate-200 px-5 py-5 sm:px-8">
          <img src={OFFICIAL_HEADER_URL} alt="شعارات الشركاء" width={886} height={232} className="mx-auto h-auto w-full max-w-[886px] object-contain" />
        </div>

        {beneficiary ? (
          <section className="px-6 py-9 text-center sm:px-10">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={44} /></div>
            <p className="mt-5 text-sm font-black text-emerald-700">تم التحقق بنجاح</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">البطاقة صحيحة ومسجلة في المنصة</h1>
            <div className="mx-auto mt-7 max-w-xl rounded-3xl border border-slate-200 bg-slate-50 p-6 text-right">
              <Info label="الاسم الكامل" value={`${beneficiary.firstName} ${beneficiary.lastName}`} />
              <Info label="رقم التسجيل" value={beneficiary.registrationNumber || registrationNumber} />
              <Info label="تاريخ التسجيل" value={beneficiary.registrationDate.toLocaleDateString("ar-MA")} />
              <Info label="حالة الملف" value={statusLabels[beneficiary.status] || beneficiary.status} />
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-right text-sm leading-7 text-blue-950"><ShieldCheck className="mt-1 shrink-0 text-blue-700" size={20} /><p>تعرض صفحة التحقق بيانات محدودة فقط لحماية خصوصية المترشح. لا تعني صحة البطاقة القبول النهائي إلا إذا كانت الحالة المعروضة تشير إلى القبول.</p></div>
          </section>
        ) : (
          <section className="px-6 py-12 text-center sm:px-10">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-red-100 text-red-700"><XCircle size={44} /></div>
            <h1 className="mt-5 text-3xl font-black text-slate-950">تعذر التحقق من البطاقة</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">رقم التسجيل غير موجود في منصة تدبير برنامج الفرصة الثانية.</p>
          </section>
        )}

        <footer className="border-t border-slate-200 bg-slate-50 px-6 py-5 text-center"><Link href="/registration-receipt" className="font-bold text-blue-700 hover:text-blue-900">استرجاع بطاقة التسجيل</Link></footer>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-1 border-b border-slate-200 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs font-bold text-slate-500">{label}</span><span className="font-black text-slate-950">{value}</span></div>;
}
