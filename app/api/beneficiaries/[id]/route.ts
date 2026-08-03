import { BeneficiaryStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const clean = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

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
        status: body.status || BeneficiaryStatus.PRE_REGISTERED
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
