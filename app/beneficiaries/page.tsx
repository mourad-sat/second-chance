import { AppShell } from "@/components/AppShell";
import { BeneficiariesManager } from "@/components/BeneficiariesManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BeneficiariesPage() {
  const beneficiaries = await prisma.beneficiary.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      enrollments: {
        where: { leftAt: null },
        include: { group: true },
        take: 1,
        orderBy: { enrolledAt: "desc" }
      },
      attendanceRecords: {
        select: { status: true }
      }
    }
  });

  const rows = beneficiaries.map((beneficiary, index) => {
    const activeEnrollment = beneficiary.enrollments[0];
    const attendanceTotal = beneficiary.attendanceRecords.length;
    const attended = beneficiary.attendanceRecords.filter((record) => ["PRESENT", "LATE"].includes(record.status)).length;
    const attendanceRate = attendanceTotal > 0 ? Math.round((attended / attendanceTotal) * 100) : null;
    const year = beneficiary.createdAt.getFullYear();
    const serial = String(beneficiaries.length - index).padStart(5, "0");

    return {
      id: beneficiary.id,
      fileNumber: `SC-${year}-CAS-${serial}`,
      firstName: beneficiary.firstName,
      lastName: beneficiary.lastName,
      identityNumber: beneficiary.identityNumber,
      phone: beneficiary.phone,
      lastEducationLevel: beneficiary.lastEducationLevel,
      status: beneficiary.status,
      createdAt: beneficiary.createdAt.toISOString(),
      groupName: activeEnrollment?.group.name || null,
      specialty: activeEnrollment?.group.specialty || activeEnrollment?.group.track || null,
      attendanceRate
    };
  });

  return (
    <AppShell>
      <header className="mb-7">
        <p className="mb-2 text-sm font-medium text-blue-600">إدارة الملفات الرقمية</p>
        <h2 className="text-3xl font-bold text-slate-900">المستفيدون</h2>
        <p className="mt-2 text-slate-600">البحث والتصفية والوصول السريع إلى الملف الموحد لكل مستفيد.</p>
      </header>

      <BeneficiariesManager beneficiaries={rows} />
    </AppShell>
  );
}
