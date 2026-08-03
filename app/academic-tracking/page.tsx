import { AppShell } from "@/components/AppShell";
import { AcademicTrackingManager } from "@/components/AcademicTrackingManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AcademicTrackingPage() {
  const [groups, assessments, results] = await Promise.all([
    prisma.learningGroup.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.academicAssessment.findMany({
      include: {
        group: { include: { enrollments: { where: { leftAt: null }, include: { beneficiary: true } } } },
        results: true
      },
      orderBy: { assessmentDate: "desc" }
    }),
    prisma.academicResult.findMany({ where: { score: { not: null } }, include: { assessment: true, beneficiary: true } })
  ]);

  const normalizedAssessments = assessments.map((a) => ({
    ...a,
    beneficiaries: a.group.enrollments.map((e) => e.beneficiary)
  }));

  const averages = new Map<string, { name: string; sum: number; count: number }>();
  for (const result of results) {
    if (result.score == null) continue;
    const percentage = (result.score / result.assessment.maxScore) * 100;
    const current = averages.get(result.beneficiaryId) || { name: `${result.beneficiary.firstName} ${result.beneficiary.lastName}`, sum: 0, count: 0 };
    current.sum += percentage; current.count += 1; averages.set(result.beneficiaryId, current);
  }
  const struggling = [...averages.values()].map(x => ({ ...x, average: x.sum / x.count })).filter(x => x.average < 50).sort((a, b) => a.average - b.average);

  return <AppShell>
    <header className="mb-8"><h2 className="text-3xl font-bold">التتبع التربوي</h2><p className="mt-2 text-slate-600">إنشاء التقويمات، إدخال النتائج، ورصد حالات التعثر</p></header>
    <section className="mb-8 grid gap-4 md:grid-cols-3">
      <article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">المجموعات النشيطة</p><p className="mt-2 text-3xl font-bold">{groups.length}</p></article>
      <article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">التقويمات</p><p className="mt-2 text-3xl font-bold">{assessments.length}</p></article>
      <article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">حالات التعثر</p><p className="mt-2 text-3xl font-bold">{struggling.length}</p></article>
    </section>
    {struggling.length > 0 && <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h3 className="font-bold">مستفيدون يحتاجون إلى دعم</h3><div className="mt-3 flex flex-wrap gap-2">{struggling.map(s => <span key={s.name} className="rounded-full bg-white px-3 py-1 text-sm">{s.name}: {s.average.toFixed(1)}%</span>)}</div></section>}
    <AcademicTrackingManager groups={groups} assessments={normalizedAssessments} />
  </AppShell>;
}
