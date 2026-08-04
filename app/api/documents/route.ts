import { DocumentCategory } from "@prisma/client";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const categories = Object.values(DocumentCategory);

function safePathPart(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
}

export async function GET(request: Request) {
  const beneficiaryId = new URL(request.url).searchParams.get("beneficiaryId");
  if (!beneficiaryId) return NextResponse.json({ message: "المستفيد غير محدد." }, { status: 400 });

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
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  let uploadedBlobUrl: string | null = null;

  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ message: "يجب تسجيل الدخول أولًا." }, { status: 401 });

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ message: "لم يتم إعداد مخزن Vercel Blob بعد." }, { status: 503 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const beneficiaryId = String(form.get("beneficiaryId") || "").trim();
    const title = String(form.get("title") || "").trim();
    const notes = String(form.get("notes") || "").trim() || null;
    const categoryValue = String(form.get("category") || "OTHER");
    const category = categories.includes(categoryValue as DocumentCategory) ? categoryValue as DocumentCategory : DocumentCategory.OTHER;

    if (!beneficiaryId || !title || !(file instanceof File)) {
      return NextResponse.json({ message: "المستفيد والعنوان والملف حقول إلزامية." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ message: "يسمح فقط بملفات PDF وصور PNG وJPG وWEBP." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "حجم الملف يجب ألا يتجاوز 4 ميغابايت في الرفع عبر الخادم." }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
      select: { id: true, firstName: true, lastName: true }
    });
    if (!beneficiary) return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });

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
          referenceHref: `/beneficiaries/${beneficiaryId}/documents`
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "DOCUMENT_UPLOADED_TO_BLOB",
          entityType: "Document",
          entityId: document.id,
          description: `رفع وثيقة ${title} للمستفيد ${beneficiary.firstName} ${beneficiary.lastName} إلى Vercel Blob`
        }
      })
    ]);

    return NextResponse.json({ id: document.id }, { status: 201 });
  } catch (error) {
    console.error(error, uploadedBlobUrl ? `Orphan blob may require cleanup: ${uploadedBlobUrl}` : "");
    return NextResponse.json({ message: "تعذر رفع الوثيقة إلى التخزين الخارجي." }, { status: 500 });
  }
}
