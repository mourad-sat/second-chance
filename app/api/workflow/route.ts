import { ActivityCategory, BeneficiaryStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth-server";
import { canAccessPath } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  validateWorkflowTransition,
  workflowStatusLabels,
  type WorkflowSnapshot
} from "@/lib/workflow-engine";

type WorkflowRequestBody = {
  beneficiaryId?: unknown;
  nextStatus?: unknown;
  responsibleName?: unknown;
  note?: unknown;
  deadline?: unknown;
};

export async function POST(request: Request) {
  try {
    const session = await currentSession();
    if (!session) {
      return NextResponse.json({ message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    }
    if (!canAccessPath(session.role, "/workflow", "POST")) {
      return NextResponse.json({ message: "ليست لديك صلاحية لتغيير مسار الملف." }, { status: 403 });
    }

    const body = (await request.json()) as WorkflowRequestBody;
    const beneficiaryId = typeof body.beneficiaryId === "string" ? body.beneficiaryId.trim() : "";
    const actorName = session.fullName;
    const responsibleName = typeof body.responsibleName === "string" && body.responsibleName.trim()
      ? body.responsibleName.trim().slice(0, 120)
      : actorName;
    const note = typeof body.note === "string" && body.note.trim()
      ? body.note.trim().slice(0, 2000)
      : null;
    const deadline = typeof body.deadline === "string" && body.deadline ? new Date(body.deadline) : null;
    const nextStatus = typeof body.nextStatus === "string" && Object.values(BeneficiaryStatus).includes(body.nextStatus as BeneficiaryStatus)
      ? (body.nextStatus as BeneficiaryStatus)
      : null;

    if (!beneficiaryId || !nextStatus) {
      return NextResponse.json({ message: "المستفيد والمرحلة الجديدة إلزاميان." }, { status: 400 });
    }

    if (deadline && Number.isNaN(deadline.getTime())) {
      return NextResponse.json({ message: "الموعد النهائي غير صالح." }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId, archivedAt: null, deletedAt: null },
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
      return NextResponse.json({ message: "المستفيد غير موجود أو غير نشط." }, { status: 404 });
    }

    if (beneficiary.status === nextStatus) {
      return NextResponse.json({ message: "الملف موجود بالفعل في هذه المرحلة." }, { status: 409 });
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

    const warningsText = validation.warnings.length ? ` تنبيهات: ${validation.warnings.join(" ")}` : "";
    const description = note || `تم تغيير وضعية الملف من ${workflowStatusLabels[beneficiary.status]} إلى ${workflowStatusLabels[nextStatus]}.${warningsText}`;
    const completedAt = new Date();

    await prisma.$transaction([
      prisma.beneficiary.update({ where: { id: beneficiary.id }, data: { status: nextStatus } }),
      prisma.activityLog.create({
        data: {
          beneficiaryId: beneficiary.id,
          category: ActivityCategory.ADMISSION,
          title: `انتقال الملف إلى: ${workflowStatusLabels[nextStatus]}`,
          description,
          actorName,
          referenceType: "BENEFICIARY_WORKFLOW",
          referenceId: beneficiary.id,
          referenceHref: `/beneficiaries/${beneficiary.id}/workflow`,
          metadata: {
            fromStatus: beneficiary.status,
            toStatus: nextStatus,
            responsibleName,
            deadline: deadline?.toISOString() || null,
            warnings: validation.warnings,
            completedAt: completedAt.toISOString(),
            actorUserId: session.userId
          }
        }
      }),
      prisma.auditLog.create({
        data: {
          action: "WORKFLOW_TRANSITION",
          entityType: "Beneficiary",
          entityId: beneficiary.id,
          description: `${beneficiary.firstName} ${beneficiary.lastName}: ${workflowStatusLabels[beneficiary.status]} ← ${workflowStatusLabels[nextStatus]} · المنفذ: ${actorName} · المسؤول: ${responsibleName}${deadline ? ` · الأجل: ${deadline.toISOString()}` : ""}`
        }
      })
    ]);

    return NextResponse.json({
      message: "تم تحديث مسار الملف وتسجيل المسؤول والموعد بنجاح.",
      status: nextStatus,
      warnings: validation.warnings
    });
  } catch (error) {
    console.error("Workflow transition failed", error);
    return NextResponse.json({ message: "تعذر تحديث مسار الملف." }, { status: 500 });
  }
}
