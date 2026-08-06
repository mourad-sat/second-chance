import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth-server";
import { canAccessPath } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/session";

function safeFileName(value: string) {
  return value.replace(/[\r\n"\\]/g, "_").slice(0, 180) || "document";
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    if (!canAccessPath(session.role, "/api/documents", "GET")) {
      return NextResponse.json({ message: "ليست لديك صلاحية لفتح الوثائق." }, { status: 403 });
    }

    const documentId = params.id?.trim();
    if (!documentId) return NextResponse.json({ message: "الوثيقة غير محددة." }, { status: 400 });

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        beneficiaryId: true,
        title: true,
        fileName: true,
        mimeType: true,
        data: true,
        storageProvider: true,
        blobUrl: true,
        blobPathname: true,
        beneficiary: { select: { archivedAt: true, deletedAt: true } }
      }
    });

    if (!document) return NextResponse.json({ message: "الوثيقة غير موجودة." }, { status: 404 });
    if (document.beneficiary.deletedAt && !isAdminRole(session.role)) {
      return NextResponse.json({ message: "فتح وثائق الملفات الموجودة في السلة متاح للإدارة فقط." }, { status: 403 });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "DOCUMENT_OPENED",
        entityType: "Document",
        entityId: document.id,
        description: `فتح وثيقة ${document.title} (${document.fileName}) بواسطة ${session.fullName}`
      }
    }).catch((error) => console.error("Unable to audit document access", error));

    if (document.storageProvider === "VERCEL_BLOB" && (document.blobPathname || document.blobUrl)) {
      const result = await get(document.blobPathname || document.blobUrl!, { access: "private" });
      if (!result || result.statusCode !== 200 || !result.stream) {
        return NextResponse.json({ message: "تعذر العثور على الملف في التخزين الخارجي." }, { status: 404 });
      }

      return new NextResponse(result.stream, {
        headers: {
          "Content-Type": result.blob.contentType || document.mimeType,
          "Content-Disposition": `inline; filename="${safeFileName(document.fileName)}"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "ETag": result.blob.etag
        }
      });
    }

    if (!document.data) {
      return NextResponse.json({ message: "محتوى الوثيقة غير متوفر." }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(document.data), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename="${safeFileName(document.fileName)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("Document download failed", error);
    return NextResponse.json({ message: "تعذر فتح الوثيقة حاليًا." }, { status: 500 });
  }
}
