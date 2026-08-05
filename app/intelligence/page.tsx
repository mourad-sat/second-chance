import Link from "next/link";
import { AlertTriangle, BrainCircuit, ChevronLeft, FileText, Gauge, ShieldAlert, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { buildBeneficiaryIntelligence } from "@/lib/beneficiary-intelligence";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function IntelligenceCenterPage() {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { archivedAt: null, deletedAt: null },
    include: {
      admissionAssessment: true,
      attendanceRecords: { select: { status: true } },
      socialFollowUps: { select: { status: true, priority: true } },
      _count: { select: { documents: true, academicResults: true, skillEvaluations: true, internships: true } }
    },
    orderBy: { updatedAt: "desc" },
    take: 300
  });

  const reports = beneficiaries.map((beneficiary) => {
    const total = beneficiary.attendanceRecords.length;
    const present = beneficiary.attendanceRecords.filter((item) => ["PRESENT", "LATE"].includes(item.status)).length;
    const absences = beneficiary.attendanceRecords.filter((item) => item.status === "ABSENT").length;
    const attendanceRate = total ? Math.round((present / total) * 100) : null;
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
    return { beneficiary, report, completionRate, attendanceRate };
  });

  const critical = reports.filter((item) => item.report.riskLevel === "CRITICAL");
  const high = reports.filter((item) => item.report.riskLevel === "HIGH");
  const medium = reports.filter((item) => item.report.riskLevel === "MEDIUM");
  const averageReadiness = reports.length ? Math.round(reports.reduce((sum, item) => sum + item.report.readinessScore, 0) / reports.length) : 0;
  const priorities = [...reports].sort((a, b) => b.report.riskScore - a.report.riskScore).slice(0, 12);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1550px] space-y-6" dir="rtl">
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-violet-950 via-indigo-950 to-slate-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-white/15"><Sparkles size={14} /> Intelligence Center 3.0</div><h1 className="mt-4 text-3xl font-black md:text-4xl">مركز التحليل ودعم القرار</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-violet-100">قراءة موحدة للمخاطر والجاهزية وأولويات التدخل، مبنية على البيانات الفعلية المسجلة. النتائج مؤشرات مساعدة وليست قرارات آلية.</p></div><div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-center"><BrainCircuit className="mx-auto" size={30} /><p className="mt-2 text-xs text-violet-200">ملفات محللة</p><p className="mt-1 text-3xl font-black">{reports.length}</p></div></div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[{ label: "إجمالي الملفات", value: reports.length, icon: Users, tone: "bg-blue-50 text-blue-700" }, { label: "خطر حرج", value: critical.length, icon: ShieldAlert, tone: "bg-red-50 text-red-700" }, { label: "خطر مرتفع", value: high.length, icon: AlertTriangle, tone: "bg-orange-50 text-orange-700" }, { label: "متابعة وقائية", value: medium.length, icon: FileText, tone: "bg-amber-50 text-amber-700" }, { label: "متوسط الجاهزية", value: `${averageReadiness}%`, icon: Gauge, tone: "bg-emerald-50 text-emerald-700" }].map(({ label, value, icon: Icon, tone }) => <article key={label} className="app-card p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div><span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon size={21} /></span></div></article>)}
        </section>

        <section className="app-card overflow-hidden">
          <div className="border-b border-slate-100 p-5 md:p-6"><p className="app-eyebrow">الأولوية التشغيلية</p><h2 className="mt-1 text-2xl font-black text-slate-950">الملفات الأكثر حاجة للتدخل</h2><p className="mt-2 text-sm text-slate-500">مرتبة حسب مجموع عوامل الخطر المسجلة، مع رابط للتقرير المفسر.</p></div>
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 md:p-6">{priorities.map(({ beneficiary, report, completionRate, attendanceRate }) => <article key={beneficiary.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><Link href={`/beneficiaries/${beneficiary.id}`} className="font-black text-slate-950 hover:text-violet-700">{beneficiary.firstName} {beneficiary.lastName}</Link><p className="mt-1 font-mono text-xs text-slate-500">{beneficiary.registrationNumber || beneficiary.id}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${report.riskLevel === "CRITICAL" ? "bg-red-100 text-red-800" : report.riskLevel === "HIGH" ? "bg-orange-100 text-orange-800" : report.riskLevel === "MEDIUM" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{report.riskScore}/100</span></div><p className="mt-4 text-sm leading-6 text-slate-600">{report.summary}</p><div className="mt-4 grid grid-cols-2 gap-2 text-center"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">اكتمال الملف</p><p className="mt-1 font-black">{completionRate}%</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">الحضور</p><p className="mt-1 font-black">{attendanceRate === null ? "—" : `${attendanceRate}%`}</p></div></div><Link href={`/beneficiaries/${beneficiary.id}/intelligence`} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-black text-white">فتح التقرير المفسر <ChevronLeft size={16} /></Link></article>)}</div>
        </section>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-950"><strong>ضابط الاستخدام:</strong> لا يجوز رفض مستفيد أو تغيير مساره أو اتخاذ إجراء تأديبي اعتمادًا على هذه المؤشرات وحدها. يجب الرجوع إلى الملف، والمقابلة، والسياق الاجتماعي، وتوثيق القرار البشري.</div>
      </div>
    </AppShell>
  );
}
