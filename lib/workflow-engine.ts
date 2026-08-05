import { BeneficiaryStatus } from "@prisma/client";

export type WorkflowSnapshot = {
  status: BeneficiaryStatus;
  masarNumber?: string | null;
  birthDate?: Date | null;
  phone?: string | null;
  address?: string | null;
  lastEducationLevel?: string | null;
  personalProject?: string | null;
  careerChoice1?: string | null;
  documentsCount: number;
  hasAdmissionAssessment: boolean;
  admissionDecision?: string | null;
  hasActiveEnrollment: boolean;
  attendanceRecordsCount: number;
  hasTrainingEvidence: boolean;
  hasIntegrationEvidence: boolean;
};

export type WorkflowTransition = {
  value: BeneficiaryStatus;
  label: string;
  description: string;
  blockers: string[];
  warnings: string[];
  ready: boolean;
};

export const workflowStatusLabels: Record<BeneficiaryStatus, string> = {
  PRE_REGISTERED: "التسجيل الأولي",
  UNDER_REVIEW: "دراسة الملف والتشخيص",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "القبول",
  REJECTED: "رفض الملف",
  ENROLLED: "التمدرس والتكوين",
  WITHDRAWN: "الانسحاب",
  COMPLETED: "استكمال البرنامج"
};

export const workflowProgress: Record<BeneficiaryStatus, number> = {
  PRE_REGISTERED: 12,
  UNDER_REVIEW: 30,
  WAITLISTED: 42,
  ACCEPTED: 52,
  REJECTED: 30,
  ENROLLED: 76,
  WITHDRAWN: 76,
  COMPLETED: 100
};

const allowedTransitions: Record<BeneficiaryStatus, BeneficiaryStatus[]> = {
  PRE_REGISTERED: [BeneficiaryStatus.UNDER_REVIEW],
  UNDER_REVIEW: [BeneficiaryStatus.ACCEPTED, BeneficiaryStatus.WAITLISTED, BeneficiaryStatus.REJECTED],
  WAITLISTED: [BeneficiaryStatus.ACCEPTED, BeneficiaryStatus.REJECTED],
  ACCEPTED: [BeneficiaryStatus.ENROLLED],
  REJECTED: [BeneficiaryStatus.UNDER_REVIEW],
  ENROLLED: [BeneficiaryStatus.COMPLETED, BeneficiaryStatus.WITHDRAWN],
  WITHDRAWN: [BeneficiaryStatus.ENROLLED],
  COMPLETED: []
};

const admissionDecisionStatuses = new Set<BeneficiaryStatus>([
  BeneficiaryStatus.ACCEPTED,
  BeneficiaryStatus.WAITLISTED,
  BeneficiaryStatus.REJECTED
]);

const transitionLabels: Partial<Record<BeneficiaryStatus, string>> = {
  UNDER_REVIEW: "بدء دراسة الملف",
  ACCEPTED: "اعتماد القبول",
  WAITLISTED: "إدراج في لائحة الانتظار",
  REJECTED: "اعتماد عدم القبول",
  ENROLLED: "تأكيد التسجيل النهائي",
  WITHDRAWN: "تسجيل الانسحاب",
  COMPLETED: "اعتماد استكمال البرنامج"
};

function readiness(snapshot: WorkflowSnapshot, nextStatus: BeneficiaryStatus) {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (nextStatus === BeneficiaryStatus.UNDER_REVIEW) {
    if (!snapshot.masarNumber) blockers.push("رقم مسار غير مسجل.");
    if (!snapshot.birthDate) blockers.push("تاريخ الازدياد غير مسجل.");
    if (!snapshot.phone) blockers.push("رقم الهاتف غير مسجل.");
    if (!snapshot.address) warnings.push("العنوان غير مكتمل.");
    if (!snapshot.lastEducationLevel) warnings.push("المستوى الدراسي غير محدد.");
  }

  if (admissionDecisionStatuses.has(nextStatus)) {
    if (!snapshot.hasAdmissionAssessment) blockers.push("لم تُنجز مقابلة التشخيص والقبول.");
    if (snapshot.documentsCount === 0) warnings.push("لا توجد وثائق مرفوعة في الملف.");
    if (!snapshot.personalProject) warnings.push("المشروع الشخصي غير موثق.");
    if (!snapshot.careerChoice1) warnings.push("الرغبة المهنية الأولى غير محددة.");
  }

  if (nextStatus === BeneficiaryStatus.ENROLLED) {
    if (snapshot.status !== BeneficiaryStatus.WITHDRAWN && !snapshot.hasAdmissionAssessment) blockers.push("قرار القبول غير موثق.");
    if (!snapshot.hasActiveEnrollment && snapshot.status !== BeneficiaryStatus.WITHDRAWN) warnings.push("يجب إسناد المستفيد إلى مجموعة بعد تأكيد التسجيل.");
  }

  if (nextStatus === BeneficiaryStatus.COMPLETED) {
    if (!snapshot.hasActiveEnrollment) blockers.push("لا يوجد تسجيل نشط في مجموعة.");
    if (snapshot.attendanceRecordsCount === 0) blockers.push("لا توجد سجلات حضور وغياب.");
    if (!snapshot.hasTrainingEvidence) warnings.push("لا توجد أدلة كافية على التكوين أو تقييم المهارات.");
    if (!snapshot.hasIntegrationEvidence) warnings.push("لم تُسجل مرحلة تدريب أو إدماج بعد.");
  }

  return { blockers, warnings };
}

export function getWorkflowTransitions(snapshot: WorkflowSnapshot): WorkflowTransition[] {
  return allowedTransitions[snapshot.status].map((value) => {
    const { blockers, warnings } = readiness(snapshot, value);
    return {
      value,
      label: transitionLabels[value] || `الانتقال إلى ${workflowStatusLabels[value]}`,
      description: `نقل الملف من ${workflowStatusLabels[snapshot.status]} إلى ${workflowStatusLabels[value]}.`,
      blockers,
      warnings,
      ready: blockers.length === 0
    };
  });
}

export function validateWorkflowTransition(snapshot: WorkflowSnapshot, nextStatus: BeneficiaryStatus) {
  if (!allowedTransitions[snapshot.status].includes(nextStatus)) {
    return { allowed: false, blockers: ["هذا الانتقال غير مسموح من المرحلة الحالية."], warnings: [] };
  }

  const { blockers, warnings } = readiness(snapshot, nextStatus);
  return { allowed: blockers.length === 0, blockers, warnings };
}
