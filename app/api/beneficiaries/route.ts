import { NextResponse } from "next/server";
import { BeneficiaryStatus, Prisma } from "@prisma/client";
import { currentSession } from "@/lib/auth-server";
import { canAccessPath } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const MAX_LENGTH = 1200;

function clean(value: unknown, maxLength = MAX_LENGTH) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\u0000/g, "");
  return normalized ? normalized.slice(0, maxLength) : null;
}

function positiveInteger(value: unknown, min: number, max: number) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function validDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isEmail(value: string | null) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string | null) {
  return !value || /^[+\d][\d\s().-]{7,19}$/.test(value);
}

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  if (!canAccessPath(session.role, "/api/beneficiaries", "GET")) {
    return NextResponse.json({ message: "ليس لديك صلاحية." }, { status: 403 });
  }

  const url = new URL(request.url);
  const requestedTake = Number(url.searchParams.get("take") || 50);
  const take = Number.isFinite(requestedTake) ? Math.min(Math.max(Math.floor(requestedTake), 1), 200) : 50;

  const beneficiaries = await prisma.beneficiary.findMany({
    where: { archivedAt: null, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      registrationNumber: true,
      firstName: true,
      lastName: true,
      status: true,
      phone: true,
      createdAt: true
    }
  });

  return NextResponse.json(beneficiaries, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ message: "انتهت الجلسة. أعد تسجيل الدخول." }, { status: 401 });
  if (!canAccessPath(session.role, "/api/beneficiaries", "POST")) {
    return NextResponse.json({ message: "ليس لديك صلاحية لإنشاء ملف مستفيد." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const firstName = clean(body.firstName, 80);
    const lastName = clean(body.lastName, 80);
    const email = clean(body.email, 160)?.toLowerCase() || null;
    const phone = clean(body.phone, 20);
    const guardianPhone = clean(body.guardianPhone, 20);
    const birthDate = validDate(body.birthDate);
    const currentYear = new Date().getFullYear();
    const dropoutYear = positiveInteger(body.dropoutYear, 1950, currentYear);
    const householdSize = positiveInteger(body.householdSize, 1, 50);

    if (!firstName || !lastName) {
      return NextResponse.json({ message: "الاسم الشخصي والاسم العائلي إلزاميان." }, { status: 400 });
    }
    if (body.birthDate && !birthDate) {
      return NextResponse.json({ message: "تاريخ الميلاد غير صالح." }, { status: 400 });
    }
    if (birthDate && birthDate > new Date()) {
      return NextResponse.json({ message: "تاريخ الميلاد لا يمكن أن يكون في المستقبل." }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ message: "صيغة البريد الإلكتروني غير صحيحة." }, { status: 400 });
    }
    if (!isPhone(phone) || !isPhone(guardianPhone)) {
      return NextResponse.json({ message: "صيغة رقم الهاتف غير صحيحة." }, { status: 400 });
    }
    if (body.dropoutYear && dropoutYear === null) {
      return NextResponse.json({ message: "سنة الانقطاع غير صحيحة." }, { status: 400 });
    }
    if (body.householdSize && householdSize === null) {
      return NextResponse.json({ message: "عدد أفراد الأسرة غير صحيح." }, { status: 400 });
    }

    const beneficiary = await prisma.$transaction(async (tx) => {
      const created = await tx.beneficiary.create({
        data: {
          firstName,
          lastName,
          status: BeneficiaryStatus.PRE_REGISTERED,
          birthDate,
          birthPlace: clean(body.birthPlace, 120),
          gender: clean(body.gender, 20),
          identityNumber: clean(body.identityNumber, 40)?.toUpperCase() || null,
          masarNumber: clean(body.masarNumber, 30)?.toUpperCase() || null,
          phone,
          guardianPhone,
          email,
          address: clean(body.address, 300),
          commune: clean(body.commune, 120),
          province: clean(body.province, 120),
          familySituation: clean(body.familySituation, 120),
          guardianName: clean(body.guardianName, 160),
          guardianRelationship: clean(body.guardianRelationship, 80),
          householdSize,
          familyIncomeSituation: clean(body.familyIncomeSituation, 120),
          housingSituation: clean(body.housingSituation, 120),
          socialCoverage: clean(body.socialCoverage, 120),
          specialNeeds: clean(body.specialNeeds),
          lastEducationLevel: clean(body.lastEducationLevel, 120),
          lastSchoolName: clean(body.lastSchoolName, 200),
          dropoutYear,
          dropoutReasons: clean(body.dropoutReasons),
          learningDifficulties: clean(body.learningDifficulties),
          priorExperience: clean(body.priorExperience),
          careerChoice1: clean(body.careerChoice1, 160),
          careerChoice2: clean(body.careerChoice2, 160),
          careerChoice3: clean(body.careerChoice3, 160),
          personalProject: clean(body.personalProject, 500),
          careerChoiceReason: clean(body.careerChoiceReason),
          programExpectation: clean(body.programExpectation),
          registrationGoals: clean(body.registrationGoals)
        },
        select: { id: true, firstName: true, lastName: true, status: true }
      });

      await tx.activityLog.create({
        data: {
          beneficiaryId: created.id,
          category: "REGISTRATION",
          title: "إنشاء التسجيل القبلي",
          description: "تم فتح ملف أولي للمستفيد.",
          actorName: session.fullName,
          referenceType: "PRE_REGISTRATION",
          referenceId: created.id,
          referenceHref: `/beneficiaries/${created.id}`
        }
      });

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "CREATE_PRE_REGISTRATION",
          entityType: "Beneficiary",
          entityId: created.id,
          description: `إنشاء تسجيل قبلي للمستفيد ${created.firstName} ${created.lastName}`
        }
      });

      return created;
    });

    return NextResponse.json(beneficiary, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta?.target.join(",") : String(error.meta?.target || "");
      const label = target.includes("masarNumber") ? "رقم مسار" : target.includes("identityNumber") ? "رقم البطاقة الوطنية" : "هذه البيانات";
      return NextResponse.json({ message: `${label} مسجل من قبل.` }, { status: 409 });
    }

    console.error("Pre-registration failed", error);
    return NextResponse.json({ message: "تعذر حفظ التسجيل القبلي. حاول مرة أخرى." }, { status: 500 });
  }
}
