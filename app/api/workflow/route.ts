import { ActivityCategory, BeneficiaryStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const allowedTransitions: Record<BeneficiaryStatus, BeneficiaryStatus[]> = {
  PRE_REGISTERED: [BeneficiaryStatus.UNDER_REVIEW],
  UNDER_REVIEW: [BeneficiaryStatus.ACCEPTED, BeneficiaryStatus.WAITLISTED, BeneficiaryStatus.REJECTED],
  WAITLISTED: [BeneficiaryStatus.ACCEPTED, BeneficiaryStatus.REJECTED],
  ACCEPTED: [BeneficiaryStatus.ENROLLED],
  REJECTED: [BeneficiaryStatus.UNDER_REVIEW],
  ENROLLED: [BeneficiaryStatus.COMPLETED, BeneficiaryStatus.WITHDRAWN],
  WITHDRAWN: [BeneficiaryStatus.ENROLLED],
  COMPLETED: []
};

const statusLabels: Record<BeneficiaryStatus, string> = {
  PRE_REGISTERED: "التسجيل الأولي",
  UNDER_REVIEW: "دراسة الملف والتشخيص",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "القبول",
  REJECTED: "رفض الملف",
  ENROLLED: "التمدرس والتكوين",
  WITHDRAWN: "الانسحاب",
  COMPLETED: "استكمال البرنامج"
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const beneficiaryId = typeof body.beneficiaryId === "string" ? body.beneficiaryId.trim() : "";
    const actorName = typeof body.actorName === "string" && body.actorName.trim() ? body.actorName.trim() : "مدير المنصة";
    const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;
    const nextStatus = Object.values(BeneficiaryStatus).includes(body.nextStatus)
      ? (body.nextStatus as BeneficiaryStatus)
      : null;

    if (!beneficiaryId || !nextStatus) {
      return NextResponse.json({ message: "المستفيد والمرحلة الجديدة إلزاميان." }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
      select: { id: true, firstName: true, lastName: true, status: true }
    });

    if (!beneficiary) {
      return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });
    }

    if (!allowedTransitions[beneficiary.status].includes(nextStatus)) {
      return NextResponse.json({ message: "هذا الانتقال غير مسموح وفق مسار الملف الحالي." }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.beneficiary.update({ where: { id: beneficiary.id }, data: { status: nextStatus } }),
      prisma.activityLog.create({
        data: {
          beneficiaryId: beneficiary.id,
          category: ActivityCategory.ADMISSION,
          title: `انتقال الملف إلى: ${statusLabels[nextStatus]}`,
          description: note || `تم تغيير وضعية الملف من ${statusLabels[beneficiary.status]} إلى ${statusLabels[nextStatus]}.`,
          actorName,
          referenceType: "BENEFICIARY_WORKFLOW",
          referenceId: beneficiary.id,
          referenceHref: `/beneficiaries/${beneficiary.id}`
        }
      })
    ]);

    return NextResponse.json({ message: "تم تحديث مسار الملف بنجاح.", status: nextStatus });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر تحديث مسار الملف." }, { status: 500 });
  }
}
