import { prisma } from "@/lib/prisma";

export type SmartNotification = {
  id: string;
  type: "ATTENDANCE" | "ACADEMIC" | "SOCIAL" | "INTERNSHIP" | "WORKFLOW";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  href: string;
  beneficiaryId?: string;
  beneficiaryName?: string;
  dueDate?: string;
};

const activeBeneficiary = { archivedAt: null, deletedAt: null } as const;
const MAX_NOTIFICATIONS = 200;

function daysFromNow(date: Date) {
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

export async function generateSmartNotifications(): Promise<SmartNotification[]> {
  const now = new Date();
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [absenceGroups, overduePlans, overdueFollowUps, endingInternships, workflowLogs] = await Promise.all([
    prisma.attendanceRecord.groupBy({
      by: ["beneficiaryId"],
      where: {
        status: "ABSENT",
        date: { gte: ninetyDaysAgo },
        beneficiary: activeBeneficiary
      },
      _count: { beneficiaryId: true },
      orderBy: { _count: { beneficiaryId: "desc" } },
      take: 100
    }),
    prisma.academicSupportPlan.findMany({
      where: {
        reviewDate: { lt: now },
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        beneficiary: activeBeneficiary
      },
      select: {
        id: true,
        beneficiaryId: true,
        reviewDate: true,
        priority: true,
        objective: true,
        beneficiary: { select: { firstName: true, lastName: true } }
      },
      orderBy: { reviewDate: "asc" },
      take: 50
    }),
    prisma.socialFollowUp.findMany({
      where: {
        nextFollowUpDate: { lt: now },
        status: { in: ["OPEN", "IN_PROGRESS"] },
        beneficiary: activeBeneficiary
      },
      select: {
        id: true,
        beneficiaryId: true,
        nextFollowUpDate: true,
        priority: true,
        nextAction: true,
        subject: true,
        beneficiary: { select: { firstName: true, lastName: true } }
      },
      orderBy: { nextFollowUpDate: "asc" },
      take: 50
    }),
    prisma.internship.findMany({
      where: {
        endDate: { gte: now, lte: sevenDays },
        status: { in: ["PLANNED", "ACTIVE"] },
        beneficiary: activeBeneficiary
      },
      select: {
        id: true,
        beneficiaryId: true,
        endDate: true,
        organizationName: true,
        beneficiary: { select: { firstName: true, lastName: true } }
      },
      orderBy: { endDate: "asc" },
      take: 50
    }),
    prisma.activityLog.findMany({
      where: {
        referenceType: "BENEFICIARY_WORKFLOW",
        eventDate: { gte: ninetyDaysAgo },
        beneficiary: activeBeneficiary
      },
      select: {
        id: true,
        beneficiaryId: true,
        title: true,
        metadata: true,
        beneficiary: { select: { firstName: true, lastName: true } }
      },
      orderBy: { eventDate: "desc" },
      take: 300
    })
  ]);

  const absences = absenceGroups.filter((item) => item._count.beneficiaryId >= 5);
  const absenceIds = absences.map((item) => item.beneficiaryId);
  const absenceBeneficiaries = absenceIds.length
    ? await prisma.beneficiary.findMany({
        where: { id: { in: absenceIds }, ...activeBeneficiary },
        select: { id: true, firstName: true, lastName: true },
        take: 100
      })
    : [];
  const absenceMap = new Map(absenceBeneficiaries.map((item) => [item.id, item]));
  const notifications: SmartNotification[] = [];

  for (const item of absences) {
    const beneficiary = absenceMap.get(item.beneficiaryId);
    if (!beneficiary) continue;
    const count = item._count.beneficiaryId;
    notifications.push({
      id: `attendance-${item.beneficiaryId}-${count}`,
      type: "ATTENDANCE",
      priority: count >= 10 ? "CRITICAL" : "HIGH",
      title: "غياب متكرر يحتاج تدخلًا",
      description: `سُجلت ${count} حالات غياب خلال آخر 90 يومًا.`,
      href: `/beneficiaries/${item.beneficiaryId}#attendance`,
      beneficiaryId: item.beneficiaryId,
      beneficiaryName: `${beneficiary.firstName} ${beneficiary.lastName}`
    });
  }

  for (const plan of overduePlans) {
    notifications.push({
      id: `support-${plan.id}-${plan.reviewDate?.toISOString()}`,
      type: "ACADEMIC",
      priority: plan.priority === "URGENT" ? "CRITICAL" : plan.priority === "HIGH" ? "HIGH" : "MEDIUM",
      title: "مراجعة خطة دعم متأخرة",
      description: plan.objective,
      href: `/beneficiaries/${plan.beneficiaryId}/support-plan`,
      beneficiaryId: plan.beneficiaryId,
      beneficiaryName: `${plan.beneficiary.firstName} ${plan.beneficiary.lastName}`,
      dueDate: plan.reviewDate?.toISOString()
    });
  }

  for (const followUp of overdueFollowUps) {
    notifications.push({
      id: `social-${followUp.id}-${followUp.nextFollowUpDate?.toISOString()}`,
      type: "SOCIAL",
      priority: followUp.priority === "URGENT" ? "CRITICAL" : followUp.priority === "HIGH" ? "HIGH" : "MEDIUM",
      title: "موعد متابعة اجتماعية متأخر",
      description: followUp.nextAction || followUp.subject,
      href: `/beneficiaries/${followUp.beneficiaryId}#social`,
      beneficiaryId: followUp.beneficiaryId,
      beneficiaryName: `${followUp.beneficiary.firstName} ${followUp.beneficiary.lastName}`,
      dueDate: followUp.nextFollowUpDate?.toISOString()
    });
  }

  for (const internship of endingInternships) {
    const remaining = internship.endDate ? daysFromNow(internship.endDate) : 0;
    notifications.push({
      id: `internship-${internship.id}-${internship.endDate?.toISOString()}`,
      type: "INTERNSHIP",
      priority: remaining <= 2 ? "HIGH" : "MEDIUM",
      title: "تدريب مهني يقترب من نهايته",
      description: `${internship.organizationName} · بقي ${remaining} أيام.`,
      href: "/integration",
      beneficiaryId: internship.beneficiaryId,
      beneficiaryName: `${internship.beneficiary.firstName} ${internship.beneficiary.lastName}`,
      dueDate: internship.endDate?.toISOString()
    });
  }

  const latestWorkflow = new Map<string, typeof workflowLogs[number]>();
  for (const log of workflowLogs) {
    if (!latestWorkflow.has(log.beneficiaryId)) latestWorkflow.set(log.beneficiaryId, log);
  }

  for (const log of latestWorkflow.values()) {
    const metadata = log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
      ? log.metadata as Record<string, unknown>
      : null;
    const deadlineValue = metadata?.deadline;
    if (typeof deadlineValue !== "string") continue;
    const deadline = new Date(deadlineValue);
    if (Number.isNaN(deadline.getTime())) continue;
    const remaining = daysFromNow(deadline);
    if (remaining > 3) continue;
    const responsible = typeof metadata?.responsibleName === "string" ? metadata.responsibleName : "غير محدد";
    notifications.push({
      id: `workflow-${log.id}-${deadlineValue}`,
      type: "WORKFLOW",
      priority: remaining < 0 ? "CRITICAL" : remaining <= 1 ? "HIGH" : "MEDIUM",
      title: remaining < 0 ? "تأخر في مرحلة سير الملف" : "موعد مرحلة سير الملف يقترب",
      description: `${log.title} · المسؤول: ${responsible}${remaining < 0 ? ` · متأخر ${Math.abs(remaining)} يومًا` : ` · بقي ${remaining} أيام`}`,
      href: `/beneficiaries/${log.beneficiaryId}/workflow`,
      beneficiaryId: log.beneficiaryId,
      beneficiaryName: `${log.beneficiary.firstName} ${log.beneficiary.lastName}`,
      dueDate: deadline.toISOString()
    });
  }

  const rank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
  return notifications
    .sort((a, b) => rank[a.priority] - rank[b.priority])
    .slice(0, MAX_NOTIFICATIONS);
}
