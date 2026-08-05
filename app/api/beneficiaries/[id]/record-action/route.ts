import { ActivityCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ARCHIVE_REFERENCE = "BENEFICIARY_ARCHIVE";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : null;
    const actorName = typeof body.actorName === "string" && body.actorName.trim() ? body.actorName.trim() : "إدارة المنصة";

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: params.id },
      select: { id: true, firstName: true, lastName: true, registrationNumber: true }
    });

    if (!beneficiary) {
      return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });
    }

    if (action === "archive") {
      const alreadyArchived = await prisma.activityLog.findFirst({
        where: { beneficiaryId: beneficiary.id, referenceType: ARCHIVE_REFERENCE }
      });

      if (alreadyArchived) {
        return NextResponse.json({ message: "هذا المستفيد مؤرشف بالفعل." }, { status: 409 });
      }

      await prisma.$transaction([
        prisma.activityLog.create({
          data: {
            beneficiaryId: beneficiary.id,
            category: ActivityCategory.NOTE,
            title: "أرشفة ملف المستفيد",
            description: reason || "تم نقل الملف إلى الأرشيف الإداري.",
            actorName,
            referenceType: ARCHIVE_REFERENCE,
            referenceId: beneficiary.id,
            referenceHref: `/beneficiaries/${beneficiary.id}`,
            metadata: { reason, previousRegistrationNumber: beneficiary.registrationNumber }
          }
        }),
        prisma.auditLog.create({
          data: {
            action: "ARCHIVE_BENEFICIARY",
            entityType: "Beneficiary",
            entityId: beneficiary.id,
            description: `أرشفة ملف ${beneficiary.firstName} ${beneficiary.lastName}${reason ? ` — السبب: ${reason}` : ""}`
          }
        })
      ]);

      return NextResponse.json({ message: "تمت أرشفة المستفيد بنجاح." });
    }

    if (action === "delete") {
      await prisma.$transaction([
        prisma.auditLog.create({
          data: {
            action: "DELETE_BENEFICIARY",
            entityType: "Beneficiary",
            entityId: beneficiary.id,
            description: `حذف نهائي لملف ${beneficiary.firstName} ${beneficiary.lastName} (${beneficiary.registrationNumber || beneficiary.id})${reason ? ` — السبب: ${reason}` : ""}`
          }
        }),
        prisma.beneficiary.delete({ where: { id: beneficiary.id } })
      ]);

      return NextResponse.json({ message: "تم حذف المستفيد وجميع بياناته المرتبطة نهائيًا." });
    }

    return NextResponse.json({ message: "العملية المطلوبة غير صالحة." }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر تنفيذ العملية على ملف المستفيد." }, { status: 500 });
  }
}
