import { ActivityCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const decision = body.decision === "ACCEPTED" || body.decision === "REJECTED" ? body.decision : null;
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const recommendation = typeof body.recommendation === "string" ? body.recommendation.trim() : "";
    const actorName = typeof body.actorName === "string" && body.actorName.trim() ? body.actorName.trim() : "مسؤول الملف";

    if (!decision || note.length < 5) return NextResponse.json({ message: "القرار وتعليله إلزاميان." }, { status: 400 });

    const beneficiary = await prisma.beneficiary.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!beneficiary) return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });

    const label = decision === "ACCEPTED" ? "اعتماد توصية التحليل الذكي" : "رفض توصية التحليل الذكي";
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
          metadata: { decision, recommendation, reviewedAt: new Date().toISOString() }
        }
      }),
      prisma.auditLog.create({
        data: {
          action: decision === "ACCEPTED" ? "ACCEPT_INTELLIGENCE_RECOMMENDATION" : "REJECT_INTELLIGENCE_RECOMMENDATION",
          entityType: "Beneficiary",
          entityId: beneficiary.id,
          description: `${label}: ${beneficiary.firstName} ${beneficiary.lastName} — ${note}`
        }
      })
    ]);

    return NextResponse.json({ message: "تم تسجيل القرار البشري داخل سجل المستفيد." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر تسجيل القرار." }, { status: 500 });
  }
}
