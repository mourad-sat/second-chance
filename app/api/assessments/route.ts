import { AssessmentType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const allowedTypes = new Set(Object.values(AssessmentType));
const clean = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;

export async function GET() {
  const assessments = await prisma.academicAssessment.findMany({
    include: { group: true, results: true },
    orderBy: { assessmentDate: "desc" }
  });
  return NextResponse.json(assessments);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = clean(body.title);
    const subject = clean(body.subject);
    const groupId = clean(body.groupId);
    const maxScore = Number(body.maxScore || 20);

    if (!title || !subject || !groupId || !body.assessmentDate) {
      return NextResponse.json({ message: "العنوان والمادة والمجموعة والتاريخ إلزامية." }, { status: 400 });
    }
    if (!allowedTypes.has(body.type)) {
      return NextResponse.json({ message: "نوع التقويم غير صالح." }, { status: 400 });
    }
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      return NextResponse.json({ message: "النقطة القصوى غير صالحة." }, { status: 400 });
    }

    const assessment = await prisma.academicAssessment.create({
      data: {
        groupId,
        title,
        subject,
        type: body.type,
        assessmentDate: new Date(body.assessmentDate),
        maxScore
      }
    });
    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر إنشاء التقويم." }, { status: 500 });
  }
}
