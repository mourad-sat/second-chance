import { SupportPlanPriority, SupportPlanStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

const clean = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const priorities = new Set(Object.values(SupportPlanPriority));
const statuses = new Set(Object.values(SupportPlanStatus));

function progress(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

export async function GET(_: Request, { params }: RouteContext) {
  const plans = await prisma.academicSupportPlan.findMany({
    where: { beneficiaryId: params.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  return NextResponse.json(plans);
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const body = await request.json();
    const difficulty = clean(body.difficulty);
    const objective = clean(body.objective);
    const intervention = clean(body.intervention);

    if (!difficulty || !objective || !intervention) {
      return NextResponse.json(
        { message: "الصعوبة والهدف والتدخل حقول إلزامية." },
        { status: 400 }
      );
    }

    const beneficiary = await prisma.beneficiary.findUnique({ where: { id: params.id } });
    if (!beneficiary) {
      return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });
    }

    const priority = priorities.has(body.priority)
      ? body.priority as SupportPlanPriority
      : SupportPlanPriority.NORMAL;
    const status = statuses.has(body.status)
      ? body.status as SupportPlanStatus
      : SupportPlanStatus.PLANNED;

    const plan = await prisma.academicSupportPlan.create({
      data: {
        beneficiaryId: params.id,
        difficulty,
        objective,
        intervention,
        responsibleName: clean(body.responsibleName),
        priority,
        status,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : null,
        progressPercent: progress(body.progressPercent),
        successIndicator: clean(body.successIndicator),
        observations: clean(body.observations),
        outcome: clean(body.outcome)
      }
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر إنشاء خطة الدعم." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const body = await request.json();
    const planId = clean(body.planId);
    if (!planId) {
      return NextResponse.json({ message: "معرف خطة الدعم مطلوب." }, { status: 400 });
    }

    const existing = await prisma.academicSupportPlan.findFirst({
      where: { id: planId, beneficiaryId: params.id }
    });
    if (!existing) {
      return NextResponse.json({ message: "خطة الدعم غير موجودة." }, { status: 404 });
    }

    const plan = await prisma.academicSupportPlan.update({
      where: { id: planId },
      data: {
        status: statuses.has(body.status) ? body.status as SupportPlanStatus : existing.status,
        priority: priorities.has(body.priority) ? body.priority as SupportPlanPriority : existing.priority,
        progressPercent: progress(body.progressPercent),
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : null,
        observations: clean(body.observations),
        outcome: clean(body.outcome)
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر تحديث خطة الدعم." }, { status: 500 });
  }
}
