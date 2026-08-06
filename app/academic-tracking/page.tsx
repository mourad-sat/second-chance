import Link from "next/link";
import { redirect } from "next/navigation";
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
import { PageContainer, PageHeader, SectionCard, StatCard } from "@/components/ui/SystemUI";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
type MetricCard = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: "emerald" | "sky" | "violet" | "amber" | "rose";
};

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default async function AcademicTrackingPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  const [groups, assessments, results, beneficiaries] = await Promise.all([
    prisma.learningGroup.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.academicAssessment.findMany({
      include: {
        group: { include: { enrollments: { where: { leftAt: null }, include: { beneficiary: true } } } },
        results: true
      },
      orderBy: { assessmentDate: "desc" },
      take: 200
    }),
    prisma.academicResult.findMany({
      where: { score: { not: null }, beneficiary: { archivedAt: null, deletedAt: null } },
      include: { assessment: true, beneficiary: true },
      take: 500,
      orderBy: { createdAt: "desc" }
    }),
    prisma.beneficiary.findMany({
      where: {
        archivedAt: null,
        deletedAt: null,
        status: { in: ["ACCEPTED", "ENROLLED", "UNDER_REVIEW"] }
      },
      include: {
        admissionAssessment: true,
        enrollments: {
          where: { leftAt: null },
          include: { group: true },
          orderBy: { enrolledAt: "desc" },
          take: 1
        },
        attendanceRecords: { select: { status: true, date: true }, orderBy: { date: "desc" }, take: 120 },
        academicResults: {
          include: { assessment: true },
          orderBy: { createdAt: "desc" },
          take: 50
        },
        socialFollowUps: {
          orderBy: { eventDate: "desc" },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" },
      take: 300
    })
  ]);

  const normalizedAssessments = assessments.map((assessment) => ({
    ...assessment,
    beneficiaries: assessment.group.enrollments.map((enrollment) => enrollment.beneficiary)
  }));

  const items = beneficiaries.map((beneficiary) => {
    const totalAttendance = beneficiary.attendanceRecords.length;
    const present = beneficiary.attendanceRecords.filter((record) => ["PRESENT", "LATE"].includes(record.status)).length;
    const absences = beneficiary.attendanceRecords.filter((record) => record.status === "ABSENT").length;
    const attendanceRate = percentage(present, totalAttendance);

    const scoredResults = beneficiary.academicResults.filter(
      (result) => result.score !== null && result.assessment.maxScore > 0
    );
    const academicAverage = scoredResults.length
      ? Math.round(scoredResults.reduce((sum, result) => sum + ((result.score || 0) / result.assessment.maxScore) * 100, 0) / scoredResults.length)
      : 0;

    const readinessValues = [
      beneficiary.admissionAssessment?.motivationLevel != null ? beneficiary.admissionAssessment.motivationLevel * 20 : null,
      beneficiary.admissionAssessment?.attendanceReadiness != null ? beneficiary.admissionAssessment.attendanceReadiness * 20 : null,
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
  const averageAttendance = items.length ? Math.round(items.reduce((sum, item) => sum + item.attendanceRate, 0) / items.length) : 0;
  const averageProgress = items.length ? Math.round(items.reduce((sum, item) => sum + item.academicAverage, 0) / items.length) : 0;
  const readyForTraining = items.filter((item) => item.trainingReadiness >= 70).length;

  const cards: MetricCard[] = [
    { label: "المستفيدون المتابعون", value: items.length, icon: Users, tone: "sky" },
    { label: "متوسط الحضور", value: `${averageAttendance}%`, icon: CalendarCheck2, tone: "emerald" },
    { label: "متوسط التقدم", value: `${averageProgress}%`, icon: TrendingUp, tone: "violet" },
    { label: "لديهم نتائج", value: withResults, icon: BookOpenCheck, tone: "sky" },
    { label: "جاهزون للتكوين", value: readyForTraining, icon: GraduationCap, tone: "emerald" },
    { label: "خطر مرتفع", value: highRisk, icon: AlertTriangle, tone: "rose" }
  ];

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          eyebrow="المتابعة والتدخل"
          title="مركز التتبع التربوي"
          description="رؤية موحدة للحضور والنتائج وخطر الانقطاع والدعم الفردي والجاهزية للانتقال إلى التكوين المهني."
          icon={BookOpenCheck}
          actions={
            <>
              <Link href="/attendance" className="btn-secondary"><CalendarCheck2 size={17} /> وحدة الحضور</Link>
              <Link href="/social-support" className="btn-primary"><HeartHandshake size={17} /> المواكبة الاجتماعية</Link>
            </>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {cards.map(({ label, value, icon, tone }) => (
            <StatCard key={label} title={label} value={value} icon={icon} tone={tone} />
          ))}
        </section>

        {(highRisk > 0 || mediumRisk > 0) && (
          <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={21} />
              <div>
                <h2 className="font-black text-amber-950">حالات تحتاج إلى تدخل تربوي</h2>
                <p className="mt-1 text-sm text-amber-800">{highRisk} بخطر مرتفع و{mediumRisk} بخطر متوسط حسب الحضور والنتائج والدافعية.</p>
              </div>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-800">المجموع: {highRisk + mediumRisk}</span>
          </section>
        )}

        <AcademicFollowUpTable items={items} />

        <SectionCard
          title="إنشاء التقويمات وإدخال النتائج"
          description="إنشاء التقويمات وربطها بالمجموعات ثم تسجيل النتائج الفردية."
          icon={GraduationCap}
        >
          <section className="mb-6 grid gap-4 md:grid-cols-3">
            <StatCard title="المجموعات النشطة" value={groups.length} icon={Users} tone="emerald" />
            <StatCard title="التقويمات" value={assessments.length} icon={BookOpenCheck} tone="sky" />
            <StatCard title="النتائج المدخلة" value={results.length} icon={TrendingUp} tone="violet" />
          </section>
          <AcademicTrackingManager groups={groups} assessments={normalizedAssessments} />
        </SectionCard>
      </PageContainer>
    </AppShell>
  );
}
