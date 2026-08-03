import { AttendanceStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const clean = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export async function GET() {
  const [groups, beneficiaries, recentAttendance] = await Promise.all([
    prisma.learningGroup.findMany({
      where: { isActive: true },
      include: {
        enrollments: {
          include: { beneficiary: true },
          where: { leftAt: null }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.beneficiary.findMany({
      where: { status: { in: ["ACCEPTED", "ENROLLED"] } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    }),
    prisma.attendanceRecord.findMany({
      take: 100,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { beneficiary: true, group: true }
    })
  ]);

  return NextResponse.json({ groups, beneficiaries, recentAttendance });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "createGroup") {
      const name = clean(body.name);
      const academicYear = clean(body.academicYear);
      if (!name || !academicYear) {
        return NextResponse.json({ message: "اسم المجموعة والموسم الدراسي إلزاميان." }, { status: 400 });
      }

      const group = await prisma.learningGroup.create({
        data: {
          name,
          academicYear,
          track: clean(body.track),
          specialty: clean(body.specialty),
          room: clean(body.room),
          facilitator: clean(body.facilitator)
        }
      });
      return NextResponse.json(group, { status: 201 });
    }

    if (body.action === "enroll") {
      if (!body.groupId || !body.beneficiaryId) {
        return NextResponse.json({ message: "المجموعة والمستفيد إلزاميان." }, { status: 400 });
      }
      const enrollment = await prisma.groupEnrollment.upsert({
        where: {
          beneficiaryId_groupId: {
            beneficiaryId: body.beneficiaryId,
            groupId: body.groupId
          }
        },
        update: { leftAt: null },
        create: { beneficiaryId: body.beneficiaryId, groupId: body.groupId }
      });
      await prisma.beneficiary.update({
        where: { id: body.beneficiaryId },
        data: { status: "ENROLLED" }
      });
      return NextResponse.json(enrollment, { status: 201 });
    }

    if (body.action === "record") {
      if (!body.groupId || !body.beneficiaryId || !body.date || !body.status) {
        return NextResponse.json({ message: "بيانات الحضور غير مكتملة." }, { status: 400 });
      }
      if (!Object.values(AttendanceStatus).includes(body.status)) {
        return NextResponse.json({ message: "حالة الحضور غير صالحة." }, { status: 400 });
      }

      const date = new Date(`${body.date}T00:00:00.000Z`);
      const record = await prisma.attendanceRecord.upsert({
        where: {
          beneficiaryId_groupId_date: {
            beneficiaryId: body.beneficiaryId,
            groupId: body.groupId,
            date
          }
        },
        update: {
          status: body.status,
          arrivalTime: clean(body.arrivalTime),
          excuse: clean(body.excuse),
          notes: clean(body.notes)
        },
        create: {
          beneficiaryId: body.beneficiaryId,
          groupId: body.groupId,
          date,
          status: body.status,
          arrivalTime: clean(body.arrivalTime),
          excuse: clean(body.excuse),
          notes: clean(body.notes)
        }
      });
      return NextResponse.json(record, { status: 201 });
    }

    return NextResponse.json({ message: "العملية غير معروفة." }, { status: 400 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "هذه البيانات مسجلة من قبل." }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: "تعذر تنفيذ العملية." }, { status: 500 });
  }
}
