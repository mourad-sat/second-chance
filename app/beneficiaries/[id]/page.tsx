import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck,
  Check,
  Circle,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  UserRound
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BeneficiaryProfileForm } from "@/components/BeneficiaryProfileForm";
import { AdmissionAssessmentForm } from "@/components/AdmissionAssessmentForm";
import { prisma } from "@/lib/prisma";

const statusLabels: Record<string, string> = {
  PRE_REGISTERED: "مسجل أوليًا",
  UNDER_REVIEW: "قيد دراسة الملف",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "مقبول",
  REJECTED: "غير مقبول",
  ENROLLED: "متمدرس",
  WITHDRAWN: "منسحب",
  COMPLETED: "أنهى البرنامج"
};

const stageIndex: Record<string, number> = {
  PRE_REGISTERED: 0,
  UNDER_REVIEW: 1,
  WAITLISTED: 2,
  ACCEPTED: 2,
  REJECTED: 2,
  ENROLLED: 3,
  WITHDRAWN: 3,
  COMPLETED: 5
};

function fileNumber(id: string, createdAt: Date) {
  return `SC-${createdAt.getFullYear()}-CAS-${id.slice(-5).toUpperCase()}`;
}

export const dynamic = "force-dynamic";

export default async function BeneficiaryProfilePage({ params }: { params: { id: string } }) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id },
    include: {
      admissionAssessment: true,
      enrollments: { include: { group: true }, orderBy: { enrolledAt: "desc" }, take: 1 },
      attendanceRecords: { select: { status: true } },
      socialFollowUps: { orderBy: { eventDate: "desc" }, take: 3 },
      academicResults: { include: { assessment: true }, orderBy: { createdAt: "desc" }, take: 3 },
      skillEvaluations: { orderBy: { evaluationDate: "desc" }, take: 3 },
      vocationalProjects: { orderBy: { createdAt: "desc" }, take: 1 },
      internships: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });

  if (!beneficiary) notFound();

  const currentGroup = beneficiary.enrollments[0]?.group;
  const totalAttendance = beneficiary.attendanceRecords.length;
  const presentAttendance = beneficiary.attendanceRecords.filter((record) =>
    ["PRESENT", "LATE"].includes(record.status)
  ).length;
  const attendanceRate = totalAttendance ? Math.round((presentAttendance / totalAttendance) * 100) : 0;
  const currentStage = stageIndex[beneficiary.status] ?? 0;

  const stages = [
    ["التسجيل", UserRound],
    ["التشخيص", ClipboardCheck],
    ["القبول", Check],
    ["التكوين", GraduationCap],
    ["المواكبة", HeartHandshake],
    ["الإدماج", BriefcaseBusiness]
  ] as const;

  const quickTabs = [
    ["#personal-data", "البيانات", UserRound],
    ["#diagnosis", "التشخيص", ClipboardCheck],
    ["#attendance", "الحضور", CalendarCheck],
    ["#academic", "التتبع التربوي", BookOpenCheck],
    ["#social", "المواكبة", HeartHandshake],
    ["#training", "التكوين", GraduationCap],
    ["#integration", "الإدماج", BriefcaseBusiness]
  ] as const;

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">الملف الرقمي الموحد</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">ملف المستفيد</h1>
        </div>
        <Link href="/beneficiaries" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
          <ArrowRight size={17} /> العودة إلى المستفيدين
        </Link>
      </div>

      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-blue-600 text-2xl font-bold">
              {beneficiary.firstName.slice(0, 1)}{beneficiary.lastName.slice(0, 1)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">{beneficiary.firstName} {beneficiary.lastName}</h2>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  {statusLabels[beneficiary.status] || beneficiary.status}
                </span>
              </div>
              <p className="mt-2 font-mono text-sm text-slate-300">{fileNumber(beneficiary.id, beneficiary.createdAt)}</p>
              <p className="mt-2 text-sm text-slate-300">
                {currentGroup ? `${currentGroup.name} · ${currentGroup.specialty || currentGroup.track || "المسار غير محدد"}` : "لم يتم إسناده إلى مجموعة بعد"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">الحضور</p><p className="mt-1 text-xl font-bold">{attendanceRate}%</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">المتابعات</p><p className="mt-1 text-xl font-bold">{beneficiary.socialFollowUps.length}</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">التقييمات</p><p className="mt-1 text-xl font-bold">{beneficiary.academicResults.length}</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">المهارات</p><p className="mt-1 text-xl font-bold">{beneficiary.skillEvaluations.length}</p></div>
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-5">
          <p className="mb-4 text-sm font-semibold text-slate-300">رحلة المستفيد داخل البرنامج</p>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {stages.map(([label, Icon], index) => {
              const completed = index < currentStage;
              const active = index === currentStage;
              return (
                <div key={label} className={`flex items-center gap-3 rounded-2xl border p-3 ${active ? "border-blue-400 bg-blue-500/20" : completed ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
                  <span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? "bg-blue-500" : completed ? "bg-emerald-500" : "bg-white/10"}`}>
                    {completed ? <Check size={16} /> : active ? <Icon size={16} /> : <Circle size={14} />}
                  </span>
                  <div><p className="text-sm font-semibold">{label}</p><p className="text-[11px] text-slate-400">{completed ? "مكتملة" : active ? "المرحلة الحالية" : "لاحقًا"}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <nav className="my-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {quickTabs.map(([href, label, Icon]) => (
          <a key={href} href={href} className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700">
            <Icon size={16} /> {label}
          </a>
        ))}
      </nav>

      <section id="personal-data" className="scroll-mt-24">
        <div className="mb-4"><p className="text-sm text-blue-600">القسم الأول</p><h2 className="text-2xl font-bold">البيانات الشخصية والاجتماعية والتربوية</h2></div>
        <BeneficiaryProfileForm beneficiary={beneficiary} />
      </section>

      <section id="diagnosis" className="mt-10 scroll-mt-24 border-t border-slate-200 pt-8">
        <div className="mb-5"><p className="text-sm text-blue-600">القسم الثاني</p><h2 className="text-2xl font-bold">القبول والتشخيص والتوجيه</h2><p className="mt-2 text-slate-600">توثيق المقابلة والاختبارات والميولات المهنية وقرار لجنة القبول.</p></div>
        <AdmissionAssessmentForm beneficiaryId={beneficiary.id} assessment={beneficiary.admissionAssessment} />
      </section>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <section id="attendance" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><p className="text-sm text-blue-600">المواظبة</p><h3 className="mt-1 text-xl font-bold">الحضور والغياب</h3></div><CalendarCheck className="text-blue-600" /></div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">السجلات</p><p className="mt-1 text-2xl font-bold">{totalAttendance}</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs text-emerald-700">الحضور</p><p className="mt-1 text-2xl font-bold text-emerald-700">{presentAttendance}</p></div><div className="rounded-2xl bg-blue-50 p-4"><p className="text-xs text-blue-700">النسبة</p><p className="mt-1 text-2xl font-bold text-blue-700">{attendanceRate}%</p></div></div>
          <Link href="/attendance" className="mt-5 inline-flex text-sm font-semibold text-blue-700">فتح وحدة الحضور ←</Link>
        </section>

        <section id="academic" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><p className="text-sm text-blue-600">النتائج</p><h3 className="mt-1 text-xl font-bold">آخر التقييمات التربوية</h3></div><BookOpenCheck className="text-blue-600" /></div>
          <div className="mt-5 space-y-3">{beneficiary.academicResults.length ? beneficiary.academicResults.map((result) => <div key={result.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><p className="font-semibold">{result.assessment.title}</p><p className="text-xs text-slate-500">{result.assessment.subject}</p></div><p className="font-bold">{result.score ?? "—"}/{result.assessment.maxScore}</p></div>) : <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">لا توجد نتائج مسجلة بعد.</p>}</div>
          <Link href="/academic-tracking" className="mt-5 inline-flex text-sm font-semibold text-blue-700">فتح التتبع التربوي ←</Link>
        </section>

        <section id="social" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><p className="text-sm text-blue-600">الدعم الفردي</p><h3 className="mt-1 text-xl font-bold">المواكبة الاجتماعية</h3></div><HeartHandshake className="text-blue-600" /></div>
          <div className="mt-5 space-y-3">{beneficiary.socialFollowUps.length ? beneficiary.socialFollowUps.map((followUp) => <div key={followUp.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><p className="font-semibold">{followUp.subject}</p><span className="text-xs text-slate-500">{followUp.eventDate.toLocaleDateString("ar-MA")}</span></div><p className="mt-1 text-xs text-slate-500">{followUp.status} · {followUp.priority}</p></div>) : <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">لم تُسجل مواكبة بعد.</p>}</div>
          <Link href="/social-support" className="mt-5 inline-flex text-sm font-semibold text-blue-700">فتح وحدة المواكبة ←</Link>
        </section>

        <section id="training" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><p className="text-sm text-blue-600">المهارات والمشروع</p><h3 className="mt-1 text-xl font-bold">التكوين المهني</h3></div><GraduationCap className="text-blue-600" /></div>
          <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">تقييمات المهارة</p><p className="mt-1 text-2xl font-bold">{beneficiary.skillEvaluations.length}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">المشروع المهني</p><p className="mt-1 text-sm font-bold">{beneficiary.vocationalProjects[0]?.title || "غير مسجل"}</p></div></div>
          <Link href="/vocational-training" className="mt-5 inline-flex text-sm font-semibold text-blue-700">فتح وحدة التكوين ←</Link>
        </section>

        <section id="integration" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between"><div><p className="text-sm text-blue-600">الانتقال إلى الحياة المهنية</p><h3 className="mt-1 text-xl font-bold">الإدماج والتدريب الميداني</h3></div><BriefcaseBusiness className="text-blue-600" /></div>
          <div className="mt-5 grid gap-4 md:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">التدريب الحالي</p><p className="mt-2 font-bold">{beneficiary.internships[0]?.organizationName || "غير مسجل"}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">حالة التدريب</p><p className="mt-2 font-bold">{beneficiary.internships[0]?.status || "—"}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">الهدف المهني</p><p className="mt-2 font-bold">{beneficiary.careerGoal || "غير محدد"}</p></div></div>
          <Link href="/professional-integration" className="mt-5 inline-flex text-sm font-semibold text-blue-700">فتح وحدة الإدماج ←</Link>
        </section>
      </div>
    </AppShell>
  );
}
