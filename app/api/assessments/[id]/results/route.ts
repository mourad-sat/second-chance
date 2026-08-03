import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const body = await request.json();
    const assessment = await prisma.academicAssessment.findUnique({ where: { id: params.id } });
    if (!assessment) return NextResponse.json({ message: "التقويم غير موجود." }, { status: 404 });

    const results = Array.isArray(body.results) ? body.results : [];
    await prisma.$transaction(results.map((item: any) => {
      const score = item.score === "" || item.score == null ? null : Number(item.score);
      if (score !== null && (!Number.isFinite(score) || score < 0 || score > assessment.maxScore)) {
        throw new Error("INVALID_SCORE");
      }
      return prisma.academicResult.upsert({
        where: { assessmentId_beneficiaryId: { assessmentId: params.id, beneficiaryId: item.beneficiaryId } },
        update: { score, competencyLevel: item.competencyLevel || null, notes: item.notes || null },
        create: { assessmentId: params.id, beneficiaryId: item.beneficiaryId, score, competencyLevel: item.competencyLevel || null, notes: item.notes || null }
      });
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_SCORE") {
      return NextResponse.json({ message: "إحدى النقط خارج المجال المسموح." }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ message: "تعذر حفظ النتائج." }, { status: 500 });
  }
}
