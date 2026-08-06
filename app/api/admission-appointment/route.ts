import { ActivityCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth-server";
import { canAccessPath } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type AppointmentBody = {
  beneficiaryId?: unknown;
  interviewDate?: unknown;
  interviewerName?: unknown;
  location?: unknown;
  note?: unknown;
};

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    if (!canAccessPath(session.role, "/admissions", "POST")) {
      return NextResponse.json({ message: "ليست لديك صلاحية لجدولة المقابلات." }, { status: 403 });
    }

    const body = (await request.json()) as AppointmentBody;
    const beneficiaryId = clean(body.beneficiaryId, 80);
    const interviewerName = clean(body.interviewerName, 120) || session.fullName;
    const location = clean(body.location, 180);
    const note = clean(body.note, 1000);
    const interviewDateText = clean(body.interviewDate, 40);
    const interviewDate = interviewDateText ? new Date(interviewDateText) : null;

    if (!beneficiaryId || !interviewDate || Number.isNaN(interviewDate.getTime())) {
      return NextResponse.json({ message: "المستفيد وتاريخ المقابلة إلزاميان." }, { status: 400 });
    }
    if (interviewDate.getTime() < Date.now() - 5 * 60 * 1000) {
      return NextResponse.json({ message: "لا يمكن تحديد موعد مقابلة في الماضي." }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId, archivedAt: null, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, status: true }
    });
    if (!beneficiary) return NextResponse.json({ message: "المستفيد غير موجود أو غير نشط." }, { status: 404 });

    const summary = [
      location ? `المكان: ${location}` : null,
      note || null
    ].filter(Boolean).join(" — ");

    await prisma.$transaction(async (tx) => {
      await tx.admissionAssessment.upsert({
        where: { beneficiaryId },
        create: {
          beneficiaryId,
          interviewDate,
          interviewerName,
          interviewSummary: summary || null
        },
        update: {
          interviewDate,
          interviewerName,
          interviewSummary: summary || undefined
        }
      });

      await tx.activityLog.create({
        data: {
          beneficiaryId,
          category: ActivityCategory.ADMISSION,
          title: "جدولة مقابلة القبول",
          description: `تم تحديد المقابلة بتاريخ ${interviewDate.toLocaleString("ar-MA")}${location ? ` في ${location}` : ""}.`,
          actorName: session.fullName,
          referenceType: "ADMISSION_APPOINTMENT",
          referenceId: beneficiaryId,
          referenceHref: `/beneficiaries/${beneficiaryId}/workflow`,
          eventDate: new Date(),
          metadata: {
            interviewDate: interviewDate.toISOString(),
            interviewerName,
            location: location || null,
            note: note || null,
            actorUserId: session.userId
          }
        }
      });

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "ADMISSION_APPOINTMENT_SCHEDULED",
          entityType: "Beneficiary",
          entityId: beneficiaryId,
          description: `${beneficiary.firstName} ${beneficiary.lastName}: مقابلة بتاريخ ${interviewDate.toISOString()} · المسؤول: ${interviewerName}${location ? ` · المكان: ${location}` : ""}`
        }
      });
    });

    return NextResponse.json({
      message: "تم حفظ موعد المقابلة بنجاح.",
      appointment: {
        interviewDate: interviewDate.toISOString(),
        interviewerName,
        location: location || null
      }
    });
  } catch (error) {
    console.error("Admission appointment scheduling failed", error);
    return NextResponse.json({ message: "تعذر حفظ موعد المقابلة." }, { status: 500 });
  }
}
