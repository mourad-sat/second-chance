import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth-server";
import { canAccessPath } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/session";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    if (!canAccessPath(session.role, "/api/documents", "DELETE")) {
      return NextResponse.json({ message: "ليست لديك صلاحية لحذف الوثائق." }, { status: 403 });
    }

    const documentId = params.id?.trim();
    if (!documentId) return NextResponse.json({ message: "الوثيقة غير محددة." }, { status: 400 });

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        beneficiary: {
          select: { firstName: true, lastName: true, archivedAt: true, deletedAt: true }
        }
      }
    });
    if (!document) return NextResponse.json({ message: "الوثيقة غير موجودة." }, { status: 404 });

    if ((document.beneficiary.archivedAt || document.beneficiary.deletedAt) && !isAdminRole(session.role)) {
      return NextResponse.json({ message: "حذف وثيقة من ملف مؤرشف أو محذوف متاح للإدارة فقط." }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.document.delete({ where: { id: document.id } }),
      prisma.activityLog.create({
        data: {
          beneficiaryId: document.beneficiaryId,
          category: "DOCUMENT",
          title: "حذف وثيقة",
          description: `${document.title} (${document.fileName})`,
          actorName: session.fullName,
          referenceType: "Document",
          referenceId: document.id,
          referenceHref: `/beneficiaries/${document.beneficiaryId}/documents`,
          metadata: { actorUserId: session.userId, actorRole: session.role, storageProvider: document.storageProvider }
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "DOCUMENT_DELETED",
          entityType: "Document",
          entityId: document.id,
          description: `حذف وثيقة ${document.title} للمستفيد ${document.beneficiary.firstName} ${document.beneficiary.lastName} بواسطة ${session.fullName}`
        }
      })
    ]);

    if (document.storageProvider === "VERCEL_BLOB" && document.blobUrl) {
      try {
        await del(document.blobUrl);
      } catch (blobError) {
        console.error("Document metadata deleted but blob cleanup failed", {
          documentId: document.id,
          blobUrl: document.blobUrl,
          error: blobError
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document deletion failed", error);
    return NextResponse.json({ message: "تعذر حذف الوثيقة." }, { status: 500 });
  }
}
