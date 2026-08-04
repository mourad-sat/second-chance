import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenCheck, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AcademicSupportPlanManager } from "@/components/AcademicSupportPlanManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function fileNumber(id: string, createdAt: Date) {
  return `SC-${createdAt.getFullYear()}-CAS-${id.slice(-5).toUpperCase()}`;
}

export default async function BeneficiarySupportPlanPage({
  params
}: {
  params: { id: string };
}) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id },
    include: {
      enrollments: {
        where: { leftAt: null },
        include: { group: true },
        orderBy: { enrolledAt: "desc" },
        take: 1
      },
      academicSupportPlans: {
        orderBy: [{ status: "asc" }, { createdAt: "desc" }]
      }
    }
  });

  if (!beneficiary) notFound();

  const group = beneficiary.enrollments[0]?.group;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">المرحلة 3.3.3</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">خطة الدعم الفردية</h1>
          <p className="mt-2 text-slate-600">تخطيط التدخلات التربوية وتتبع تنفيذها وقياس نتائجها.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/beneficiaries/${beneficiary.id}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
            <UserRound size={17} /> الملف الموحد
          </Link>
          <Link href="/academic-tracking" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <ArrowRight size={17} /> مركز التتبع
          </Link>
        </div>
      </div>

      <section className="mb-6 rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 font-bold">
              {beneficiary.firstName.slice(0, 1)}{beneficiary.lastName.slice(0, 1)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{beneficiary.firstName} {beneficiary.lastName}</h2>
              <p className="mt-1 font-mono text-xs text-slate-300">{fileNumber(beneficiary.id, beneficiary.createdAt)}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><BookOpenCheck size={17} />{group?.name || "دون مجموعة"}</div>
            <p className="mt-1 text-xs text-slate-400">{group?.specialty || group?.track || "المسار غير محدد"}</p>
          </div>
        </div>
      </section>

      <AcademicSupportPlanManager beneficiaryId={beneficiary.id} plans={beneficiary.academicSupportPlans} />
    </AppShell>
  );
}
