import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BeneficiaryWorkflowV3 } from "@/components/BeneficiaryWorkflowV3";
import { prisma } from "@/lib/prisma";
import { getWorkflowTransitions, workflowProgress, type WorkflowSnapshot } from "@/lib/workflow-engine";

export const dynamic = "force-dynamic";

function fallbackNumber(id: string, createdAt: Date) {
  return `SC-${createdAt.getFullYear()}-CAS-${id.slice(-5).toUpperCase()}`;
}

export default async function BeneficiaryWorkflowPage({ params }: { params: { id: string } }) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id, archivedAt: null, deletedAt: null },
    include: {
      admissionAssessment: { select: { decision: true } },
      enrollments: { where: { leftAt: null }, select: { id: true }, take: 1 },
      activityLogs: {
        where: { referenceType: "BENEFICIARY_WORKFLOW" },
        orderBy: { eventDate: "desc" },
        take: 50,
        select: { id: true, title: true, description: true, actorName: true, eventDate: true, metadata: true }
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
    }
  });

  if (!beneficiary) notFound();

  const snapshot: WorkflowSnapshot = {
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
    admissionDecision: beneficiary.admissionAssessment?.decision,
    hasActiveEnrollment: beneficiary.enrollments.length > 0,
    attendanceRecordsCount: beneficiary._count.attendanceRecords,
    hasTrainingEvidence: beneficiary._count.skillEvaluations + beneficiary._count.vocationalProjects > 0,
    hasIntegrationEvidence: beneficiary._count.internships > 0
  };

  const transitions = getWorkflowTransitions(snapshot);

  return (
    <AppShell>
      <BeneficiaryWorkflowV3
        beneficiary={{
          id: beneficiary.id,
          fullName: `${beneficiary.firstName} ${beneficiary.lastName}`,
          registrationNumber: beneficiary.registrationNumber || fallbackNumber(beneficiary.id, beneficiary.createdAt),
          status: beneficiary.status,
          progress: workflowProgress[beneficiary.status]
        }}
        transitions={transitions}
        history={beneficiary.activityLogs.map((item) => ({
          ...item,
          eventDate: item.eventDate.toISOString(),
          metadata: item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
            ? item.metadata as Record<string, unknown>
            : null
        }))}
      />
    </AppShell>
  );
}
