import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clean(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = clean(body.firstName, 80);
    const lastName = clean(body.lastName, 80);
    const phone = clean(body.phone, 30);
    const guardianPhone = clean(body.guardianPhone, 30) || null;
    const identityNumber = clean(body.identityNumber, 50) || null;
    const address = clean(body.address, 300) || null;
    const lastEducationLevel = clean(body.lastEducationLevel, 120) || null;
    const lastSchoolName = clean(body.lastSchoolName, 180) || null;
    const dropoutReasons = clean(body.dropoutReasons, 800) || null;
    const careerGoal = clean(body.careerGoal, 300) || null;
    const birthDateValue = clean(body.birthDate, 30);
    const consent = body.consent === true;

    if (!firstName || !lastName || !phone || !birthDateValue) {
      return NextResponse.json({ message: "الاسم والنسب وتاريخ الازدياد ورقم الهاتف حقول إلزامية." }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ message: "يجب الموافقة على معالجة البيانات لإرسال الطلب." }, { status: 400 });
    }

    const birthDate = new Date(birthDateValue);
    if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
      return NextResponse.json({ message: "تاريخ الازدياد غير صالح." }, { status: 400 });
    }

    if (identityNumber) {
      const duplicate = await prisma.beneficiary.findUnique({ where: { identityNumber }, select: { id: true } });
      if (duplicate) {
        return NextResponse.json({ message: "يوجد طلب مسجل مسبقًا بهذا الرقم الوطني." }, { status: 409 });
      }
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
        lastSchoolName,
        dropoutReasons,
        careerGoal,
        status: "PRE_REGISTERED",
        followUpNotes: "تم إرسال الطلب عبر استمارة التسجيل القبلي الخارجية."
      }
    });

    await prisma.activityLog.create({
      data: {
        beneficiaryId: beneficiary.id,
        category: "REGISTRATION",
        title: "تسجيل قبلي خارجي",
        description: "تم إنشاء الملف عبر الاستمارة العامة.",
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
