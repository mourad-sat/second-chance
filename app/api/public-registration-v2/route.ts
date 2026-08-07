import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST as createPublicRegistration } from "@/app/api/public-registration/route";

function cleanFrenchName(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
}

export async function POST(request: Request) {
  const cloned = request.clone();
  const form = await cloned.formData();
  const fullNameFrench = cleanFrenchName(form.get("fullNameFrench"));

  if (!fullNameFrench) {
    return NextResponse.json({ message: "يرجى إدخال الاسم الكامل بالفرنسية." }, { status: 400 });
  }

  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]{3,120}$/.test(fullNameFrench)) {
    return NextResponse.json({ message: "الاسم الكامل بالفرنسية يجب أن يكتب بالحروف اللاتينية فقط." }, { status: 400 });
  }

  const response = await createPublicRegistration(request);
  if (!response.ok) return response;

  try {
    const payload = await response.clone().json() as { beneficiaryId?: string };
    if (payload.beneficiaryId) {
      const beneficiary = await prisma.beneficiary.findUnique({
        where: { id: payload.beneficiaryId },
        select: { followUpNotes: true }
      });
      const marker = `الاسم الكامل بالفرنسية: ${fullNameFrench}.`;
      const existing = beneficiary?.followUpNotes?.trim() || "";
      await prisma.beneficiary.update({
        where: { id: payload.beneficiaryId },
        data: { followUpNotes: existing ? `${existing} ${marker}` : marker }
      });
    }
  } catch (error) {
    console.error("Could not persist French full name", error);
  }

  return response;
}