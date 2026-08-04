import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 10;

function safePathPart(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "غير مسموح." }, { status: 403 });

  const [databaseFiles, blobFiles, totalBytes] = await Promise.all([
    prisma.document.count({ where: { storageProvider: "DATABASE", data: { not: null } } }),
    prisma.document.count({ where: { storageProvider: "VERCEL_BLOB" } }),
    prisma.document.aggregate({ where: { storageProvider: "DATABASE", data: { not: null } }, _sum: { sizeBytes: true } })
  ]);

  return NextResponse.json({
    databaseFiles,
    blobFiles,
    remainingBytes: totalBytes._sum.sizeBytes || 0,
    batchSize: BATCH_SIZE
  });
}

export async function POST() {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ message: "غير مسموح." }, { status: 403 });
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ message: "لم يتم إعداد BLOB_READ_WRITE_TOKEN." }, { status: 503 });
    }

    const documents = await prisma.document.findMany({
      where: { storageProvider: "DATABASE", data: { not: null } },
      select: {
        id: true,
        beneficiaryId: true,
        fileName: true,
        mimeType: true,
        data: true
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE
    });

    let migrated = 0;
    const failures: { id: string; message: string }[] = [];

    for (const document of documents) {
      if (!document.data) continue;
      try {
        const pathname = `beneficiaries/${safePathPart(document.beneficiaryId)}/${safePathPart(document.fileName)}`;
        const blob = await put(pathname, document.data, {
          access: "private",
          addRandomSuffix: true,
          contentType: document.mimeType
        });

        await prisma.document.update({
          where: { id: document.id },
          data: {
            data: null,
            storageProvider: "VERCEL_BLOB",
            blobUrl: blob.url,
            blobPathname: blob.pathname
          }
        });
        migrated += 1;
      } catch (error) {
        failures.push({ id: document.id, message: error instanceof Error ? error.message : "خطأ غير معروف" });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "DOCUMENT_STORAGE_MIGRATION_BATCH",
        entityType: "Document",
        description: `ترحيل ${migrated} وثيقة إلى Vercel Blob، وفشل ${failures.length}`
      }
    });

    const remaining = await prisma.document.count({ where: { storageProvider: "DATABASE", data: { not: null } } });
    return NextResponse.json({ migrated, failed: failures.length, failures, remaining });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر ترحيل الوثائق." }, { status: 500 });
  }
}
