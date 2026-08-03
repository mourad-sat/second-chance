import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const clean = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export async function GET() {
  const beneficiaries = await prisma.beneficiary.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(beneficiaries);
}

export async function POST(request: Request) {
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

    const beneficiary = await prisma.beneficiary.create({
      data: {
        firstName,
        lastName,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        identityNumber: clean(body.identityNumber),
        phone: clean(body.phone),
        guardianPhone: clean(body.guardianPhone),
        address: clean(body.address),
        lastEducationLevel: clean(body.lastEducationLevel)
      }
    });

    return NextResponse.json(beneficiary, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "رقم البطاقة الوطنية أو مسار مسجل من قبل." },
        { status: 409 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { message: "تعذر حفظ الملف. تحقق من الاتصال بقاعدة البيانات." },
      { status: 500 }
    );
  }
}
