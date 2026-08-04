import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function safeFileName(value: string) {
  return value.replace(/[\r\n"\\]/g, "_");
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const document = await prisma.document.findUnique({
    where: { id: params.id },
    select: { fileName: true, mimeType: true, data: true }
  });

  if (!document) return NextResponse.json({ message: "الوثيقة غير موجودة." }, { status: 404 });

  return new NextResponse(document.data, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${safeFileName(document.fileName)}"`,
      "Cache-Control": "private, no-store"
    }
  });
}
