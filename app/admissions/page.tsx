import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";

const decisionLabels: Record<string, string> = {
  PENDING: "في انتظار القرار",
  ACCEPTED: "مقبول",
  WAITLISTED: "لائحة الانتظار",
  REJECTED: "غير مقبول",
  NEEDS_REASSESSMENT: "إعادة تقييم"
};

const decisionStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  WAITLISTED: "bg-blue-50 text-blue-700",
  REJECTED: "bg-rose-50 text-rose-700",
  NEEDS_REASSESSMENT: "bg-violet-50 text-violet-700"
};

export const dynamic = "force-dynamic";

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

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">المرحلة الثالثة</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">التشخيص والقبول</h1>
          <p className="mt-2 text-slate-600">تتبع المقابلات والاختبارات والتوجيه وقرارات لجنة القبول.</p>
        </div>
        <Link href="/beneficiaries/new" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          تسجيل مستفيد جديد
        </Link>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["ينتظرون التشخيص", pendingDiagnosis, "text-amber-700", "bg-amber-50"],
          ["ينتظرون القرار", pendingDecision, "text-blue-700", "bg-blue-50"],
          ["مقبولون", accepted, "text-emerald-700", "bg-emerald-50"],
          ["إعادة تقييم", reassessment, "text-violet-700", "bg-violet-50"]
        ].map(([label, value, textClass, bgClass]) => (
          <article key={String(label)} className={`rounded-2xl border border-slate-200 p-5 shadow-sm ${bgClass}`}>
            <p className="text-sm text-slate-600">{label}</p>
            <p className={`mt-3 text-3xl font-bold ${textClass}`}>{value}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-bold">لائحة التشخيص والقبول</h2>
          <p className="mt-1 text-sm text-slate-500">ابدأ التشخيص أو افتح ملف المستفيد لاستكمال القرار.</p>
        </div>

        {beneficiaries.length === 0 ? (
          <div className="p-10 text-center text-slate-500">لا توجد ملفات في مسار التشخيص والقبول.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4">المستفيد</th>
                  <th className="px-5 py-4">تاريخ التسجيل</th>
                  <th className="px-5 py-4">المقابلة</th>
                  <th className="px-5 py-4">المسار المقترح</th>
                  <th className="px-5 py-4">قرار اللجنة</th>
                  <th className="px-5 py-4">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beneficiaries.map((beneficiary) => {
                  const assessment = beneficiary.admissionAssessment;
                  const decision = assessment?.decision || "PENDING";
                  return (
                    <tr key={beneficiary.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold">{beneficiary.firstName} {beneficiary.lastName}</td>
                      <td className="px-5 py-4">{beneficiary.createdAt.toLocaleDateString("ar-MA")}</td>
                      <td className="px-5 py-4">{assessment?.interviewDate ? assessment.interviewDate.toLocaleDateString("ar-MA") : "غير منجزة"}</td>
                      <td className="px-5 py-4">{assessment?.proposedSpecialty || assessment?.proposedTrack || "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${decisionStyles[decision]}`}>
                          {assessment ? decisionLabels[decision] : "لم يبدأ التشخيص"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/beneficiaries/${beneficiary.id}#diagnosis`} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold hover:bg-slate-100">
                          {assessment ? "فتح التشخيص" : "بدء التشخيص"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
