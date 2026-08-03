import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BeneficiaryProfileForm } from "@/components/BeneficiaryProfileForm";
import { AdmissionAssessmentForm } from "@/components/AdmissionAssessmentForm";
import { prisma } from "@/lib/prisma";

const statusLabels: Record<string, string> = {
  PRE_REGISTERED: "مسجل أوليًا",
  UNDER_REVIEW: "قيد دراسة الملف",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "مقبول",
  REJECTED: "غير مقبول",
  ENROLLED: "متمدرس",
  WITHDRAWN: "منسحب",
  COMPLETED: "أنهى البرنامج"
};

export default async function BeneficiaryProfilePage({ params }: { params: { id: string } }) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id },
    include: { admissionAssessment: true }
  });

  if (!beneficiary) notFound();

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 text-sm text-slate-500">الملف الفردي للمستفيد</p>
          <h2 className="text-3xl font-bold">{beneficiary.firstName} {beneficiary.lastName}</h2>
          <p className="mt-2 text-slate-600">الوضعية الحالية: {statusLabels[beneficiary.status] || beneficiary.status}</p>
        </div>
        <Link href="/beneficiaries" className="rounded-xl border border-slate-300 px-5 py-3 text-center">
          العودة إلى اللائحة
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">رقم الملف</p>
          <p className="mt-2 break-all font-semibold">{beneficiary.id}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">تاريخ التسجيل</p>
          <p className="mt-2 font-semibold">{beneficiary.createdAt.toLocaleDateString("ar-MA")}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">آخر تحديث</p>
          <p className="mt-2 font-semibold">{beneficiary.updatedAt.toLocaleDateString("ar-MA")}</p>
        </article>
      </div>

      <div className="mb-10">
        <BeneficiaryProfileForm beneficiary={beneficiary} />
      </div>

      <div className="mb-5 border-t border-slate-200 pt-8">
        <p className="text-sm text-slate-500">المرحلة الثانية من الملف</p>
        <h2 className="mt-1 text-2xl font-bold">القبول والتشخيص والتوجيه</h2>
        <p className="mt-2 text-slate-600">توثيق المقابلة والاختبارات والميولات المهنية وقرار لجنة القبول.</p>
      </div>

      <AdmissionAssessmentForm beneficiaryId={beneficiary.id} assessment={beneficiary.admissionAssessment} />
    </AppShell>
  );
}
