import { ActivityCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth-server";
import { canAccessPath } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/session";

type RecordAction = "archive" | "trash" | "restore" | "permanent-delete";

function parseAction(value: unknown): RecordAction | null {
  return value === "archive" || value === "trash" || value === "restore" || value === "permanent-delete"
    ? value
    : null;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ message: "يجب تسجيل الدخول أولًا." }, { status: 401 });

    const body = (await request.json()) as { action?: unknown; reason?: unknown };
    const action = parseAction(body.action);
    const reason = typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 500)
      : null;

    if (!action) return NextResponse.json({ message: "العملية المطلوبة غير صالحة." }, { status: 400 });
    if (!params.id?.trim()) return NextResponse.json({ message: "المستفيد غير محدد." }, { status: 400 });

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

    const isAdmin = isAdminRole(session.role);
    const canManageBeneficiaries = canAccessPath(session.role, "/beneficiaries", "POST");
    const restoringFromTrash = action === "restore" && Boolean(beneficiary.deletedAt);

    if (action === "trash" || action === "permanent-delete" || restoringFromTrash) {
      if (!isAdmin) return NextResponse.json({ message: "هذه العملية محصورة في إدارة المنصة." }, { status: 403 });
    } else if (!canManageBeneficiaries) {
      return NextResponse.json({ message: "ليست لديك صلاحية لإدارة ملفات المستفيدين." }, { status: 403 });
    }

    const actorName = session.fullName;
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
            referenceHref: "/archive",
            metadata: { actorUserId: session.userId, actorRole: session.role }
          }
        }),
        prisma.auditLog.create({
          data: {
            userId: session.userId,
            action: "ARCHIVE_BENEFICIARY",
            entityType: "Beneficiary",
            entityId: beneficiary.id,
            description: `أرشفة ملف ${fullName}${reason ? ` — السبب: ${reason}` : ""}`
          }
        })
      ]);

      return NextResponse.json({ message: "تمت أرشفة المستفيد بنجاح." });
    }

    if (action === "trash") {
      if (beneficiary.deletedAt) return NextResponse.json({ message: "الملف موجود بالفعل في سلة المحذوفات." }, { status: 409 });

      await prisma.$transaction([
        prisma.beneficiary.update({
          where: { id: beneficiary.id },
          data: {
            deletedAt: new Date(),
            deletedReason: reason,
            deletedByName: actorName,
            archivedAt: null,
            archivedReason: null,
            archivedByName: null
          }
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
            referenceHref: "/trash",
            metadata: { actorUserId: session.userId, actorRole: session.role }
          }
        }),
        prisma.auditLog.create({
          data: {
            userId: session.userId,
            action: "TRASH_BENEFICIARY",
            entityType: "Beneficiary",
            entityId: beneficiary.id,
            description: `نقل ملف ${fullName} إلى سلة المحذوفات${reason ? ` — السبب: ${reason}` : ""}`
          }
        })
      ]);

      return NextResponse.json({ message: "تم نقل المستفيد إلى سلة المحذوفات ويمكن استعادته لاحقًا." });
    }

    if (action === "restore") {
      if (!beneficiary.archivedAt && !beneficiary.deletedAt) return NextResponse.json({ message: "الملف نشط بالفعل." }, { status: 409 });

      const source = beneficiary.deletedAt ? "سلة المحذوفات" : "الأرشيف";
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
            description: reason || `تمت إعادة الملف من ${source} إلى قائمة المستفيدين النشطين.`,
            actorName,
            referenceType: "BENEFICIARY_RESTORE",
            referenceId: beneficiary.id,
            referenceHref: `/beneficiaries/${beneficiary.id}`,
            metadata: { actorUserId: session.userId, actorRole: session.role, restoredFrom: source }
          }
        }),
        prisma.auditLog.create({
          data: {
            userId: session.userId,
            action: "RESTORE_BENEFICIARY",
            entityType: "Beneficiary",
            entityId: beneficiary.id,
            description: `استعادة ملف ${fullName} من ${source}${reason ? ` — السبب: ${reason}` : ""}`
          }
        })
      ]);

      return NextResponse.json({ message: "تمت استعادة المستفيد إلى القائمة النشطة." });
    }

    if (!beneficiary.deletedAt) return NextResponse.json({ message: "لا يمكن الحذف النهائي إلا من سلة المحذوفات." }, { status: 409 });
    if (!reason || reason.length < 5) {
      return NextResponse.json({ message: "سبب الحذف النهائي إلزامي ويجب ألا يقل عن خمسة أحرف." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "PERMANENT_DELETE_BENEFICIARY",
          entityType: "Beneficiary",
          entityId: beneficiary.id,
          description: `حذف نهائي لملف ${fullName} (${beneficiary.registrationNumber || beneficiary.id}) — السبب: ${reason}`
        }
      }),
      prisma.beneficiary.delete({ where: { id: beneficiary.id } })
    ]);

    return NextResponse.json({ message: "تم حذف المستفيد نهائيًا من النظام." });
  } catch (error) {
    console.error("Beneficiary record action failed", error);
    return NextResponse.json({ message: "تعذر تنفيذ العملية على ملف المستفيد." }, { status: 500 });
  }
}
