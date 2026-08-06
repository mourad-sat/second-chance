import { redirect } from "next/navigation";
import { Activity, CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { WorkflowManager } from "@/components/WorkflowManager";
import { PageContainer, PageHeader, StatCard } from "@/components/ui/SystemUI";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  getWorkflowTransitions,
  workflowProgress,
  workflowStatusLabels
} from "@/lib/workflow-engine";

export const dynamic = "force-dynamic";

export default async function WorkflowPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  const beneficiaries = await prisma.beneficiary.findMany({
    where: { archivedAt: null, deletedAt: null },
    include: {
      admissionAssessment: { select: { decision: true } },
      enrollments: {
        where: { leftAt: null },
        include: { group: { select: { name: true } } },
        orderBy: { enrolledAt: "desc" },
        take: 1
      },
      activityLogs: {
        where: { referenceType: "BENEFICIARY_WORKFLOW" },
        orderBy: { eventDate: "desc" },
        take: 1,
        select: { title: true, eventDate: true, actorName: true }
      },
      _count: {
        select: {
          documents: true,
          attendanceRecords: true,
          skillEvaluations: true,
          vocationalProjects: true,
          internships: true
        }
      }
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 300
  });

  const items = beneficiaries.map((beneficiary) => {
    const transitions = getWorkflowTransitions({
      status: beneficiary.status,
      masarNumber: beneficiary.masarNumber,
      birthDate: beneficiary.birthDate,
      phone: beneficiary.phone,
      address: beneficiary.address,
      lastEducationLevel: beneficiary.lastEducationLevel,
      personalProject: beneficiary.personalProject,
      careerChoice1: beneficiary.careerChoice1,
      documentsCount: beneficiary._count.documents,
      hasAdmissionAssessment: Boolean(beneficiary.admissionAssessment),
      admissionDecision: beneficiary.admissionAssessment?.decision || null,
      hasActiveEnrollment: beneficiary.enrollments.length > 0,
      attendanceRecordsCount: beneficiary._count.attendanceRecords,
      hasTrainingEvidence: beneficiary._count.skillEvaluations > 0 || beneficiary._count.vocationalProjects > 0,
      hasIntegrationEvidence: beneficiary._count.internships > 0
    });

    const readyTransitions = transitions.filter((transition) => transition.ready).length;
    const totalBlockers = transitions.reduce((sum, transition) => sum + transition.blockers.length, 0);
    const totalWarnings = transitions.reduce((sum, transition) => sum + transition.warnings.length, 0);
    const readinessRate = transitions.length
      ? Math.round((readyTransitions / transitions.length) * 100)
      : beneficiary.status === "COMPLETED" ? 100 : 0;

    return {
      id: beneficiary.id,
      firstName: beneficiary.firstName,
      lastName: beneficiary.lastName,
      registrationNumber: beneficiary.registrationNumber,
      masarNumber: beneficiary.masarNumber,
      status: beneficiary.status,
      stageLabel: workflowStatusLabels[beneficiary.status],
      progress: workflowProgress[beneficiary.status],
      readinessRate,
      groupName: beneficiary.enrollments[0]?.group.name || null,
      blockersCount: totalBlockers,
      warningsCount: totalWarnings,
      lastTransition: beneficiary.activityLogs[0]
        ? {
            title: beneficiary.activityLogs[0].title,
            date: beneficiary.activityLogs[0].eventDate.toISOString(),
            actorName: beneficiary.activityLogs[0].actorName
          }
        : null,
      nextOptions: transitions.map((transition) => ({
        value: transition.value,
        label: transition.label,
        description: transition.description,
        blockers: transition.blockers,
        warnings: transition.warnings,
        ready: transition.ready
      }))
    };
  });

  const activeFiles = beneficiaries.filter((item) => !["REJECTED", "WITHDRAWN", "COMPLETED"].includes(item.status)).length;
  const readyFiles = items.filter((item) => item.nextOptions.some((option) => option.ready)).length;
  const blockedFiles = items.filter((item) => item.blockersCount > 0).length;
  const completed = beneficiaries.filter((item) => item.status === "COMPLETED").length;

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          eyebrow="محرك الانتقالات"
          title="سير ملفات المستفيدين"
          description="إدارة انتقال الملفات بين مراحل البرنامج وفق شروط موحدة، مع إظهار الجاهزية والمتطلبات الناقصة وتوثيق كل انتقال."
          icon={Activity}
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="الملفات النشطة" value={activeFiles} note="ملفات ما زالت داخل مسار البرنامج" icon={Activity} tone="sky" />
          <StatCard title="جاهزة للانتقال" value={readyFiles} note="تتوفر فيها شروط مرحلة تالية واحدة على الأقل" icon={CheckCircle2} tone="emerald" />
          <StatCard title="متوقفة بمتطلبات" value={blockedFiles} note="تحتاج استكمال بيانات أو وثائق" icon={CircleAlert} tone="amber" />
          <StatCard title="أنهت البرنامج" value={completed} note="ملفات مكتملة المسار" icon={CircleDashed} tone="violet" />
        </section>

        <WorkflowManager items={items} />
      </PageContainer>
    </AppShell>
  );
}
