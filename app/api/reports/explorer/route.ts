import { BeneficiaryStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const allowedStatuses = new Set(Object.values(BeneficiaryStatus));

function parseDate(value: string | null, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const statusValue = url.searchParams.get("status");
  const groupId = url.searchParams.get("groupId") || undefined;
  const from = parseDate(url.searchParams.get("from"));
  const to = parseDate(url.searchParams.get("to"), true);
  const format = url.searchParams.get("format");

  const status = statusValue && allowedStatuses.has(statusValue as BeneficiaryStatus)
    ? statusValue as BeneficiaryStatus
    : undefined;

  const where: Prisma.BeneficiaryWhereInput = {
    ...(status ? { status } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(groupId ? { enrollments: { some: { groupId, leftAt: null } } } : {})
  };

  const [beneficiaries, groups] = await Promise.all([
    prisma.beneficiary.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        identityNumber: true,
        phone: true,
        status: true,
        createdAt: true,
        enrollments: {
          where: { leftAt: null },
          select: { group: { select: { id: true, name: true, academicYear: true, track: true, specialty: true } } },
          orderBy: { enrolledAt: "desc" },
          take: 1
        },
        attendanceRecords: { select: { status: true } },
        documents: { select: { id: true } },
        internships: { select: { status: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 1000
    }),
    prisma.learningGroup.findMany({
      where: { isActive: true },
      select: { id: true, name: true, academicYear: true },
      orderBy: [{ academicYear: "desc" }, { name: "asc" }]
    })
  ]);

  const rows = beneficiaries.map((beneficiary) => {
    const attendanceTotal = beneficiary.attendanceRecords.length;
    const present = beneficiary.attendanceRecords.filter((record) => ["PRESENT", "LATE"].includes(record.status)).length;
    const absences = beneficiary.attendanceRecords.filter((record) => record.status === "ABSENT").length;
    const group = beneficiary.enrollments[0]?.group;
    return {
      id: beneficiary.id,
      fullName: `${beneficiary.firstName} ${beneficiary.lastName}`,
      identityNumber: beneficiary.identityNumber || "",
      phone: beneficiary.phone || "",
      status: beneficiary.status,
      groupName: group?.name || "غير مسند",
      academicYear: group?.academicYear || "",
      track: group?.specialty || group?.track || "",
      attendanceRate: attendanceTotal ? Math.round((present / attendanceTotal) * 100) : 0,
      absences,
      documents: beneficiary.documents.length,
      activeInternships: beneficiary.internships.filter((item) => item.status === "ACTIVE").length,
      completedInternships: beneficiary.internships.filter((item) => item.status === "COMPLETED").length,
      registeredAt: beneficiary.createdAt.toISOString()
    };
  });

  if (format === "csv") {
    const headers = ["الاسم الكامل", "رقم الهوية", "الهاتف", "الوضعية", "المجموعة", "الموسم", "المسار", "نسبة الحضور", "الغيابات", "الوثائق", "تداريب جارية", "تداريب مكتملة", "تاريخ التسجيل"];
    const lines = rows.map((row) => [
      row.fullName, row.identityNumber, row.phone, row.status, row.groupName, row.academicYear,
      row.track, `${row.attendanceRate}%`, row.absences, row.documents, row.activeInternships,
      row.completedInternships, new Date(row.registeredAt).toLocaleDateString("ar-MA")
    ].map(csvCell).join(","));
    const csv = `\uFEFF${headers.map(csvCell).join(",")}\n${lines.join("\n")}`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="second-chance-report-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  }

  const summary = {
    total: rows.length,
    enrolled: rows.filter((row) => row.status === "ENROLLED").length,
    completed: rows.filter((row) => row.status === "COMPLETED").length,
    averageAttendance: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.attendanceRate, 0) / rows.length) : 0,
    highAbsenceRisk: rows.filter((row) => row.absences >= 5).length,
    withDocuments: rows.filter((row) => row.documents > 0).length
  };

  return NextResponse.json({ rows, groups, summary });
}
