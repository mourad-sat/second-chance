import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth-server";
import { canAccessPath } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type ExportFormat = "CSV" | "PRINT";

export async function POST(request: Request) {
  try {
    const session = await currentSession();
    if (!session) return NextResponse.json({ message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    if (!canAccessPath(session.role, "/reports", "GET")) {
      return NextResponse.json({ message: "ليست لديك صلاحية لتصدير التقارير." }, { status: 403 });
    }

    const body = (await request.json()) as { format?: unknown };
    const format: ExportFormat | null = body.format === "CSV" || body.format === "PRINT" ? body.format : null;
    if (!format) return NextResponse.json({ message: "صيغة التصدير غير صالحة." }, { status: 400 });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: format === "CSV" ? "EXECUTIVE_REPORT_EXPORTED" : "EXECUTIVE_REPORT_PRINTED",
        entityType: "Report",
        entityId: "executive-report",
        description: `${format === "CSV" ? "تصدير" : "طباعة"} التقرير التنفيذي بواسطة ${session.fullName} (${session.role})`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unable to audit executive report export", error);
    return NextResponse.json({ message: "تعذر تسجيل عملية التصدير." }, { status: 500 });
  }
}
