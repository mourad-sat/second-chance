import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AdmissionsTable } from "@/components/AdmissionsTable";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function fileNumber(id: string, createdAt: Date) {
  return `SC-${createdAt.getFullYear()}-CAS-${id.slice(-5).toUpperCase()}`;
}

export default async function AdmissionsPage() {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: {
      status: { in: ["PRE_REGISTERED", "UNDER_REVIEW", "WAITLISTED", "ACCEPTED", "REJECTED"] }
    },
    include: { admissionAssessment: true },
    orderBy: { createdAt: "desc" }
  });

  const pendingDiagnosis = beneficiaries.filter((item) => !item.admissionAssessment).length;
  const pendingDecision = beneficiaries.filter((item) => item.admissionAssessment?.decision === "PENDING").length;
  const accepted = beneficiaries.filter((item) => item.admissionAssessment?.decision === "ACCEPTED").length;
  const reassessment = beneficiaries.filter((item) => item.admissionAssessment?.decision === "NEEDS_REASSESSMENT").length;

  const items = beneficiaries.map((beneficiary) => ({
    id: beneficiary.id,
    fullName: `${beneficiary.firstName} ${beneficiary.lastName}`,
    fileNumber: fileNumber(beneficiary.id, beneficiary.createdAt),
    identityNumber: beneficiary.identityNumber || "",
    phone: beneficiary.phone || "",
    registrationDate: beneficiary.createdAt.toLocaleDateString("ar-MA"),
    interviewDate: beneficiary.admissionAssessment?.interviewDate
      ? beneficiary.admissionAssessment.interviewDate.toLocaleDateString("ar-MA")
      : "",
    proposedTrack: beneficiary.admissionAssessment?.proposedTrack || "",
    proposedSpecialty: beneficiary.admissionAssessment?.proposedSpecialty || "",
    decision: beneficiary.admissionAssessment?.decision || "PENDING",
    hasAssessment: Boolean(beneficiary.admissionAssessment)
  }));

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">المرحلة 3.1</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">التشخيص والقبول</h1>
          <p className="mt-2 text-slate-600">تدبير قائمة الانتظار، المقابلات، التوجيه وقرارات لجنة القبول.</p>
        </div>
        <Link href="/beneficiaries/new" className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800">
          تسجيل مستفيد جديد
        </Link>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["ينتظرون التشخيص", pendingDiagnosis, "text-amber-700", "bg-amber-50"],
          ["ينتظرون القرار", pendingDecision, "text-blue-700", "bg-blue-50"],
          ["المقبولون", accepted, "text-emerald-700", "bg-emerald-50"],
          ["إعادة التقييم", reassessment, "text-violet-700", "bg-violet-50"]
        ].map(([label, value, textClass, bgClass]) => (
          <article key={String(label)} className={`rounded-2xl border border-slate-200 p-5 shadow-sm ${bgClass}`}>
            <p className="text-sm text-slate-600">{label}</p>
            <p className={`mt-3 text-3xl font-bold ${textClass}`}>{value}</p>
          </article>
        ))}
      </section>

      <AdmissionsTable items={items} />
    </AppShell>
  );
}
