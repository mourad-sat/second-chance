import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowRight, BrainCircuit, CheckCircle2, FileText, Gauge, ShieldAlert, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IntelligenceDecisionPanel } from "@/components/IntelligenceDecisionPanel";
import { buildBeneficiaryIntelligence } from "@/lib/beneficiary-intelligence";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const riskLabels = { LOW: "منخفض", MEDIUM: "متوسط", HIGH: "مرتفع", CRITICAL: "حرج" } as const;
const riskClasses = { LOW: "bg-emerald-100 text-emerald-800", MEDIUM: "bg-amber-100 text-amber-800", HIGH: "bg-orange-100 text-orange-800", CRITICAL: "bg-red-100 text-red-800" } as const;

export default async function BeneficiaryIntelligencePage({ params }: { params: { id: string } }) {
  const beneficiary = await prisma.beneficiary.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      admissionAssessment: true,
      attendanceRecords: { select: { status: true } },
      socialFollowUps: { select: { status: true, priority: true } },
      _count: { select: { documents: true, academicResults: true, skillEvaluations: true, internships: true } },
      activityLogs: { where: { referenceType: "INTELLIGENCE_HUMAN_DECISION" }, orderBy: { eventDate: "desc" }, take: 5 }
    }
  });
  if (!beneficiary) notFound();

  const totalAttendance = beneficiary.attendanceRecords.length;
  const present = beneficiary.attendanceRecords.filter((item) => ["PRESENT", "LATE"].includes(item.status)).length;
  const absences = beneficiary.attendanceRecords.filter((item) => item.status === "ABSENT").length;
  const attendanceRate = totalAttendance ? Math.round((present / totalAttendance) * 100) : null;
  const required = [beneficiary.firstName, beneficiary.lastName, beneficiary.birthDate, beneficiary.masarNumber, beneficiary.phone, beneficiary.address, beneficiary.lastEducationLevel, beneficiary.personalProject, beneficiary.careerChoice1, beneficiary.admissionAssessment];
  const completionRate = Math.round((required.filter(Boolean).length / required.length) * 100);
  const openFollowUps = beneficiary.socialFollowUps.filter((item) => ["OPEN", "IN_PROGRESS"].includes(item.status)).length;
  const urgentFollowUps = beneficiary.socialFollowUps.filter((item) => item.priority === "URGENT" && ["OPEN", "IN_PROGRESS"].includes(item.status)).length;

  const report = buildBeneficiaryIntelligence({
    status: beneficiary.status,
    completionRate,
    attendanceRate,
    absenceCount: absences,
    documentsCount: beneficiary._count.documents,
    followUpsOpen: openFollowUps,
    urgentFollowUps,
    academicResultsCount: beneficiary._count.academicResults,
    skillsCount: beneficiary._count.skillEvaluations,
    internshipsCount: beneficiary._count.internships,
    hasAssessment: Boolean(beneficiary.admissionAssessment),
    motivationLevel: beneficiary.admissionAssessment?.motivationLevel,
    attendanceReadiness: beneficiary.admissionAssessment?.attendanceReadiness,
    strengths: beneficiary.strengths,
    priorityNeeds: beneficiary.priorityNeeds,
    careerGoal: beneficiary.careerGoal,
    careerChoice1: beneficiary.careerChoice1
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px] space-y-6" dir="rtl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-sm font-black text-violet-700">Intelligence Center 3.0</p><h1 className="mt-1 text-3xl font-black text-slate-950">التقرير الذكي للمستفيد</h1><p className="mt-2 text-sm leading-7 text-slate-600">تحليل مفسر من بيانات المنصة، يساعد المسؤول ولا يستبدل القرار المهني أو التربوي.</p></div>
          <div className="flex flex-wrap gap-2"><Link href={`/beneficiaries/${beneficiary.id}/smart-orientation`} className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-800">التوجيه الذكي</Link><Link href={`/beneficiaries/${beneficiary.id}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><ArrowRight size={17} /> ملف المستفيد</Link></div>
        </div>

        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-violet-950 via-indigo-950 to-slate-950 p-6 text-white shadow-xl md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr] xl:items-center">
            <div className="flex items-start gap-4"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10"><BrainCircuit size={32} /></span><div><p className="text-sm font-bold text-violet-300">{beneficiary.registrationNumber || beneficiary.id}</p><h2 className="mt-1 text-3xl font-black">{beneficiary.firstName} {beneficiary.lastName}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{report.summary}</p></div></div>
            <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4 text-center"><p className="text-xs text-slate-300">مستوى الخطر</p><p className="mt-2 text-2xl font-black">{riskLabels[report.riskLevel]}</p><p className="mt-1 text-xs text-slate-400">{report.riskScore}/100</p></div><div className="rounded-2xl bg-white/10 p-4 text-center"><p className="text-xs text-slate-300">جاهزية المسار</p><p className="mt-2 text-2xl font-black">{report.readinessScore}%</p><p className="mt-1 text-xs text-slate-400">ثقة {report.confidence}</p></div></div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[{ label: "اكتمال الملف", value: `${completionRate}%`, icon: FileText }, { label: "الحضور", value: attendanceRate === null ? "—" : `${attendanceRate}%`, icon: Gauge }, { label: "الغيابات", value: absences, icon: AlertTriangle }, { label: "المتابعات المفتوحة", value: openFollowUps, icon: ShieldAlert }].map(({ label, value, icon: Icon }) => <article key={label} className="app-card p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700"><Icon size={22} /></span></div></article>)}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="app-card p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="app-eyebrow">العوامل المفسرة</p><h3 className="mt-1 text-xl font-black text-slate-950">لماذا ظهرت هذه النتيجة؟</h3></div><span className={`rounded-full px-3 py-1 text-xs font-black ${riskClasses[report.riskLevel]}`}>{riskLabels[report.riskLevel]}</span></div><div className="space-y-3">{report.factors.map((factor) => <div key={`${factor.label}-${factor.detail}`} className={`rounded-2xl border p-4 ${factor.impact === "positive" ? "border-emerald-100 bg-emerald-50" : factor.impact === "critical" ? "border-red-100 bg-red-50" : "border-amber-100 bg-amber-50"}`}><p className="font-black text-slate-900">{factor.label}</p><p className="mt-1 text-sm leading-6 text-slate-600">{factor.detail}</p></div>)}</div></article>
          <article className="app-card p-5 md:p-6"><p className="app-eyebrow">خطة التدخل المقترحة</p><h3 className="mt-1 text-xl font-black text-slate-950">الخطوة التالية</h3><div className="mt-4 rounded-2xl bg-gradient-to-l from-violet-700 to-indigo-700 p-5 text-white"><Sparkles size={22} /><p className="mt-3 font-black leading-7">{report.nextAction}</p></div><div className="mt-4 space-y-2">{report.recommendations.map((item, index) => <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={15} /></span><p className="text-sm leading-6 text-slate-700">{index + 1}. {item}</p></div>)}</div></article>
        </section>

        <IntelligenceDecisionPanel beneficiaryId={beneficiary.id} recommendation={report.nextAction} />

        <section className="app-card p-5 md:p-6"><p className="app-eyebrow">سجل المراجعة</p><h3 className="mt-1 text-xl font-black text-slate-950">القرارات البشرية السابقة</h3><div className="mt-4 space-y-3">{beneficiary.activityLogs.length ? beneficiary.activityLogs.map((item) => <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="font-black text-slate-900">{item.title}</p><time className="text-xs text-slate-500">{item.eventDate.toLocaleString("ar-MA")}</time></div>{item.description && <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>}<p className="mt-2 text-xs text-slate-500">بواسطة: {item.actorName || "مسؤول الملف"}</p></div>) : <p className="empty-state">لم تُسجل مراجعة بشرية لهذا التقرير بعد.</p>}</div></section>
      </div>
    </AppShell>
  );
}
