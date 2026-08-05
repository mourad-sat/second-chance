import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_BATCH_SIZE = 100;

type BulkAction = "archive" | "trash";
type RequestBody = {
  ids?: unknown;
  action?: unknown;
  reason?: unknown;
  actorName?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const rawIds: unknown[] = Array.isArray(body.ids) ? body.ids : [];
    const ids: string[] = Array.from(
      new Set(
        rawIds
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
      )
    );
    const action: BulkAction | null = body.action === "archive" || body.action === "trash" ? body.action : null;
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : null;
    const actorName = typeof body.actorName === "string" && body.actorName.trim() ? body.actorName.trim() : "إدارة المنصة";

    if (!ids.length) return NextResponse.json({ message: "لم يتم تحديد أي مستفيد." }, { status: 400 });
    if (ids.length > MAX_BATCH_SIZE) return NextResponse.json({ message: `الحد الأقصى للعملية الواحدة هو ${MAX_BATCH_SIZE} ملف.` }, { status: 400 });
    if (!action) return NextResponse.json({ message: "العملية الجماعية غير صالحة." }, { status: 400 });

    const beneficiaries = await prisma.beneficiary.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, registrationNumber: true }
    });

    if (!beneficiaries.length) return NextResponse.json({ message: "لا توجد ملفات صالحة لتنفيذ العملية." }, { status: 404 });

    const validIds: string[] = beneficiaries.map((item) => item.id);
    const now = new Date();
    const isArchive = action === "archive";

    await prisma.$transaction([
      prisma.beneficiary.updateMany({
        where: { id: { in: validIds } },
        data: isArchive
          ? { archivedAt: now, archivedReason: reason, archivedByName: actorName }
          : { deletedAt: now, deletedReason: reason, deletedByName: actorName, archivedAt: null, archivedReason: null, archivedByName: null }
      }),
      prisma.auditLog.createMany({
        data: beneficiaries.map((item) => ({
          action: isArchive ? "BULK_ARCHIVE_BENEFICIARY" : "BULK_TRASH_BENEFICIARY",
          entityType: "Beneficiary",
          entityId: item.id,
          description: `${isArchive ? "أرشفة جماعية" : "إرسال جماعي إلى السلة"}: ${item.firstName} ${item.lastName} (${item.registrationNumber || item.id})${reason ? ` — السبب: ${reason}` : ""}`
        }))
      })
    ]);

    return NextResponse.json({
      message: isArchive ? `تمت أرشفة ${validIds.length} ملف بنجاح.` : `تم إرسال ${validIds.length} ملف إلى سلة المحذوفات.`,
      processed: validIds.length
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر تنفيذ العملية الجماعية." }, { status: 500 });
  }
}
