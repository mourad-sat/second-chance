import { DocumentCategory } from "@prisma/client";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth-server";
import { canAccessPath } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_TITLE_LENGTH = 160;
const MAX_NOTES_LENGTH = 1000;
const MAX_FILE_NAME_LENGTH = 180;
const ALLOWED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const categories = Object.values(DocumentCategory);

function safePathPart(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
}

function hasDocumentAccess(role: string, method: string) {
  return canAccessPath(role, "/api/documents", method);
}

export async function GET(request: Request) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    if (!hasDocumentAccess(session.role, "GET")) return NextResponse.json({ message: "ليست لديك صلاحية لعرض الوثائق." }, { status: 403 });

    const beneficiaryId = new URL(request.url).searchParams.get("beneficiaryId")?.trim();
    if (!beneficiaryId) return NextResponse.json({ message: "المستفيد غير محدد." }, { status: 400 });

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
      select: { id: true, archivedAt: true, deletedAt: true }
    });
    if (!beneficiary) return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });

    const documents = await prisma.document.findMany({
      where: { beneficiaryId },
      select: {
        id: true,
        title: true,
        category: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        notes: true,
        uploadedByName: true,
        storageProvider: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" },
      take: 200
    });

    return NextResponse.json({ documents, archived: Boolean(beneficiary.archivedAt), deleted: Boolean(beneficiary.deletedAt) });
  } catch (error) {
    console.error("Document listing failed", error);
    return NextResponse.json({ message: "تعذر تحميل الوثائق." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let uploadedBlobUrl: string | null = null;

  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    if (!hasDocumentAccess(session.role, "POST")) return NextResponse.json({ message: "ليست لديك صلاحية لرفع الوثائق." }, { status: 403 });

    const form = await request.formData();
    const file = form.get("file");
    const beneficiaryId = String(form.get("beneficiaryId") || "").trim();
    const title = String(form.get("title") || "").trim();
    const notesValue = String(form.get("notes") || "").trim();
    const notes = notesValue || null;
    const categoryValue = String(form.get("category") || "OTHER");
    const category = categories.includes(categoryValue as DocumentCategory) ? categoryValue as DocumentCategory : DocumentCategory.OTHER;

    if (!beneficiaryId || !title || !(file instanceof File)) {
      return NextResponse.json({ message: "المستفيد والعنوان والملف حقول إلزامية." }, { status: 400 });
    }
    if (title.length > MAX_TITLE_LENGTH || notesValue.length > MAX_NOTES_LENGTH) {
      return NextResponse.json({ message: "عنوان الوثيقة أو الملاحظات أطول من الحد المسموح." }, { status: 400 });
    }
    if (!file.name || file.name.length > MAX_FILE_NAME_LENGTH) {
      return NextResponse.json({ message: "اسم الملف غير صالح أو طويل جدًا." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ message: "يسمح فقط بملفات PDF وصور PNG وJPG وWEBP." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "حجم الملف يجب ألا يتجاوز 4 ميغابايت في الرفع عبر الخادم." }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
      select: { id: true, firstName: true, lastName: true, archivedAt: true, deletedAt: true }
    });
    if (!beneficiary) return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });
    if (beneficiary.archivedAt || beneficiary.deletedAt) {
      return NextResponse.json({ message: "لا يمكن رفع وثائق إلى ملف مؤرشف أو موجود في سلة المحذوفات." }, { status: 409 });
    }

    const pathname = `beneficiaries/${safePathPart(beneficiaryId)}/${safePathPart(file.name)}`;
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: file.type
    });
    uploadedBlobUrl = blob.url;

    const document = await prisma.document.create({
      data: {
        beneficiaryId,
        title,
        category,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        data: null,
        storageProvider: "VERCEL_BLOB",
        blobUrl: blob.url,
        blobPathname: blob.pathname,
        notes,
        uploadedById: session.userId,
        uploadedByName: session.fullName
      }
    });

    await prisma.$transaction([
      prisma.activityLog.create({
        data: {
          beneficiaryId,
          category: "DOCUMENT",
          title: "رفع وثيقة إلى التخزين الخارجي",
          description: `${title} (${file.name})`,
          actorName: session.fullName,
          referenceType: "Document",
          referenceId: document.id,
          referenceHref: `/beneficiaries/${beneficiaryId}/documents`,
          metadata: { actorUserId: session.userId, actorRole: session.role, mimeType: file.type, sizeBytes: file.size }
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "DOCUMENT_UPLOADED_TO_BLOB",
          entityType: "Document",
          entityId: document.id,
          description: `رفع وثيقة ${title} للمستفيد ${beneficiary.firstName} ${beneficiary.lastName} إلى Vercel Blob بواسطة ${session.fullName}`
        }
      })
    ]);

    return NextResponse.json({ id: document.id }, { status: 201 });
  } catch (error) {
    console.error("Document upload failed", error, uploadedBlobUrl ? `Orphan blob may require cleanup: ${uploadedBlobUrl}` : "");
    return NextResponse.json({ message: "تعذر رفع الوثيقة إلى التخزين الخارجي. تحقق من اتصال Blob وأعد المحاولة." }, { status: 500 });
  }
}
