import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarCheck2,
  GraduationCap,
  HeartHandshake,
  TrendingUp,
  Users
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AcademicTrackingManager } from "@/components/AcademicTrackingManager";
import { AcademicFollowUpTable } from "@/components/AcademicFollowUpTable";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type MetricCard = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  style: string;
};

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default async function AcademicTrackingPage() {
  const [groups, assessments, results, beneficiaries] = await Promise.all([
    prisma.learningGroup.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.academicAssessment.findMany({
      include: {
        group: { include: { enrollments: { where: { leftAt: null }, include: { beneficiary: true } } } },
        results: true
      },
      orderBy: { assessmentDate: "desc" }
    }),
    prisma.academicResult.findMany({
      where: { score: { not: null } },
      include: { assessment: true, beneficiary: true }
    }),
    prisma.beneficiary.findMany({
      where: { status: { in: ["ACCEPTED", "ENROLLED", "UNDER_REVIEW"] } },
      include: {
        admissionAssessment: true,
        enrollments: {
          where: { leftAt: null },
          include: { group: true },
          orderBy: { enrolledAt: "desc" },
          take: 1
        },
        attendanceRecords: { select: { status: true, date: true } },
        academicResults: {
          include: { assessment: true },
          orderBy: { createdAt: "desc" }
        },
        socialFollowUps: {
          orderBy: { eventDate: "desc" },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const normalizedAssessments = assessments.map((assessment) => ({
    ...assessment,
    beneficiaries: assessment.group.enrollments.map((enrollment) => enrollment.beneficiary)
  }));

  const items = beneficiaries.map((beneficiary) => {
    const totalAttendance = beneficiary.attendanceRecords.length;
    const present = beneficiary.attendanceRecords.filter((record) =>
      ["PRESENT", "LATE"].includes(record.status)
    ).length;
    const absences = beneficiary.attendanceRecords.filter((record) => record.status === "ABSENT").length;
    const attendanceRate = percentage(present, totalAttendance);

    const scoredResults = beneficiary.academicResults.filter(
      (result) => result.score !== null && result.assessment.maxScore > 0
    );
    const academicAverage = scoredResults.length
      ? Math.round(
          scoredResults.reduce(
            (sum, result) => sum + ((result.score || 0) / result.assessment.maxScore) * 100,
            0
          ) / scoredResults.length
        )
      : 0;

    const readinessValues = [
      beneficiary.admissionAssessment?.motivationLevel != null
        ? beneficiary.admissionAssessment.motivationLevel * 20
        : null,
      beneficiary.admissionAssessment?.attendanceReadiness != null
        ? beneficiary.admissionAssessment.attendanceReadiness * 20
        : null,
      beneficiary.admissionAssessment?.cognitiveScore ?? null,
      academicAverage || null,
      totalAttendance ? attendanceRate : null
    ].filter((value): value is number => value !== null);

    const trainingReadiness = readinessValues.length
      ? Math.round(readinessValues.reduce((sum, value) => sum + value, 0) / readinessValues.length)
      : 0;

    let riskScore = 0;
    if (totalAttendance >= 3 && attendanceRate < 75) riskScore += 2;
    if (absences >= 3) riskScore += 2;
    if (scoredResults.length && academicAverage < 50) riskScore += 2;
    if ((beneficiary.admissionAssessment?.motivationLevel ?? 5) <= 2) riskScore += 1;
    if (!beneficiary.socialFollowUps[0] && riskScore >= 2) riskScore += 1;

    const riskLevel: RiskLevel = riskScore >= 5 ? "HIGH" : riskScore >= 2 ? "MEDIUM" : "LOW";
    const currentGroup = beneficiary.enrollments[0]?.group;
    const lastResult = beneficiary.academicResults[0];
    const lastFollowUp = beneficiary.socialFollowUps[0];

    return {
      id: beneficiary.id,
      fullName: `${beneficiary.firstName} ${beneficiary.lastName}`,
      groupName: currentGroup?.name || "دون مجموعة",
      specialty: currentGroup?.specialty || currentGroup?.track || "غير محدد",
      attendanceRate,
      absences,
      academicAverage,
      trainingReadiness,
      riskLevel,
      lastAssessment: lastResult
        ? `${lastResult.assessment.title} · ${lastResult.score ?? "—"}/${lastResult.assessment.maxScore}`
        : "لا يوجد تقويم",
      lastSupport: lastFollowUp
        ? `${lastFollowUp.subject} · ${lastFollowUp.eventDate.toLocaleDateString("ar-MA")}`
        : "لا توجد متابعة",
      hasResults: scoredResults.length > 0,
      hasAttendance: totalAttendance > 0
    };
  });

  const highRisk = items.filter((item) => item.riskLevel === "HIGH").length;
  const mediumRisk = items.filter((item) => item.riskLevel === "MEDIUM").length;
  const withResults = items.filter((item) => item.hasResults).length;
  const averageAttendance = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.attendanceRate, 0) / items.length)
    : 0;
  const averageProgress = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.academicAverage, 0) / items.length)
    : 0;
  const readyForTraining = items.filter((item) => item.trainingReadiness >= 70).length;

  const cards: MetricCard[] = [
    { label: "المستفيدون المتابعون", value: items.length, icon: Users, style: "bg-blue-50 text-blue-700" },
    { label: "متوسط الحضور", value: `${averageAttendance}%`, icon: CalendarCheck2, style: "bg-emerald-50 text-emerald-700" },
    { label: "متوسط التقدم", value: `${averageProgress}%`, icon: TrendingUp, style: "bg-violet-50 text-violet-700" },
    { label: "لديهم نتائج", value: withResults, icon: BookOpenCheck, style: "bg-sky-50 text-sky-700" },
    { label: "جاهزون للتكوين", value: readyForTraining, icon: GraduationCap, style: "bg-teal-50 text-teal-700" },
    { label: "خطر مرتفع", value: highRisk, icon: AlertTriangle, style: "bg-rose-50 text-rose-700" }
  ];

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">المرحلة 3.3.1</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">مركز التتبع التربوي</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            رؤية موحدة للحضور، النتائج، خطر الانقطاع، الدعم الفردي، والجاهزية للانتقال إلى التكوين المهني.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/attendance" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
            <CalendarCheck2 size={17} /> وحدة الحضور
          </Link>
          <Link href="/social-support" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <HeartHandshake size={17} /> المواكبة الاجتماعية
          </Link>
        </div>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon, style }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`mb-4 inline-flex rounded-xl p-2.5 ${style}`}><Icon size={19} /></div>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
          </article>
        ))}
      </section>

      {(highRisk > 0 || mediumRisk > 0) && (
        <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={21} />
            <div>
              <h2 className="font-bold text-amber-950">حالات تحتاج إلى تدخل تربوي</h2>
              <p className="mt-1 text-sm text-amber-800">{highRisk} بخطر مرتفع و{mediumRisk} بخطر متوسط حسب الحضور والنتائج والدافعية.</p>
            </div>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-amber-800">المجموع: {highRisk + mediumRisk}</span>
        </section>
      )}

      <AcademicFollowUpTable items={items} />

      <section className="mt-10 border-t border-slate-200 pt-8">
        <div className="mb-5">
          <p className="text-sm font-semibold text-blue-600">أدوات التقويم</p>
          <h2 className="mt-1 text-2xl font-bold">إنشاء التقويمات وإدخال النتائج</h2>
          <p className="mt-2 text-slate-600">استمر في استخدام الأدوات الحالية لإنشاء التقويمات وربطها بالمجموعات وتسجيل النتائج.</p>
        </div>
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">المجموعات النشيطة</p><p className="mt-2 text-3xl font-bold">{groups.length}</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">التقويمات</p><p className="mt-2 text-3xl font-bold">{assessments.length}</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">النتائج المدخلة</p><p className="mt-2 text-3xl font-bold">{results.length}</p></article>
        </section>
        <AcademicTrackingManager groups={groups} assessments={normalizedAssessments} />
      </section>
    </AppShell>
  );
}
