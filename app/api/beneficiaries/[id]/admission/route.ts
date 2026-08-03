import { AdmissionDecision, BeneficiaryStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

const clean = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const numberOrNull = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const bounded = (value: unknown, min: number, max: number) => {
  const parsed = numberOrNull(value);
  if (parsed === null) return null;
  return Math.min(max, Math.max(min, parsed));
};

const decisions = new Set(Object.values(AdmissionDecision));

export async function GET(_: Request, { params }: RouteContext) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id },
    include: { admissionAssessment: true }
  });

  if (!beneficiary) {
    return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });
  }

  return NextResponse.json(beneficiary.admissionAssessment);
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const body = await request.json();

    if (body.decision && !decisions.has(body.decision)) {
      return NextResponse.json({ message: "قرار لجنة القبول غير صالح." }, { status: 400 });
    }

    const exists = await prisma.beneficiary.findUnique({ where: { id: params.id } });
    if (!exists) {
      return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });
    }

    const data = {
      interviewDate: body.interviewDate ? new Date(body.interviewDate) : null,
      interviewerName: clean(body.interviewerName),
      interviewSummary: clean(body.interviewSummary),
      motivationLevel: bounded(body.motivationLevel, 0, 5),
      attendanceReadiness: bounded(body.attendanceReadiness, 0, 5),
      arabicScore: bounded(body.arabicScore, 0, 100),
      frenchScore: bounded(body.frenchScore, 0, 100),
      mathematicsScore: bounded(body.mathematicsScore, 0, 100),
      cognitiveScore: bounded(body.cognitiveScore, 0, 100),
      psychologicalSummary: clean(body.psychologicalSummary),
      creativeDigitalInterest: bounded(body.creativeDigitalInterest, 0, 100),
      socialServicesInterest: bounded(body.socialServicesInterest, 0, 100),
      technicalInterest: bounded(body.technicalInterest, 0, 100),
      greenEconomyInterest: bounded(body.greenEconomyInterest, 0, 100),
      culturalAnimationInterest: bounded(body.culturalAnimationInterest, 0, 100),
      vocationalInterestNotes: clean(body.vocationalInterestNotes),
      proposedTrack: clean(body.proposedTrack),
      proposedSpecialty: clean(body.proposedSpecialty),
      orientationReason: clean(body.orientationReason),
      committeeNotes: clean(body.committeeNotes),
      decision: body.decision || AdmissionDecision.PENDING,
      decisionDate: body.decisionDate ? new Date(body.decisionDate) : null
    };

    const assessment = await prisma.admissionAssessment.upsert({
      where: { beneficiaryId: params.id },
      create: { beneficiaryId: params.id, ...data },
      update: data
    });

    const statusByDecision: Partial<Record<AdmissionDecision, BeneficiaryStatus>> = {
      ACCEPTED: BeneficiaryStatus.ACCEPTED,
      WAITLISTED: BeneficiaryStatus.WAITLISTED,
      REJECTED: BeneficiaryStatus.REJECTED,
      NEEDS_REASSESSMENT: BeneficiaryStatus.UNDER_REVIEW,
      PENDING: BeneficiaryStatus.UNDER_REVIEW
    };

    await prisma.beneficiary.update({
      where: { id: params.id },
      data: { status: statusByDecision[assessment.decision] }
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "تعذر حفظ بيانات القبول والتوجيه." },
      { status: 500 }
    );
  }
}
