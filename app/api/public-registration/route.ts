import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function clean(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function optionalInt(value: unknown, min: number, max: number) {
  const text = clean(value, 20);
  if (!text) return null;
  const number = Number(text);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

function createRegistrationNumber() {
  const year = new Date().getFullYear();
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `SC-${year}-${code}`;
}

function calculateAge(date: Date) {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const month = today.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

export async function POST(request: Request) {
  let uploadedPhotoUrl: string | null = null;

  try {
    const form = await request.formData();
    const firstName = clean(form.get("firstName"), 80);
    const lastName = clean(form.get("lastName"), 80);
    const gender = clean(form.get("gender"), 20);
    const birthPlace = clean(form.get("birthPlace"), 120) || null;
    const phone = clean(form.get("phone"), 30);
    const guardianPhone = clean(form.get("guardianPhone"), 30) || null;
    const email = clean(form.get("email"), 180) || null;
    const masarNumber = clean(form.get("masarNumber"), 30).toUpperCase();
    const address = clean(form.get("address"), 300);
    const commune = clean(form.get("commune"), 120) || null;
    const province = clean(form.get("province"), 120) || null;
    const lastEducationLevel = clean(form.get("lastEducationLevel"), 120);
    const lastSchoolName = clean(form.get("lastSchoolName"), 180) || null;
    const dropoutReasons = clean(form.get("dropoutReasons"), 800);
    const learningDifficulties = clean(form.get("learningDifficulties"), 600) || null;
    const guardianName = clean(form.get("guardianName"), 120) || null;
    const guardianRelationship = clean(form.get("guardianRelationship"), 100) || null;
    const previousProgram = clean(form.get("previousProgram"), 20) || "غير محدد";
    const careerChoice1 = clean(form.get("careerChoice1"), 180);
    const careerChoice2 = clean(form.get("careerChoice2"), 180) || null;
    const careerChoice3 = clean(form.get("careerChoice3"), 180) || null;
    const careerChoiceReason = clean(form.get("careerChoiceReason"), 800) || null;
    const priorExperience = clean(form.get("priorExperience"), 800) || null;
    const programExpectation = clean(form.get("programExpectation"), 800) || null;
    const personalProject = clean(form.get("personalProject"), 1000);
    const registrationGoals = form.getAll("registrationGoals").map((value) => clean(value, 120)).filter(Boolean).join(" | ") || null;
    const careerGoal = [careerChoice1, careerChoice2, careerChoice3].filter(Boolean).join(" | ") || null;
    const birthDateValue = clean(form.get("birthDate"), 30);
    const consent = form.get("consent") === "on";
    const declaration = form.get("declaration") === "on";
    const photo = form.get("photo");
    const currentYear = new Date().getFullYear();
    const dropoutYear = optionalInt(form.get("dropoutYear"), 1990, currentYear);

    if (!firstName || !lastName || !gender || !phone || !birthDateValue || !address || !masarNumber || !lastEducationLevel || !dropoutReasons || !careerChoice1 || !personalProject) {
      return NextResponse.json({ message: "يرجى تعبئة جميع الحقول الإلزامية المميزة بعلامة *." }, { status: 400 });
    }
    if (!consent || !declaration) {
      return NextResponse.json({ message: "يجب الموافقة على الإقرار ومعالجة البيانات لإرسال الطلب." }, { status: 400 });
    }
    if (!(photo instanceof File) || photo.size <= 0) {
      return NextResponse.json({ message: "صورة المترشح مطلوبة." }, { status: 400 });
    }
    if (!PHOTO_TYPES.has(photo.type)) {
      return NextResponse.json({ message: "الصورة يجب أن تكون بصيغة JPG أو PNG أو WEBP." }, { status: 400 });
    }
    if (photo.size > MAX_PHOTO_SIZE) {
      return NextResponse.json({ message: "حجم صورة المترشح يجب ألا يتجاوز 2 ميغابايت." }, { status: 400 });
    }

    const birthDate = new Date(birthDateValue);
    if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
      return NextResponse.json({ message: "تاريخ الازدياد غير صالح." }, { status: 400 });
    }

    const age = calculateAge(birthDate);
    if (age < 14 || age > 20) {
      return NextResponse.json({ message: "التسجيل متاح فقط للمترشحين الذين تتراوح أعمارهم بين 14 و20 سنة." }, { status: 400 });
    }

    const duplicateMasar = await prisma.beneficiary.findUnique({ where: { masarNumber }, select: { id: true } });
    if (duplicateMasar) {
      return NextResponse.json({ message: "يوجد طلب مسجل مسبقًا برقم مسار هذا." }, { status: 409 });
    }

    const duplicate = await prisma.beneficiary.findFirst({
      where: {
        firstName: { equals: firstName, mode: "insensitive" },
        lastName: { equals: lastName, mode: "insensitive" },
        birthDate,
        phone
      },
      select: { id: true }
    });
    if (duplicate) {
      return NextResponse.json({ message: "يبدو أن طلبًا مطابقًا سبق تسجيله بهذه البيانات." }, { status: 409 });
    }

    const registrationNumber = createRegistrationNumber();
    const registrationDate = new Date();
    const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const blob = await put(`public-registrations/${registrationNumber}/candidate-photo.${extension}`, photo, {
      access: "private",
      addRandomSuffix: true,
      contentType: photo.type
    });
    uploadedPhotoUrl = blob.url;

    const beneficiary = await prisma.beneficiary.create({
      data: {
        registrationNumber,
        registrationDate,
        masarNumber,
        profilePhotoUrl: blob.url,
        profilePhotoPathname: blob.pathname,
        personalProject,
        gender,
        email,
        birthPlace,
        commune,
        province,
        programExpectation,
        registrationGoals,
        careerChoice1,
        careerChoice2,
        careerChoice3,
        careerChoiceReason,
        priorExperience,
        firstName,
        lastName,
        birthDate,
        phone,
        guardianPhone,
        address,
        lastEducationLevel,
        guardianName,
        guardianRelationship,
        lastSchoolName,
        dropoutYear,
        dropoutReasons,
        learningDifficulties,
        careerGoal,
        status: "PRE_REGISTERED",
        followUpNotes: [
          "تم إرسال الطلب عبر استمارة التسجيل القبلي الخارجية المرتبطة بمنصة التدبير.",
          `سبق الاستفادة من برنامج مشابه: ${previousProgram}.`,
          programExpectation ? `توقعات المترشح من البرنامج: ${programExpectation}` : null
        ].filter(Boolean).join(" ")
      }
    });

    await prisma.activityLog.create({
      data: {
        beneficiaryId: beneficiary.id,
        category: "REGISTRATION",
        title: "تسجيل قبلي خارجي",
        description: `رقم التسجيل: ${registrationNumber}. رقم مسار: ${masarNumber}. الرغبات: ${careerGoal}.`,
        actorName: "المترشح",
        referenceType: "Beneficiary",
        referenceId: beneficiary.id,
        referenceHref: `/beneficiaries/${beneficiary.id}`,
        eventDate: registrationDate
      }
    });

    return NextResponse.json({
      applicationNumber: registrationNumber,
      registrationDate: registrationDate.toISOString(),
      candidateName: `${firstName} ${lastName}`,
      beneficiaryId: beneficiary.id
    }, { status: 201 });
  } catch (error) {
    if (uploadedPhotoUrl) {
      try { await del(uploadedPhotoUrl); } catch (cleanupError) { console.error("Photo cleanup failed", cleanupError); }
    }
    console.error("Public registration failed", error);
    return NextResponse.json({ message: "تعذر إرسال الطلب حاليًا. يرجى المحاولة لاحقًا." }, { status: 500 });
  }
}
