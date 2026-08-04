import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clean(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function optionalInt(value: unknown, min: number, max: number) {
  const text = clean(value, 20);
  if (!text) return null;
  const number = Number(text);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = clean(body.firstName, 80);
    const lastName = clean(body.lastName, 80);
    const phone = clean(body.phone, 30);
    const guardianPhone = clean(body.guardianPhone, 30) || null;
    const identityNumber = clean(body.identityNumber, 50).toUpperCase() || null;
    const address = clean(body.address, 300) || null;
    const lastEducationLevel = clean(body.lastEducationLevel, 120) || null;
    const lastSchoolName = clean(body.lastSchoolName, 180) || null;
    const dropoutReasons = clean(body.dropoutReasons, 800) || null;
    const learningDifficulties = clean(body.learningDifficulties, 600) || null;
    const specialNeeds = clean(body.specialNeeds, 600) || null;
    const priorityNeeds = clean(body.priorityNeeds, 800) || null;
    const familySituation = clean(body.familySituation, 120) || null;
    const guardianName = clean(body.guardianName, 120) || null;
    const guardianRelationship = clean(body.guardianRelationship, 100) || null;
    const familyIncomeSituation = clean(body.familyIncomeSituation, 160) || null;
    const housingSituation = clean(body.housingSituation, 160) || null;
    const socialCoverage = clean(body.socialCoverage, 160) || null;
    const previousProgram = clean(body.previousProgram, 20) || "غير محدد";
    const careerChoice1 = clean(body.careerChoice1, 180);
    const careerChoice2 = clean(body.careerChoice2, 180) || null;
    const careerDescription = clean(body.careerGoal, 600) || null;
    const careerGoal = [careerChoice1, careerChoice2, careerDescription].filter(Boolean).join(" | ") || null;
    const birthDateValue = clean(body.birthDate, 30);
    const consent = body.consent === true;
    const currentYear = new Date().getFullYear();
    const dropoutYear = optionalInt(body.dropoutYear, 1990, currentYear);
    const householdSize = optionalInt(body.householdSize, 1, 30);

    if (!firstName || !lastName || !phone || !birthDateValue || !address || !lastEducationLevel || !dropoutReasons || !careerChoice1) {
      return NextResponse.json({ message: "يرجى تعبئة جميع الحقول الإلزامية المميزة بعلامة *." }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ message: "يجب الموافقة على معالجة البيانات لإرسال الطلب." }, { status: 400 });
    }

    const birthDate = new Date(birthDateValue);
    if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
      return NextResponse.json({ message: "تاريخ الازدياد غير صالح." }, { status: 400 });
    }

    const age = Math.floor((Date.now() - birthDate.getTime()) / 31557600000);
    if (age < 8 || age > 40) {
      return NextResponse.json({ message: "يرجى التأكد من تاريخ الازدياد المدخل." }, { status: 400 });
    }

    if (identityNumber) {
      const duplicate = await prisma.beneficiary.findUnique({ where: { identityNumber }, select: { id: true } });
      if (duplicate) {
        return NextResponse.json({ message: "يوجد طلب مسجل مسبقًا بهذا الرقم الوطني." }, { status: 409 });
      }
    }

    const recentDuplicate = await prisma.beneficiary.findFirst({
      where: {
        firstName: { equals: firstName, mode: "insensitive" },
        lastName: { equals: lastName, mode: "insensitive" },
        birthDate,
        phone
      },
      select: { id: true }
    });
    if (recentDuplicate) {
      return NextResponse.json({ message: "يبدو أن طلبًا مطابقًا سبق تسجيله بهذه البيانات." }, { status: 409 });
    }

    const beneficiary = await prisma.beneficiary.create({
      data: {
        firstName,
        lastName,
        birthDate,
        identityNumber,
        phone,
        guardianPhone,
        address,
        lastEducationLevel,
        familySituation,
        guardianName,
        guardianRelationship,
        householdSize,
        familyIncomeSituation,
        housingSituation,
        socialCoverage,
        lastSchoolName,
        dropoutYear,
        dropoutReasons,
        learningDifficulties,
        specialNeeds,
        priorityNeeds,
        careerGoal,
        status: "PRE_REGISTERED",
        followUpNotes: `تم إرسال الطلب عبر استمارة التسجيل القبلي الخارجية الكاملة. سبق الاستفادة من برنامج مشابه: ${previousProgram}.`
      }
    });

    await prisma.activityLog.create({
      data: {
        beneficiaryId: beneficiary.id,
        category: "REGISTRATION",
        title: "تسجيل قبلي خارجي كامل",
        description: `تم إنشاء الملف عبر الاستمارة العامة. الرغبة الأولى: ${careerChoice1}${careerChoice2 ? `، الرغبة الثانية: ${careerChoice2}` : ""}.`,
        actorName: "المستفيد",
        referenceType: "Beneficiary",
        referenceId: beneficiary.id,
        referenceHref: `/beneficiaries/${beneficiary.id}`
      }
    });

    const applicationNumber = `SC-${new Date().getFullYear()}-${beneficiary.id.slice(-6).toUpperCase()}`;
    return NextResponse.json({ applicationNumber }, { status: 201 });
  } catch (error) {
    console.error("Public registration failed", error);
    return NextResponse.json({ message: "تعذر إرسال الطلب حاليًا. يرجى المحاولة لاحقًا." }, { status: 500 });
  }
}
