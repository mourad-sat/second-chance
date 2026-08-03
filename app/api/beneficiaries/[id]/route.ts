import { BeneficiaryStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const clean = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const cleanInteger = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

const allowedStatuses = new Set(Object.values(BeneficiaryStatus));

type RouteContext = { params: { id: string } };

export async function GET(_: Request, { params }: RouteContext) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id }
  });

  if (!beneficiary) {
    return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });
  }

  return NextResponse.json(beneficiary);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const body = await request.json();
    const firstName = clean(body.firstName);
    const lastName = clean(body.lastName);

    if (!firstName || !lastName) {
      return NextResponse.json(
        { message: "الاسم الشخصي والاسم العائلي إلزاميان." },
        { status: 400 }
      );
    }

    if (body.status && !allowedStatuses.has(body.status)) {
      return NextResponse.json({ message: "وضعية المستفيد غير صالحة." }, { status: 400 });
    }

    const householdSize = cleanInteger(body.householdSize);
    const dropoutYear = cleanInteger(body.dropoutYear);

    if (body.householdSize && householdSize === null) {
      return NextResponse.json({ message: "عدد أفراد الأسرة غير صالح." }, { status: 400 });
    }

    if (body.dropoutYear && dropoutYear === null) {
      return NextResponse.json({ message: "سنة الانقطاع غير صالحة." }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiary.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        identityNumber: clean(body.identityNumber),
        phone: clean(body.phone),
        guardianPhone: clean(body.guardianPhone),
        address: clean(body.address),
        lastEducationLevel: clean(body.lastEducationLevel),
        status: body.status || BeneficiaryStatus.PRE_REGISTERED,

        familySituation: clean(body.familySituation),
        guardianName: clean(body.guardianName),
        guardianRelationship: clean(body.guardianRelationship),
        householdSize,
        familyIncomeSituation: clean(body.familyIncomeSituation),
        housingSituation: clean(body.housingSituation),
        socialCoverage: clean(body.socialCoverage),

        lastSchoolName: clean(body.lastSchoolName),
        dropoutYear,
        dropoutReasons: clean(body.dropoutReasons),
        learningDifficulties: clean(body.learningDifficulties),
        specialNeeds: clean(body.specialNeeds),

        diagnosticSummary: clean(body.diagnosticSummary),
        strengths: clean(body.strengths),
        priorityNeeds: clean(body.priorityNeeds),
        supportPlan: clean(body.supportPlan),
        careerGoal: clean(body.careerGoal),
        followUpNotes: clean(body.followUpNotes)
      }
    });

    return NextResponse.json(beneficiary);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "رقم البطاقة الوطنية أو مسار مسجل من قبل." },
          { status: 409 }
        );
      }
    }

    console.error(error);
    return NextResponse.json({ message: "تعذر تحديث الملف." }, { status: 500 });
  }
}
