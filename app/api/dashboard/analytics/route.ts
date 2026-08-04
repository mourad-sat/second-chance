import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

    const [attendance, supportPlans, internships, skillEvaluations, groups] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { date: { gte: fourteenDaysAgo } },
        select: { date: true, status: true }
      }),
      prisma.academicSupportPlan.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.internship.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.skillEvaluation.groupBy({ by: ["level"], _count: { _all: true } }),
      prisma.learningGroup.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          track: true,
          specialty: true,
          enrollments: { where: { leftAt: null }, select: { id: true } },
          attendance: { where: { date: { gte: fourteenDaysAgo } }, select: { status: true } }
        },
        orderBy: { name: "asc" },
        take: 8
      })
    ]);

    const attendanceMap = new Map<string, { present: number; total: number }>();
    for (let index = 0; index < 14; index += 1) {
      const date = new Date(fourteenDaysAgo);
      date.setDate(date.getDate() + index);
      attendanceMap.set(dayKey(date), { present: 0, total: 0 });
    }

    for (const record of attendance) {
      const item = attendanceMap.get(dayKey(record.date));
      if (!item) continue;
      item.total += 1;
      if (["PRESENT", "LATE"].includes(record.status)) item.present += 1;
    }

    const attendanceTrend = Array.from(attendanceMap.entries()).map(([date, item]) => ({
      date,
      rate: item.total ? Math.round((item.present / item.total) * 100) : 0,
      total: item.total
    }));

    const groupPerformance = groups.map((group) => {
      const total = group.attendance.length;
      const present = group.attendance.filter((item) => ["PRESENT", "LATE"].includes(item.status)).length;
      return {
        id: group.id,
        name: group.name,
        pathway: group.specialty || group.track || "غير محدد",
        beneficiaries: group.enrollments.length,
        attendanceRate: total ? Math.round((present / total) * 100) : 0
      };
    }).sort((a, b) => b.attendanceRate - a.attendanceRate);

    return NextResponse.json({
      attendanceTrend,
      supportPlans: Object.fromEntries(supportPlans.map((item) => [item.status, item._count._all])),
      internships: Object.fromEntries(internships.map((item) => [item.status, item._count._all])),
      skills: Object.fromEntries(skillEvaluations.map((item) => [item.level, item._count._all])),
      groupPerformance,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Dashboard analytics failed", error);
    return NextResponse.json({ message: "تعذر تحميل تحليلات لوحة القيادة." }, { status: 500 });
  }
}
