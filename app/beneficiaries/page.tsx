import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BeneficiariesManagerV3 } from "@/components/BeneficiariesManagerV3";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BENEFICIARY_LIMIT = 200;

export default async function BeneficiariesPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  const beneficiaries = await prisma.beneficiary.findMany({
    where: { archivedAt: null, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: BENEFICIARY_LIMIT,
    select: {
      id: true,
      registrationNumber: true,
      masarNumber: true,
      firstName: true,
      lastName: true,
      profilePhotoUrl: true,
      gender: true,
      birthDate: true,
      phone: true,
      address: true,
      commune: true,
      province: true,
      lastEducationLevel: true,
      personalProject: true,
      careerChoice1: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      enrollments: {
        where: { leftAt: null },
        select: { group: { select: { name: true, specialty: true, track: true } } },
        take: 1,
        orderBy: { enrolledAt: "desc" }
      },
      activityLogs: {
        orderBy: { eventDate: "desc" },
        take: 1,
        select: { title: true, eventDate: true }
      },
      _count: { select: { documents: true, socialFollowUps: true, academicResults: true } }
    }
  });

  const beneficiaryIds = beneficiaries.map((beneficiary) => beneficiary.id);
  const attendanceGroups = beneficiaryIds.length
    ? await prisma.attendanceRecord.groupBy({
        by: ["beneficiaryId", "status"],
        where: { beneficiaryId: { in: beneficiaryIds } },
        _count: { _all: true }
      })
    : [];

  const attendanceMap = new Map<string, { total: number; attended: number; absences: number }>();
  for (const group of attendanceGroups) {
    const current = attendanceMap.get(group.beneficiaryId) || { total: 0, attended: 0, absences: 0 };
    current.total += group._count._all;
    if (group.status === "PRESENT" || group.status === "LATE") current.attended += group._count._all;
    if (group.status === "ABSENT") current.absences += group._count._all;
    attendanceMap.set(group.beneficiaryId, current);
  }

  const rows = beneficiaries.map((beneficiary, index) => {
    const activeEnrollment = beneficiary.enrollments[0];
    const attendance = attendanceMap.get(beneficiary.id) || { total: 0, attended: 0, absences: 0 };
    const attendanceRate = attendance.total > 0 ? Math.round((attendance.attended / attendance.total) * 100) : null;
    const year = beneficiary.createdAt.getFullYear();
    const serial = String(beneficiaries.length - index).padStart(5, "0");
    const required = [beneficiary.firstName, beneficiary.lastName, beneficiary.birthDate, beneficiary.masarNumber, beneficiary.phone, beneficiary.address, beneficiary.lastEducationLevel, beneficiary.personalProject, beneficiary.careerChoice1];
    const completionRate = Math.round((required.filter(Boolean).length / required.length) * 100);

    return {
      id: beneficiary.id,
      fileNumber: beneficiary.registrationNumber || `SC-${year}-CAS-${serial}`,
      masarNumber: beneficiary.masarNumber,
      firstName: beneficiary.firstName,
      lastName: beneficiary.lastName,
      profilePhotoUrl: beneficiary.profilePhotoUrl,
      gender: beneficiary.gender,
      birthDate: beneficiary.birthDate?.toISOString() || null,
      phone: beneficiary.phone,
      commune: beneficiary.commune,
      province: beneficiary.province,
      lastEducationLevel: beneficiary.lastEducationLevel,
      status: beneficiary.status,
      createdAt: beneficiary.createdAt.toISOString(),
      updatedAt: beneficiary.updatedAt.toISOString(),
      groupName: activeEnrollment?.group.name || null,
      specialty: activeEnrollment?.group.specialty || activeEnrollment?.group.track || beneficiary.careerChoice1 || null,
      attendanceRate,
      absences: attendance.absences,
      documentCount: beneficiary._count.documents,
      followUpCount: beneficiary._count.socialFollowUps,
      resultCount: beneficiary._count.academicResults,
      completionRate,
      lastActivityTitle: beneficiary.activityLogs[0]?.title || null,
      lastActivityDate: beneficiary.activityLogs[0]?.eventDate.toISOString() || null
    };
  });

  return (
    <AppShell>
      <BeneficiariesManagerV3 beneficiaries={rows} />
    </AppShell>
  );
}
