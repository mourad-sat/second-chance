import { AppShell } from "@/components/AppShell";
import { WorkflowManager } from "@/components/WorkflowManager";
import { prisma } from "@/lib/prisma";
import {
  getWorkflowTransitions,
  workflowProgress,
  workflowStatusLabels
} from "@/lib/workflow-engine";

export const dynamic = "force-dynamic";

export default async function WorkflowPage() {
  const beneficiaries = await prisma.beneficiary.findMany({
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
    orderBy: [{ updatedAt: "desc" }]
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
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-blue-950 via-blue-900 to-blue-700 p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
          <p className="text-sm font-black text-cyan-300">Workflow Engine 2.0</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">سير ملفات المستفيدين</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100">إدارة انتقال الملفات بين مراحل البرنامج وفق شروط موحدة، مع إظهار الجاهزية والمتطلبات الناقصة والتنبيهات وتوثيق كل انتقال.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["الملفات النشيطة", activeFiles, "bg-blue-50 text-blue-800"],
            ["جاهزة للانتقال", readyFiles, "bg-emerald-50 text-emerald-800"],
            ["متوقفة بمتطلبات", blockedFiles, "bg-amber-50 text-amber-800"],
            ["أنهت البرنامج", completed, "bg-violet-50 text-violet-800"]
          ].map(([label, value, className]) => (
            <article key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${className}`}>{label}</span>
              <p className="mt-4 text-4xl font-black text-slate-950">{value}</p>
            </article>
          ))}
        </section>

        <WorkflowManager items={items} />
      </div>
    </AppShell>
  );
}
