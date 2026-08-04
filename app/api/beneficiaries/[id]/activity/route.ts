import { ActivityCategory } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

const categories = new Set(Object.values(ActivityCategory));
const clean = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const body = await request.json();
    const title = clean(body.title);
    const category = body.category as ActivityCategory;

    if (!title || !categories.has(category)) {
      return NextResponse.json({ message: "عنوان الحدث وفئته إلزاميان." }, { status: 400 });
    }

    const beneficiary = await prisma.beneficiary.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!beneficiary) return NextResponse.json({ message: "المستفيد غير موجود." }, { status: 404 });

    const activity = await prisma.activityLog.create({
      data: {
        beneficiaryId: params.id,
        category,
        title,
        description: clean(body.description),
        actorName: clean(body.actorName),
        referenceHref: clean(body.referenceHref),
        eventDate: body.eventDate ? new Date(body.eventDate) : new Date()
      }
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر إضافة الحدث إلى السجل الزمني." }, { status: 500 });
  }
}
