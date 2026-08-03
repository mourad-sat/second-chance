import { InternshipStatus, ProjectStatus, SkillLevel } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const number = (value: unknown) => value === "" || value == null ? null : Number(value);

export async function GET() {
  const [programs, beneficiaries, evaluations, projects, internships] = await Promise.all([
    prisma.vocationalProgram.findMany({ include: { competencies: true, workshops: true }, orderBy: { createdAt: "desc" } }),
    prisma.beneficiary.findMany({ where: { status: { in: ["ACCEPTED", "ENROLLED"] } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    prisma.skillEvaluation.findMany({ include: { beneficiary: true, competency: { include: { program: true } } }, orderBy: { evaluationDate: "desc" }, take: 100 }),
    prisma.vocationalProject.findMany({ include: { beneficiary: true }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.internship.findMany({ include: { beneficiary: true }, orderBy: { startDate: "desc" }, take: 100 })
  ]);
  return NextResponse.json({ programs, beneficiaries, evaluations, projects, internships });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "program") {
      if (!text(body.track) || !text(body.specialty) || !text(body.moduleName)) {
        return NextResponse.json({ message: "المسار والشعبة والوحدة إلزامية." }, { status: 400 });
      }
      const program = await prisma.vocationalProgram.create({ data: {
        track: text(body.track)!, specialty: text(body.specialty)!, moduleName: text(body.moduleName)!,
        description: text(body.description), totalHours: number(body.totalHours)
      }});
      return NextResponse.json(program, { status: 201 });
    }

    if (body.action === "competency") {
      if (!text(body.programId) || !text(body.title)) return NextResponse.json({ message: "الوحدة والكفاية إلزاميتان." }, { status: 400 });
      const item = await prisma.vocationalCompetency.create({ data: {
        programId: text(body.programId)!, code: text(body.code), title: text(body.title)!, description: text(body.description),
        targetLevel: Object.values(SkillLevel).includes(body.targetLevel) ? body.targetLevel : SkillLevel.COMPETENT
      }});
      return NextResponse.json(item, { status: 201 });
    }

    if (body.action === "workshop") {
      if (!text(body.programId) || !text(body.title) || !body.sessionDate) return NextResponse.json({ message: "الوحدة والعنوان والتاريخ إلزامية." }, { status: 400 });
      const item = await prisma.workshopSession.create({ data: {
        programId: text(body.programId)!, title: text(body.title)!, sessionDate: new Date(body.sessionDate), trainerName: text(body.trainerName),
        durationHours: number(body.durationHours), location: text(body.location), activities: text(body.activities), materials: text(body.materials), observations: text(body.observations)
      }});
      return NextResponse.json(item, { status: 201 });
    }

    if (body.action === "evaluation") {
      if (!text(body.beneficiaryId) || !text(body.competencyId) || !body.evaluationDate) return NextResponse.json({ message: "المستفيد والكفاية والتاريخ إلزامية." }, { status: 400 });
      const item = await prisma.skillEvaluation.create({ data: {
        beneficiaryId: text(body.beneficiaryId)!, competencyId: text(body.competencyId)!, evaluationDate: new Date(body.evaluationDate),
        level: Object.values(SkillLevel).includes(body.level) ? body.level : SkillLevel.NOT_ASSESSED,
        score: number(body.score), evaluatorName: text(body.evaluatorName), evidence: text(body.evidence), notes: text(body.notes)
      }});
      return NextResponse.json(item, { status: 201 });
    }

    if (body.action === "project") {
      if (!text(body.beneficiaryId) || !text(body.title)) return NextResponse.json({ message: "المستفيد وعنوان المشروع إلزاميان." }, { status: 400 });
      const progress = Math.max(0, Math.min(100, Number(body.progressPercent || 0)));
      const item = await prisma.vocationalProject.create({ data: {
        beneficiaryId: text(body.beneficiaryId)!, title: text(body.title)!, description: text(body.description),
        status: Object.values(ProjectStatus).includes(body.status) ? body.status : ProjectStatus.IDEA,
        mentorName: text(body.mentorName), startDate: body.startDate ? new Date(body.startDate) : null,
        targetDate: body.targetDate ? new Date(body.targetDate) : null, progressPercent: progress,
        skillsApplied: text(body.skillsApplied), deliverables: text(body.deliverables), evaluationNotes: text(body.evaluationNotes)
      }});
      return NextResponse.json(item, { status: 201 });
    }

    if (body.action === "internship") {
      if (!text(body.beneficiaryId) || !text(body.organizationName) || !body.startDate) return NextResponse.json({ message: "المستفيد والمؤسسة وتاريخ البداية إلزامية." }, { status: 400 });
      const item = await prisma.internship.create({ data: {
        beneficiaryId: text(body.beneficiaryId)!, organizationName: text(body.organizationName)!, field: text(body.field),
        supervisorName: text(body.supervisorName), supervisorPhone: text(body.supervisorPhone), startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: Object.values(InternshipStatus).includes(body.status) ? body.status : InternshipStatus.PLANNED,
        objectives: text(body.objectives), tasks: text(body.tasks), attendanceNotes: text(body.attendanceNotes),
        supervisorEvaluation: text(body.supervisorEvaluation), finalResult: text(body.finalResult)
      }});
      return NextResponse.json(item, { status: 201 });
    }

    return NextResponse.json({ message: "نوع العملية غير معروف." }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "تعذر حفظ بيانات التكوين المهني." }, { status: 500 });
  }
}
