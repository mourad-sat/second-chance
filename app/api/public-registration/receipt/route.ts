import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clean(value: unknown, max = 100) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const registrationNumber = clean(body.registrationNumber, 40).toUpperCase();
    const masarNumber = clean(body.masarNumber, 30).toUpperCase();

    if (!registrationNumber || !masarNumber) {
      return NextResponse.json({ message: "رقم التسجيل ورقم مسار مطلوبان." }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiary.findFirst({
      where: { registrationNumber, masarNumber },
      select: {
        registrationNumber: true,
        registrationDate: true,
        masarNumber: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        gender: true,
        lastEducationLevel: true,
        careerChoice1: true,
        profilePhotoPathname: true,
        status: true
      }
    });

    if (!beneficiary) {
      return NextResponse.json({ message: "لم يتم العثور على تسجيل مطابق لهذه المعطيات." }, { status: 404 });
    }

    const age = beneficiary.birthDate
      ? Math.floor((Date.now() - beneficiary.birthDate.getTime()) / 31557600000)
      : null;

    return NextResponse.json({
      registrationNumber: beneficiary.registrationNumber,
      registrationDate: beneficiary.registrationDate.toISOString(),
      masarNumber: beneficiary.masarNumber,
      fullName: `${beneficiary.firstName} ${beneficiary.lastName}`,
      age,
      gender: beneficiary.gender,
      lastEducationLevel: beneficiary.lastEducationLevel,
      careerChoice1: beneficiary.careerChoice1,
      status: beneficiary.status,
      photoUrl: beneficiary.profilePhotoPathname
        ? `/api/public-registration/receipt/photo?registrationNumber=${encodeURIComponent(registrationNumber)}&masarNumber=${encodeURIComponent(masarNumber)}`
        : null
    });
  } catch (error) {
    console.error("Receipt lookup failed", error);
    return NextResponse.json({ message: "تعذر تحميل بطاقة التسجيل حاليًا." }, { status: 500 });
  }
}
