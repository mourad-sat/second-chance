import { ActivityCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : null;
    const actorName = typeof body.actorName === "string" && body.actorName.trim() ? body.actorName.trim() : "إدارة المنصة";

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        registrationNumber: true,
        archivedAt: true,
        deletedAt: true
      }
    });

    if (!beneficiary) return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });

    const fullName = `${beneficiary.firstName} ${beneficiary.lastName}`;

    if (action === "archive") {
      if (beneficiary.deletedAt) return NextResponse.json({ message: "لا يمكن أرشفة ملف موجود في سلة المحذوفات." }, { status: 409 });
      if (beneficiary.archivedAt) return NextResponse.json({ message: "هذا المستفيد مؤرشف بالفعل." }, { status: 409 });

      await prisma.$transaction([
        prisma.beneficiary.update({
          where: { id: beneficiary.id },
          data: { archivedAt: new Date(), archivedReason: reason, archivedByName: actorName }
        }),
        prisma.activityLog.create({
          data: {
            beneficiaryId: beneficiary.id,
            category: ActivityCategory.NOTE,
            title: "أرشفة ملف المستفيد",
            description: reason || "تم نقل الملف إلى الأرشيف الإداري.",
            actorName,
            referenceType: "BENEFICIARY_ARCHIVE",
            referenceId: beneficiary.id,
            referenceHref: `/archive`
          }
        }),
        prisma.auditLog.create({
          data: { action: "ARCHIVE_BENEFICIARY", entityType: "Beneficiary", entityId: beneficiary.id, description: `أرشفة ملف ${fullName}${reason ? ` — السبب: ${reason}` : ""}` }
        })
      ]);

      return NextResponse.json({ message: "تمت أرشفة المستفيد بنجاح." });
    }

    if (action === "trash" || action === "delete") {
      if (beneficiary.deletedAt) return NextResponse.json({ message: "الملف موجود بالفعل في سلة المحذوفات." }, { status: 409 });

      await prisma.$transaction([
        prisma.beneficiary.update({
          where: { id: beneficiary.id },
          data: { deletedAt: new Date(), deletedReason: reason, deletedByName: actorName }
        }),
        prisma.activityLog.create({
          data: {
            beneficiaryId: beneficiary.id,
            category: ActivityCategory.NOTE,
            title: "نقل الملف إلى سلة المحذوفات",
            description: reason || "تم حذف الملف حذفًا منطقيًا ويمكن استعادته.",
            actorName,
            referenceType: "BENEFICIARY_TRASH",
            referenceId: beneficiary.id,
            referenceHref: `/trash`
          }
        }),
        prisma.auditLog.create({
          data: { action: "TRASH_BENEFICIARY", entityType: "Beneficiary", entityId: beneficiary.id, description: `نقل ملف ${fullName} إلى سلة المحذوفات${reason ? ` — السبب: ${reason}` : ""}` }
        })
      ]);

      return NextResponse.json({ message: "تم نقل المستفيد إلى سلة المحذوفات ويمكن استعادته لاحقًا." });
    }

    if (action === "restore") {
      if (!beneficiary.archivedAt && !beneficiary.deletedAt) return NextResponse.json({ message: "الملف نشط بالفعل." }, { status: 409 });

      await prisma.$transaction([
        prisma.beneficiary.update({
          where: { id: beneficiary.id },
          data: {
            archivedAt: null,
            archivedReason: null,
            archivedByName: null,
            deletedAt: null,
            deletedReason: null,
            deletedByName: null
          }
        }),
        prisma.activityLog.create({
          data: {
            beneficiaryId: beneficiary.id,
            category: ActivityCategory.NOTE,
            title: "استعادة ملف المستفيد",
            description: reason || "تمت إعادة الملف إلى قائمة المستفيدين النشطين.",
            actorName,
            referenceType: "BENEFICIARY_RESTORE",
            referenceId: beneficiary.id,
            referenceHref: `/beneficiaries/${beneficiary.id}`
          }
        }),
        prisma.auditLog.create({
          data: { action: "RESTORE_BENEFICIARY", entityType: "Beneficiary", entityId: beneficiary.id, description: `استعادة ملف ${fullName}` }
        })
      ]);

      return NextResponse.json({ message: "تمت استعادة المستفيد إلى القائمة النشطة." });
    }

    if (action === "permanent-delete") {
      if (!beneficiary.deletedAt) return NextResponse.json({ message: "لا يمكن الحذف النهائي إلا من سلة المحذوفات." }, { status: 409 });

      await prisma.$transaction([
        prisma.auditLog.create({
          data: { action: "PERMANENT_DELETE_BENEFICIARY", entityType: "Beneficiary", entityId: beneficiary.id, description: `حذف نهائي لملف ${fullName} (${beneficiary.registrationNumber || beneficiary.id})${reason ? ` — السبب: ${reason}` : ""}` }
        }),
        prisma.beneficiary.delete({ where: { id: beneficiary.id } })
      ]);

      return NextResponse.json({ message: "تم حذف المستفيد نهائيًا من النظام." });
    }

    return NextResponse.json({ message: "العملية المطلوبة غير صالحة." }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر تنفيذ العملية على ملف المستفيد." }, { status: 500 });
  }
}
