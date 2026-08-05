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
  FileText,
  FolderOpen,
  GraduationCap,
  HeartHandshake,
  History,
  Printer,
  Upload,
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

const documentCategoryLabels: Record<string, string> = {
  IDENTITY: "الهوية",
  ENROLLMENT: "التسجيل",
  EDUCATION: "الدراسة",
  SOCIAL: "اجتماعي",
  TRAINING: "التكوين",
  INTERNSHIP: "التدريب",
  INTEGRATION: "الإدماج",
  OTHER: "أخرى"
};

const activityCategoryLabels: Record<string, string> = {
  REGISTRATION: "التسجيل",
  DIAGNOSIS: "التشخيص",
  ADMISSION: "القبول",
  ATTENDANCE: "الحضور",
  ASSESSMENT: "التقييم",
  SUPPORT: "الدعم",
  SOCIAL: "المواكبة الاجتماعية",
  TRAINING: "التكوين",
  INTERNSHIP: "التدريب",
  INTEGRATION: "الإدماج",
  DOCUMENT: "الوثائق",
  NOTE: "ملاحظة"
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

function fallbackFileNumber(id: string, createdAt: Date) {
  return `SC-${createdAt.getFullYear()}-CAS-${id.slice(-5).toUpperCase()}`;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      internships: { orderBy: { createdAt: "desc" }, take: 1 },
      documents: { orderBy: { createdAt: "desc" }, take: 6 },
      activityLogs: { orderBy: { eventDate: "desc" }, take: 8 }
    }
  });

  if (!beneficiary) notFound();

  const currentGroup = beneficiary.enrollments[0]?.group;
  const totalAttendance = beneficiary.attendanceRecords.length;
  const presentAttendance = beneficiary.attendanceRecords.filter((record) =>
    ["PRESENT", "LATE"].includes(record.status)
  ).length;
  const absenceCount = beneficiary.attendanceRecords.filter((record) => record.status === "ABSENT").length;
  const attendanceRate = totalAttendance ? Math.round((presentAttendance / totalAttendance) * 100) : 0;
  const currentStage = stageIndex[beneficiary.status] ?? 0;
  const registrationNumber = beneficiary.registrationNumber || fallbackFileNumber(beneficiary.id, beneficiary.createdAt);

  const completenessFields = [
    beneficiary.firstName,
    beneficiary.lastName,
    beneficiary.birthDate,
    beneficiary.masarNumber,
    beneficiary.phone,
    beneficiary.guardianPhone,
    beneficiary.address,
    beneficiary.lastEducationLevel,
    beneficiary.guardianName,
    beneficiary.lastSchoolName,
    beneficiary.dropoutReasons,
    beneficiary.personalProject,
    beneficiary.careerChoice1,
    beneficiary.admissionAssessment
  ];
  const completedFields = completenessFields.filter(Boolean).length;
  const completionRate = Math.round((completedFields / completenessFields.length) * 100);
  const missingFields = completenessFields.length - completedFields;

  const stages = [
    ["التسجيل", "#personal-data", UserRound],
    ["التشخيص", "#diagnosis", ClipboardCheck],
    ["القبول", "#diagnosis", Check],
    ["التكوين", "#training", GraduationCap],
    ["المواكبة", "#social", HeartHandshake],
    ["الإدماج", "#integration", BriefcaseBusiness]
  ] as const;

  const tabs = [
    ["#personal-data", "البيانات", UserRound],
    ["#documents", "الوثائق", FolderOpen],
    ["#diagnosis", "التشخيص", ClipboardCheck],
    ["#attendance", "الحضور", CalendarCheck],
    ["#academic", "التتبع التربوي", BookOpenCheck],
    ["#social", "المواكبة", HeartHandshake],
    ["#training", "التكوين", GraduationCap],
    ["#integration", "الإدماج", BriefcaseBusiness],
    ["#activity", "السجل", History]
  ] as const;

  return (
    <AppShell>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">الملف الإلكتروني الموحد</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">ملف المستفيد</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold hover:bg-slate-50"><Printer size={16} /> طباعة</button>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold hover:bg-slate-50"><FileText size={16} /> PDF</button>
          <a href="#documents" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold hover:bg-slate-50"><Upload size={16} /> وثيقة</a>
          <Link href="/beneficiaries" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"><ArrowRight size={16} /> العودة</Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-sm">
        <div className="grid gap-5 p-5 xl:grid-cols-[1.35fr_1fr] xl:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-black shadow-lg shadow-blue-950/30">
              {beneficiary.firstName.slice(0, 1)}{beneficiary.lastName.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-2xl font-bold">{beneficiary.firstName} {beneficiary.lastName}</h2>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold">{statusLabels[beneficiary.status] || beneficiary.status}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-300">
                <span>رقم التسجيل: <bdi className="font-mono font-bold text-white">{registrationNumber}</bdi></span>
                <span>رقم مسار: <bdi className="font-mono font-bold text-white">{beneficiary.masarNumber || "غير محدد"}</bdi></span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{currentGroup ? `${currentGroup.name} · ${currentGroup.specialty || currentGroup.track || "المسار غير محدد"}` : "لم يتم إسناده إلى مجموعة بعد"}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm"><span className="font-semibold">اكتمال الملف</span><span>{completionRate}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-blue-500" style={{ width: `${completionRate}%` }} /></div>
            <p className="mt-2 text-xs text-slate-400">{missingFields ? `بقي ${missingFields} عناصر أساسية لإكمال الملف.` : "البيانات الأساسية مكتملة."}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4 sm:grid-cols-4 xl:grid-cols-8">
          {[
            ["الحضور", `${attendanceRate}%`],
            ["الغيابات", absenceCount],
            ["الوثائق", beneficiary.documents.length],
            ["المتابعات", beneficiary.socialFollowUps.length],
            ["التقييمات", beneficiary.academicResults.length],
            ["المهارات", beneficiary.skillEvaluations.length],
            ["الأنشطة", beneficiary.activityLogs.length],
            ["آخر تحديث", beneficiary.updatedAt.toLocaleDateString("ar-MA")]
          ].map(([label, value]) => <div key={label} className="rounded-xl border border-white/5 bg-white/5 px-3 py-2.5"><p className="text-[11px] text-slate-400">{label}</p><p className="mt-1 text-base font-bold">{value}</p></div>)}
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="mb-3 text-xs font-semibold text-slate-400">رحلة المستفيد داخل البرنامج</p>
          <div className="flex min-w-max items-center gap-2 overflow-x-auto pb-1">
            {stages.map(([label, href, Icon], index) => {
              const completed = index < currentStage;
              const active = index === currentStage;
              return (
                <div key={label} className="flex items-center gap-2">
                  <a href={href} className={`flex min-w-32 items-center gap-2 rounded-xl border px-3 py-2 ${active ? "border-blue-400 bg-blue-500/20" : completed ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
                    <span className={`grid h-8 w-8 place-items-center rounded-lg ${active ? "bg-blue-500" : completed ? "bg-emerald-500" : "bg-white/10"}`}>{completed ? <Check size={15} /> : active ? <Icon size={15} /> : <Circle size={13} />}</span>
                    <div><p className="text-sm font-semibold">{label}</p><p className="text-[10px] text-slate-400">{completed ? "مكتملة" : active ? "الحالية" : "لاحقًا"}</p></div>
                  </a>
                  {index < stages.length - 1 && <span className="text-slate-600">←</span>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <nav className="sticky top-20 z-20 my-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
        {tabs.map(([href, label, Icon], index) => (
          <a key={href} href={href} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${index === 0 ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}><Icon size={16} /> {label}</a>
        ))}
      </nav>

      <section id="personal-data" className="scroll-mt-40">
        <div className="mb-4"><p className="text-sm font-semibold text-blue-600">القسم الأول</p><h2 className="text-2xl font-bold">البيانات الشخصية والاجتماعية والتربوية</h2></div>
        <BeneficiaryProfileForm beneficiary={beneficiary} />
      </section>

      <section id="documents" className="mt-10 scroll-mt-40 border-t border-slate-200 pt-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold text-blue-600">الوثائق الرقمية</p><h2 className="text-2xl font-bold">وثائق المستفيد</h2><p className="mt-2 text-slate-600">آخر الوثائق المحفوظة داخل الملف الإلكتروني.</p></div>
          <Link href={`/beneficiaries/${beneficiary.id}/documents`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Upload size={16} /> إدارة الوثائق</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {beneficiary.documents.length ? beneficiary.documents.map((document) => (
            <div key={document.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><FileText size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{document.title}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{document.fileName}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">{documentCategoryLabels[document.category] || document.category}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">{formatBytes(document.sizeBytes)}</span>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <p>{document.uploadedByName ? `رفعها: ${document.uploadedByName}` : "رُفعت إلكترونيًا"}</p>
                <p className="mt-1">{document.createdAt.toLocaleDateString("ar-MA")}</p>
              </div>
            </div>
          )) : <div className="md:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><FolderOpen className="mx-auto text-slate-400" size={36} /><p className="mt-3 font-semibold text-slate-700">لا توجد وثائق مرفوعة بعد.</p><p className="mt-1 text-sm text-slate-500">يمكن إضافة الوثائق من زر إدارة الوثائق.</p></div>}
        </div>
      </section>

      <section id="diagnosis" className="mt-10 scroll-mt-40 border-t border-slate-200 pt-8">
        <div className="mb-5"><p className="text-sm font-semibold text-blue-600">القبول والتوجيه</p><h2 className="text-2xl font-bold">المقابلة والتشخيص وقرار اللجنة</h2><p className="mt-2 text-slate-600">توثيق المقابلة والاختبارات والميولات المهنية وقرار لجنة القبول.</p></div>
        <AdmissionAssessmentForm beneficiaryId={beneficiary.id} assessment={beneficiary.admissionAssessment} />
      </section>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <section id="attendance" className="scroll-mt-40 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-blue-600">المواظبة</p><h3 className="mt-1 text-xl font-bold">الحضور والغياب</h3></div><CalendarCheck className="text-blue-600" /></div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">السجلات</p><p className="mt-1 text-2xl font-bold">{totalAttendance}</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs text-emerald-700">الحضور</p><p className="mt-1 text-2xl font-bold text-emerald-700">{presentAttendance}</p></div><div className="rounded-2xl bg-blue-50 p-4"><p className="text-xs text-blue-700">النسبة</p><p className="mt-1 text-2xl font-bold text-blue-700">{attendanceRate}%</p></div></div>
          <Link href="/attendance" className="mt-5 inline-flex text-sm font-semibold text-blue-700">فتح وحدة الحضور ←</Link>
        </section>

        <section id="academic" className="scroll-mt-40 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-blue-600">النتائج</p><h3 className="mt-1 text-xl font-bold">آخر التقييمات التربوية</h3></div><BookOpenCheck className="text-blue-600" /></div>
          <div className="mt-5 space-y-3">{beneficiary.academicResults.length ? beneficiary.academicResults.map((result) => <div key={result.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><p className="font-semibold">{result.assessment.title}</p><p className="text-xs text-slate-500">{result.assessment.subject}</p></div><p className="font-bold">{result.score ?? "—"}/{result.assessment.maxScore}</p></div>) : <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">لا توجد نتائج مسجلة بعد.</p>}</div>
          <Link href="/academic-tracking" className="mt-5 inline-flex text-sm font-semibold text-blue-700">فتح التتبع التربوي ←</Link>
        </section>

        <section id="social" className="scroll-mt-40 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-blue-600">الدعم الفردي</p><h3 className="mt-1 text-xl font-bold">المواكبة الاجتماعية</h3></div><HeartHandshake className="text-blue-600" /></div>
          <div className="mt-5 space-y-3">{beneficiary.socialFollowUps.length ? beneficiary.socialFollowUps.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><p className="font-semibold">{item.subject}</p><span className="text-xs text-slate-500">{item.eventDate.toLocaleDateString("ar-MA")}</span></div><p className="mt-1 text-xs text-slate-500">{item.status} · {item.priority}</p></div>) : <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">لم تُسجل مواكبة بعد.</p>}</div>
          <Link href="/social-support" className="mt-5 inline-flex text-sm font-semibold text-blue-700">فتح وحدة المواكبة ←</Link>
        </section>

        <section id="training" className="scroll-mt-40 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-blue-600">المهارات والمشروع</p><h3 className="mt-1 text-xl font-bold">التكوين المهني</h3></div><GraduationCap className="text-blue-600" /></div>
          <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">تقييمات المهارة</p><p className="mt-1 text-2xl font-bold">{beneficiary.skillEvaluations.length}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">المشروع المهني</p><p className="mt-1 text-sm font-bold">{beneficiary.vocationalProjects[0]?.title || "غير مسجل"}</p></div></div>
          <Link href="/vocational-training" className="mt-5 inline-flex text-sm font-semibold text-blue-700">فتح وحدة التكوين ←</Link>
        </section>
      </div>

      <section id="integration" className="mt-5 scroll-mt-40 rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-semibold text-blue-300">المرحلة النهائية</p><h3 className="mt-1 text-2xl font-bold">الإدماج المهني والتتبع</h3><p className="mt-2 max-w-2xl text-sm text-slate-300">{beneficiary.careerGoal || "لم يُحدد الهدف المهني بعد."}</p></div><div className="grid min-w-64 grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">التدريب</p><p className="mt-1 font-bold">{beneficiary.internships[0]?.organizationName || "غير مسجل"}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">المشروع</p><p className="mt-1 font-bold">{beneficiary.vocationalProjects[0]?.status || "غير مسجل"}</p></div></div></div>
        <Link href="/professional-integration" className="mt-5 inline-flex text-sm font-semibold text-blue-300">فتح وحدة الإدماج ←</Link>
      </section>

      <section id="activity" className="mt-10 scroll-mt-40 border-t border-slate-200 pt-8">
        <div className="mb-5"><p className="text-sm font-semibold text-blue-600">التتبع الزمني</p><h2 className="text-2xl font-bold">سجل العمليات والأنشطة</h2><p className="mt-2 text-slate-600">أحدث العمليات المرتبطة بملف المستفيد منذ التسجيل.</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {beneficiary.activityLogs.length ? <div className="space-y-1">{beneficiary.activityLogs.map((activity, index) => (
            <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
              {index < beneficiary.activityLogs.length - 1 && <span className="absolute right-[17px] top-9 h-[calc(100%-1.5rem)] w-px bg-slate-200" />}
              <span className="relative z-10 mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border-4 border-white bg-blue-600 text-white shadow-sm"><History size={14} /></span>
              <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-bold text-slate-900">{activity.title}</p><p className="mt-1 text-xs font-semibold text-blue-700">{activityCategoryLabels[activity.category] || activity.category}</p></div>
                  <time className="text-xs text-slate-500">{activity.eventDate.toLocaleDateString("ar-MA")} · {activity.eventDate.toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" })}</time>
                </div>
                {activity.description && <p className="mt-2 text-sm leading-6 text-slate-600">{activity.description}</p>}
                {activity.actorName && <p className="mt-2 text-xs text-slate-500">بواسطة: {activity.actorName}</p>}
              </div>
            </div>
          ))}</div> : <div className="py-8 text-center"><History className="mx-auto text-slate-400" size={36} /><p className="mt-3 font-semibold text-slate-700">لا توجد أنشطة مسجلة بعد.</p></div>}
        </div>
      </section>
    </AppShell>
  );
}
