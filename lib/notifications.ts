import { prisma } from "@/lib/prisma";

export type SmartNotification = {
  id: string;
  type: "ATTENDANCE" | "ACADEMIC" | "SOCIAL" | "INTERNSHIP";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  href: string;
  beneficiaryId?: string;
  beneficiaryName?: string;
  dueDate?: string;
};

function daysFromNow(date: Date) {
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

export async function generateSmartNotifications(): Promise<SmartNotification[]> {
  const now = new Date();
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);

  const [absences, overduePlans, overdueFollowUps, endingInternships] = await Promise.all([
    prisma.attendanceRecord.groupBy({
      by: ["beneficiaryId"],
      where: { status: "ABSENT" },
      _count: { _all: true },
      having: { beneficiaryId: { _count: { gte: 5 } } }
    }),
    prisma.academicSupportPlan.findMany({
      where: { reviewDate: { lt: now }, status: { in: ["PLANNED", "IN_PROGRESS"] } },
      include: { beneficiary: { select: { firstName: true, lastName: true } } },
      orderBy: { reviewDate: "asc" },
      take: 50
    }),
    prisma.socialFollowUp.findMany({
      where: { nextFollowUpDate: { lt: now }, status: { in: ["OPEN", "IN_PROGRESS"] } },
      include: { beneficiary: { select: { firstName: true, lastName: true } } },
      orderBy: { nextFollowUpDate: "asc" },
      take: 50
    }),
    prisma.internship.findMany({
      where: { endDate: { gte: now, lte: sevenDays }, status: { in: ["PLANNED", "ACTIVE"] } },
      include: { beneficiary: { select: { firstName: true, lastName: true } } },
      orderBy: { endDate: "asc" },
      take: 50
    })
  ]);

  const absenceIds = absences.map((item) => item.beneficiaryId);
  const absenceBeneficiaries = absenceIds.length
    ? await prisma.beneficiary.findMany({
        where: { id: { in: absenceIds } },
        select: { id: true, firstName: true, lastName: true }
      })
    : [];
  const absenceMap = new Map(absenceBeneficiaries.map((item) => [item.id, item]));

  const notifications: SmartNotification[] = [];

  for (const item of absences) {
    const beneficiary = absenceMap.get(item.beneficiaryId);
    if (!beneficiary) continue;
    const count = item._count._all;
    notifications.push({
      id: `attendance-${item.beneficiaryId}-${count}`,
      type: "ATTENDANCE",
      priority: count >= 10 ? "CRITICAL" : "HIGH",
      title: "غياب متكرر يحتاج تدخلًا",
      description: `سُجلت ${count} حالات غياب للمستفيد.`,
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

  const rank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
  return notifications.sort((a, b) => rank[a.priority] - rank[b.priority]);
}
