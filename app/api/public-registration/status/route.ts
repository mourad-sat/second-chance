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
      where: { registrationNumber, masarNumber, archivedAt: null, deletedAt: null },
      select: {
        firstName: true,
        lastName: true,
        registrationNumber: true,
        registrationDate: true,
        status: true,
        updatedAt: true,
        admissionAssessment: {
          select: {
            interviewDate: true,
            interviewerName: true,
            interviewSummary: true,
            proposedTrack: true,
            proposedSpecialty: true
          }
        },
        _count: { select: { documents: true } }
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
      updatedAt: beneficiary.updatedAt.toISOString(),
      appointment: beneficiary.admissionAssessment?.interviewDate ? {
        interviewDate: beneficiary.admissionAssessment.interviewDate.toISOString(),
        interviewerName: beneficiary.admissionAssessment.interviewerName,
        summary: beneficiary.admissionAssessment.interviewSummary
      } : null,
      orientation: beneficiary.admissionAssessment?.proposedSpecialty || beneficiary.admissionAssessment?.proposedTrack || null,
      documentCount: beneficiary._count.documents
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Status lookup failed", error);
    return NextResponse.json({ message: "تعذر تحميل حالة الطلب حاليًا." }, { status: 500 });
  }
}
