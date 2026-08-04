import { InternshipStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const cleanText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = cleanText(body.id);

    if (!id) {
      return NextResponse.json({ message: "معرف التدريب مطلوب." }, { status: 400 });
    }

    const status = Object.values(InternshipStatus).includes(body.status)
      ? (body.status as InternshipStatus)
      : undefined;

    const internship = await prisma.internship.update({
      where: { id },
      data: {
        status,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        supervisorEvaluation: cleanText(body.supervisorEvaluation),
        finalResult: cleanText(body.finalResult),
        attendanceNotes: cleanText(body.attendanceNotes)
      },
      include: {
        beneficiary: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await prisma.activityLog.create({
      data: {
        beneficiaryId: internship.beneficiaryId,
        category: "INTEGRATION",
        title: "تحديث وضعية الإدماج المهني",
        description: `تم تحديث التدريب لدى ${internship.organizationName} إلى ${internship.status}.`,
        referenceType: "Internship",
        referenceId: internship.id,
        referenceHref: "/integration"
      }
    });

    return NextResponse.json(internship);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر تحديث ملف الإدماج المهني." }, { status: 500 });
  }
}
