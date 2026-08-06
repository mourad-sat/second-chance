import { ActivityCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { currentSession } from "@/lib/auth-server";
import { canAccessPath } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type IntelligenceDecisionBody = {
  decision?: unknown;
  note?: unknown;
  recommendation?: unknown;
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await currentSession();
    if (!session) {
      return NextResponse.json({ message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    }
    if (!canAccessPath(session.role, "/intelligence", "POST")) {
      return NextResponse.json({ message: "ليست لديك صلاحية لاعتماد أو رفض التوصيات." }, { status: 403 });
    }

    const beneficiaryId = params.id?.trim();
    if (!beneficiaryId) {
      return NextResponse.json({ message: "معرف المستفيد غير صالح." }, { status: 400 });
    }

    const body = (await request.json()) as IntelligenceDecisionBody;
    const decision = body.decision === "ACCEPTED" || body.decision === "REJECTED" ? body.decision : null;
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) : "";
    const recommendation = typeof body.recommendation === "string"
      ? body.recommendation.trim().slice(0, 3000)
      : "";
    const actorName = session.fullName;

    if (!decision || note.length < 5) {
      return NextResponse.json({ message: "القرار وتعليله إلزاميان، ويجب ألا يقل التعليل عن 5 أحرف." }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiary.findFirst({
      where: { id: beneficiaryId, archivedAt: null, deletedAt: null },
      select: { id: true, firstName: true, lastName: true }
    });
    if (!beneficiary) {
      return NextResponse.json({ message: "المستفيد غير موجود أو غير نشط." }, { status: 404 });
    }

    const label = decision === "ACCEPTED" ? "اعتماد توصية التحليل الذكي" : "رفض توصية التحليل الذكي";
    const reviewedAt = new Date();

    await prisma.$transaction([
      prisma.activityLog.create({
        data: {
          beneficiaryId: beneficiary.id,
          category: ActivityCategory.NOTE,
          title: label,
          description: note,
          actorName,
          referenceType: "INTELLIGENCE_HUMAN_DECISION",
          referenceId: beneficiary.id,
          referenceHref: `/beneficiaries/${beneficiary.id}/intelligence`,
          metadata: {
            decision,
            recommendation,
            reviewedAt: reviewedAt.toISOString(),
            actorUserId: session.userId,
            actorRole: session.role
          }
        }
      }),
      prisma.auditLog.create({
        data: {
          action: decision === "ACCEPTED" ? "ACCEPT_INTELLIGENCE_RECOMMENDATION" : "REJECT_INTELLIGENCE_RECOMMENDATION",
          entityType: "Beneficiary",
          entityId: beneficiary.id,
          description: `${label}: ${beneficiary.firstName} ${beneficiary.lastName} · المنفذ: ${actorName} — ${note}`
        }
      })
    ]);

    return NextResponse.json({ message: "تم تسجيل القرار البشري داخل سجل المستفيد." });
  } catch (error) {
    console.error("Intelligence decision failed", error);
    return NextResponse.json({ message: "تعذر تسجيل القرار." }, { status: 500 });
  }
}
