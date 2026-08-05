import { AppShell } from "@/components/AppShell";
import { BeneficiariesManager } from "@/components/BeneficiariesManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BeneficiariesPage() {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { archivedAt: null, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      enrollments: {
        where: { leftAt: null },
        include: { group: true },
        take: 1,
        orderBy: { enrolledAt: "desc" }
      },
      attendanceRecords: { select: { status: true } },
      activityLogs: { orderBy: { eventDate: "desc" }, take: 1, select: { title: true, eventDate: true } },
      _count: { select: { documents: true, socialFollowUps: true, academicResults: true } }
    }
  });

  const rows = beneficiaries.map((beneficiary, index) => {
    const activeEnrollment = beneficiary.enrollments[0];
    const attendanceTotal = beneficiary.attendanceRecords.length;
    const attended = beneficiary.attendanceRecords.filter((record) => ["PRESENT", "LATE"].includes(record.status)).length;
    const absences = beneficiary.attendanceRecords.filter((record) => record.status === "ABSENT").length;
    const attendanceRate = attendanceTotal > 0 ? Math.round((attended / attendanceTotal) * 100) : null;
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
      absences,
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
      <BeneficiariesManager beneficiaries={rows} />
    </AppShell>
  );
}
