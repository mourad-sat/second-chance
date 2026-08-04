import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const track = String(body.track || "").trim();
    const specialty = String(body.specialty || "").trim();
    const moduleName = String(body.moduleName || "").trim();
    const description = String(body.description || "").trim() || null;
    const totalHoursValue = String(body.totalHours || "").trim();
    const totalHours = totalHoursValue ? Number(totalHoursValue) : null;

    if (!track || !specialty || !moduleName) {
      return NextResponse.json(
        { message: "المسلك والشعبة واسم الوحدة حقول إلزامية." },
        { status: 400 }
      );
    }

    if (totalHours !== null && (!Number.isInteger(totalHours) || totalHours <= 0)) {
      return NextResponse.json(
        { message: "عدد الساعات يجب أن يكون عددًا صحيحًا أكبر من صفر." },
        { status: 400 }
      );
    }

    const program = await prisma.vocationalProgram.create({
      data: {
        track,
        specialty,
        moduleName,
        description,
        totalHours
      }
    });

    return NextResponse.json({ program }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر إنشاء البرنامج.";
    const duplicate = message.includes("Unique constraint");

    return NextResponse.json(
      { message: duplicate ? "هذه الوحدة مسجلة مسبقًا ضمن المسلك والشعبة نفسيهما." : "تعذر إنشاء البرنامج المهني." },
      { status: duplicate ? 409 : 500 }
    );
  }
}
