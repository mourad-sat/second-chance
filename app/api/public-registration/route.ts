import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

type UploadedFile = { url: string; pathname: string; fileName: string; mimeType: string; sizeBytes: number };

function clean(value: unknown, max = 500) {
  return String(value ?? "").trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max);
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

function requestIp(request: Request) {
  return clean(request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown", 80);
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "document";
}

async function verifyTurnstile(token: string, remoteIp: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store"
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("Turnstile verification failed", error);
    return false;
  }
}

async function uploadOptionalDocument(form: FormData, field: string, pathname: string): Promise<UploadedFile | null> {
  const value = form.get(field);
  if (!(value instanceof File) || value.size === 0) return null;
  if (!DOCUMENT_TYPES.has(value.type)) throw new Error(`INVALID_DOCUMENT_TYPE:${field}`);
  if (value.size > MAX_DOCUMENT_SIZE) throw new Error(`DOCUMENT_TOO_LARGE:${field}`);
  const blob = await put(`${pathname}/${safeFileName(value.name)}`, value, {
    access: "private",
    addRandomSuffix: true,
    contentType: value.type
  });
  return { url: blob.url, pathname: blob.pathname, fileName: value.name, mimeType: value.type, sizeBytes: value.size };
}

export async function POST(request: Request) {
  const uploadedUrls: string[] = [];
  const ipAddress = requestIp(request);

  try {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentAttempts = await prisma.auditLog.count({
      where: { action: "PUBLIC_REGISTRATION_ATTEMPT", ipAddress, createdAt: { gte: since } }
    });
    if (recentAttempts >= RATE_LIMIT_MAX) {
      return NextResponse.json({ message: "تم تجاوز عدد محاولات التسجيل المسموح بها مؤقتًا. يرجى المحاولة لاحقًا." }, { status: 429 });
    }

    await prisma.auditLog.create({
      data: { action: "PUBLIC_REGISTRATION_ATTEMPT", entityType: "PUBLIC_PORTAL", description: "محاولة إرسال استمارة تسجيل قبلي.", ipAddress }
    });

    const form = await request.formData();
    if (clean(form.get("website"), 200)) {
      return NextResponse.json({ message: "تعذر إرسال الطلب." }, { status: 400 });
    }

    const turnstileToken = clean(form.get("cf-turnstile-response"), 2048);
    if (!(await verifyTurnstile(turnstileToken, ipAddress))) {
      return NextResponse.json({ message: "تعذر التحقق الأمني. يرجى إعادة المحاولة." }, { status: 400 });
    }

    const firstName = clean(form.get("firstName"), 80);
    const lastName = clean(form.get("lastName"), 80);
    const gender = clean(form.get("gender"), 20);
    const identityNumber = clean(form.get("identityNumber"), 40).toUpperCase() || null;
    const birthPlace = clean(form.get("birthPlace"), 120) || null;
    const phone = clean(form.get("phone"), 30);
    const guardianPhone = clean(form.get("guardianPhone"), 30) || null;
    const email = clean(form.get("email"), 180).toLowerCase() || null;
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
    if (!/^[A-Z0-9-]{6,30}$/.test(masarNumber)) {
      return NextResponse.json({ message: "رقم مسار غير صالح." }, { status: 400 });
    }
    if (identityNumber && !/^[A-Z0-9-]{5,40}$/.test(identityNumber)) {
      return NextResponse.json({ message: "رقم البطاقة الوطنية غير صالح." }, { status: 400 });
    }
    if (!/^0[5-7]\d{8}$/.test(phone.replace(/\s+/g, ""))) {
      return NextResponse.json({ message: "رقم الهاتف المغربي غير صالح." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "البريد الإلكتروني غير صالح." }, { status: 400 });
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

    const duplicateConditions = [
      { masarNumber },
      { firstName: { equals: firstName, mode: "insensitive" as const }, lastName: { equals: lastName, mode: "insensitive" as const }, birthDate, phone }
    ];
    if (identityNumber) duplicateConditions.push({ identityNumber } as never);

    const duplicate = await prisma.beneficiary.findFirst({
      where: { OR: duplicateConditions },
      select: { registrationNumber: true }
    });
    if (duplicate) {
      return NextResponse.json({ message: "يوجد طلب مسجل مسبقًا بهذه البيانات." }, { status: 409 });
    }

    const registrationNumber = createRegistrationNumber();
    const registrationDate = new Date();
    const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const photoBlob = await put(`public-registrations/${registrationNumber}/candidate-photo.${extension}`, photo, {
      access: "private", addRandomSuffix: true, contentType: photo.type
    });
    uploadedUrls.push(photoBlob.url);

    const basePath = `public-registrations/${registrationNumber}/documents`;
    const identityDocument = await uploadOptionalDocument(form, "identityDocument", basePath);
    const educationDocument = await uploadOptionalDocument(form, "educationDocument", basePath);
    const otherDocument = await uploadOptionalDocument(form, "otherDocument", basePath);
    for (const file of [identityDocument, educationDocument, otherDocument]) if (file) uploadedUrls.push(file.url);

    const beneficiary = await prisma.$transaction(async (tx) => {
      const created = await tx.beneficiary.create({
        data: {
          registrationNumber, registrationDate, masarNumber, identityNumber,
          profilePhotoUrl: photoBlob.url, profilePhotoPathname: photoBlob.pathname,
          personalProject, gender, email, birthPlace, commune, province, programExpectation, registrationGoals,
          careerChoice1, careerChoice2, careerChoice3, careerChoiceReason, priorExperience,
          firstName, lastName, birthDate, phone, guardianPhone, address, lastEducationLevel,
          guardianName, guardianRelationship, lastSchoolName, dropoutYear, dropoutReasons,
          learningDifficulties, careerGoal, status: "PRE_REGISTERED",
          followUpNotes: [
            "تم إرسال الطلب عبر بوابة التسجيل القبلي العامة.",
            `سبق الاستفادة من برنامج مشابه: ${previousProgram}.`,
            programExpectation ? `توقعات المترشح: ${programExpectation}` : null
          ].filter(Boolean).join(" ")
        }
      });

      const documents = [
        identityDocument && { title: "وثيقة الهوية", category: "IDENTITY" as const, file: identityDocument },
        educationDocument && { title: "وثيقة دراسية", category: "EDUCATION" as const, file: educationDocument },
        otherDocument && { title: "وثيقة إضافية", category: "OTHER" as const, file: otherDocument }
      ].filter(Boolean) as { title: string; category: "IDENTITY" | "EDUCATION" | "OTHER"; file: UploadedFile }[];

      if (documents.length) {
        await tx.document.createMany({
          data: documents.map(({ title, category, file }) => ({
            beneficiaryId: created.id, title, category, fileName: file.fileName, mimeType: file.mimeType,
            sizeBytes: file.sizeBytes, storageProvider: "VERCEL_BLOB", blobUrl: file.url,
            blobPathname: file.pathname, uploadedByName: "المترشح"
          }))
        });
      }

      await tx.activityLog.create({
        data: {
          beneficiaryId: created.id, category: "REGISTRATION", title: "تسجيل قبلي خارجي",
          description: `رقم التسجيل: ${registrationNumber}. رقم مسار: ${masarNumber}.`,
          actorName: "المترشح", referenceType: "Beneficiary", referenceId: created.id,
          referenceHref: `/beneficiaries/${created.id}`, eventDate: registrationDate
        }
      });
      await tx.auditLog.create({
        data: {
          action: "PUBLIC_REGISTRATION_CREATED", entityType: "BENEFICIARY", entityId: created.id,
          description: `إنشاء تسجيل قبلي خارجي برقم ${registrationNumber}.`, ipAddress
        }
      });
      return created;
    });

    return NextResponse.json({
      applicationNumber: registrationNumber,
      registrationDate: registrationDate.toISOString(),
      candidateName: `${firstName} ${lastName}`,
      beneficiaryId: beneficiary.id
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    for (const url of uploadedUrls) {
      try { await del(url); } catch (cleanupError) { console.error("Public file cleanup failed", cleanupError); }
    }
    if (error instanceof Error && error.message.startsWith("INVALID_DOCUMENT_TYPE")) {
      return NextResponse.json({ message: "الوثائق المرفقة يجب أن تكون PDF أو صورة JPG/PNG/WEBP." }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("DOCUMENT_TOO_LARGE")) {
      return NextResponse.json({ message: "حجم كل وثيقة يجب ألا يتجاوز 5 ميغابايت." }, { status: 400 });
    }
    console.error("Public registration failed", error);
    return NextResponse.json({ message: "تعذر إرسال الطلب حاليًا. يرجى المحاولة لاحقًا." }, { status: 500 });
  }
}
