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
        firstName: true,
        lastName: true,
        registrationNumber: true,
        registrationDate: true,
        status: true,
        updatedAt: true
      }
    });

    if (!beneficiary) {
      return NextResponse.json({ message: "لم يتم العثور على طلب مطابق لهذه المعطيات." }, { status: 404 });
    }

    return NextResponse.json({
      fullName: `${beneficiary.firstName} ${beneficiary.lastName}`,
      registrationNumber: beneficiary.registrationNumber,
      registrationDate: beneficiary.registrationDate.toISOString(),
      status: beneficiary.status,
      updatedAt: beneficiary.updatedAt.toISOString()
    });
  } catch (error) {
    console.error("Status lookup failed", error);
    return NextResponse.json({ message: "تعذر تحميل حالة الطلب حاليًا." }, { status: 500 });
  }
}
