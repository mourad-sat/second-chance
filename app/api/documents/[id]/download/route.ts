import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function safeFileName(value: string) {
  return value.replace(/[\r\n"\\]/g, "_");
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const document = await prisma.document.findUnique({
    where: { id: params.id },
    select: {
      fileName: true,
      mimeType: true,
      data: true,
      storageProvider: true,
      blobUrl: true,
      blobPathname: true
    }
  });

  if (!document) return NextResponse.json({ message: "الوثيقة غير موجودة." }, { status: 404 });

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
      "Cache-Control": "private, no-store"
    }
  });
}
