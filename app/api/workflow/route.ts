import { ActivityCategory, BeneficiaryStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateWorkflowTransition,
  workflowStatusLabels,
  type WorkflowSnapshot
} from "@/lib/workflow-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const beneficiaryId = typeof body.beneficiaryId === "string" ? body.beneficiaryId.trim() : "";
    const actorName = typeof body.actorName === "string" && body.actorName.trim() ? body.actorName.trim() : "مدير المنصة";
    const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;
    const nextStatus = Object.values(BeneficiaryStatus).includes(body.nextStatus)
      ? (body.nextStatus as BeneficiaryStatus)
      : null;

    if (!beneficiaryId || !nextStatus) {
      return NextResponse.json({ message: "المستفيد والمرحلة الجديدة إلزاميان." }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
      include: {
        admissionAssessment: { select: { decision: true } },
        enrollments: { where: { leftAt: null }, select: { id: true }, take: 1 },
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

    if (!beneficiary) {
      return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });
    }

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

    const validation = validateWorkflowTransition(snapshot, nextStatus);
    if (!validation.allowed) {
      return NextResponse.json(
        {
          message: "لا يمكن تنفيذ الانتقال قبل استكمال المتطلبات الإلزامية.",
          blockers: validation.blockers,
          warnings: validation.warnings
        },
        { status: 409 }
      );
    }

    const warningsText = validation.warnings.length
      ? ` تنبيهات: ${validation.warnings.join(" ")}`
      : "";

    await prisma.$transaction([
      prisma.beneficiary.update({ where: { id: beneficiary.id }, data: { status: nextStatus } }),
      prisma.activityLog.create({
        data: {
          beneficiaryId: beneficiary.id,
          category: ActivityCategory.ADMISSION,
          title: `انتقال الملف إلى: ${workflowStatusLabels[nextStatus]}`,
          description:
            note ||
            `تم تغيير وضعية الملف من ${workflowStatusLabels[beneficiary.status]} إلى ${workflowStatusLabels[nextStatus]}.${warningsText}`,
          actorName,
          referenceType: "BENEFICIARY_WORKFLOW",
          referenceId: beneficiary.id,
          referenceHref: `/beneficiaries/${beneficiary.id}/overview`
        }
      })
    ]);

    return NextResponse.json({
      message: "تم تحديث مسار الملف بنجاح.",
      status: nextStatus,
      warnings: validation.warnings
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر تحديث مسار الملف." }, { status: 500 });
  }
}
