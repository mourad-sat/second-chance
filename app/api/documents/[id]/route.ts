import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ message: "يجب تسجيل الدخول أولًا." }, { status: 401 });

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: { beneficiary: { select: { firstName: true, lastName: true } } }
    });
    if (!document) return NextResponse.json({ message: "الوثيقة غير موجودة." }, { status: 404 });

    await prisma.$transaction([
      prisma.document.delete({ where: { id: document.id } }),
      prisma.activityLog.create({
        data: {
          beneficiaryId: document.beneficiaryId,
          category: "DOCUMENT",
          title: "حذف وثيقة",
          description: `${document.title} (${document.fileName})`,
          actorName: session.fullName
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "DOCUMENT_DELETED",
          entityType: "Document",
          entityId: document.id,
          description: `حذف وثيقة ${document.title} للمستفيد ${document.beneficiary.firstName} ${document.beneficiary.lastName}`
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر حذف الوثيقة." }, { status: 500 });
  }
}
