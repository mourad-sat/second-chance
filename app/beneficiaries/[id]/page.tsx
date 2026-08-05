import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarCheck,
  Check,
  Circle,
  ClipboardCheck,
  Edit3,
  FileText,
  FolderOpen,
  Gauge,
  GraduationCap,
  HeartHandshake,
  History,
  LayoutDashboard,
  Mail,
  MapPin,
  Phone,
  Printer,
  ShieldAlert,
  Sparkles,
  Upload,
  UserCheck,
  UserRound
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BeneficiaryProfileForm } from "@/components/BeneficiaryProfileForm";
import { AdmissionAssessmentForm } from "@/components/AdmissionAssessmentForm";
import { BeneficiaryQuickActions } from "@/components/BeneficiaryQuickActions";
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

const statusTone: Record<string, string> = {
  PRE_REGISTERED: "border-slate-400/30 bg-slate-400/15 text-slate-100",
  UNDER_REVIEW: "border-amber-300/30 bg-amber-300/15 text-amber-100",
  WAITLISTED: "border-orange-300/30 bg-orange-300/15 text-orange-100",
  ACCEPTED: "border-emerald-300/30 bg-emerald-300/15 text-emerald-100",
  REJECTED: "border-red-300/30 bg-red-300/15 text-red-100",
  ENROLLED: "border-blue-300/30 bg-blue-300/15 text-blue-100",
  WITHDRAWN: "border-rose-300/30 bg-rose-300/15 text-rose-100",
  COMPLETED: "border-violet-300/30 bg-violet-300/15 text-violet-100"
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
  const presentAttendance = beneficiary.attendanceRecords.filter((record) => ["PRESENT", "LATE"].includes(record.status)).length;
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

  let riskPoints = 0;
  if (absenceCount >= 8) riskPoints += 3;
  else if (absenceCount >= 3) riskPoints += 2;
  if (completionRate < 55) riskPoints += 2;
  if (!beneficiary.documents.length) riskPoints += 1;
  if (["WITHDRAWN", "REJECTED"].includes(beneficiary.status)) riskPoints += 2;
  const risk = riskPoints >= 4
    ? { label: "مرتفع", className: "border-red-400/30 bg-red-400/15 text-red-100", panel: "border-red-200 bg-red-50 text-red-800" }
    : riskPoints >= 2
      ? { label: "متوسط", className: "border-amber-400/30 bg-amber-400/15 text-amber-100", panel: "border-amber-200 bg-amber-50 text-amber-800" }
      : { label: "منخفض", className: "border-emerald-400/30 bg-emerald-400/15 text-emerald-100", panel: "border-emerald-200 bg-emerald-50 text-emerald-800" };

  const nextAction = !beneficiary.masarNumber || !beneficiary.phone
    ? "استكمال البيانات الأساسية"
    : !beneficiary.documents.length
      ? "رفع الوثائق الأساسية"
      : !beneficiary.admissionAssessment
        ? "إنجاز مقابلة التشخيص"
        : !currentGroup
          ? "إسناد المستفيد إلى مجموعة"
          : absenceCount >= 3
            ? "برمجة تدخل للحد من الغياب"
            : beneficiary.status === "ENROLLED"
              ? "متابعة التكوين والاستعداد للإدماج"
              : beneficiary.status === "COMPLETED"
                ? "متابعة ما بعد الإدماج"
                : "مراجعة المرحلة التالية في سير الملف";

  const stages = [
    ["التسجيل", "#personal-data", UserRound],
    ["التشخيص", "#diagnosis", ClipboardCheck],
    ["القبول", "#diagnosis", UserCheck],
    ["التكوين", "#training", GraduationCap],
    ["المواكبة", "#social", HeartHandshake],
    ["الإدماج", "#integration", BriefcaseBusiness]
  ] as const;

  const tabs = [
    ["#overview", "الملخص", LayoutDashboard],
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
      <BeneficiaryQuickActions
        beneficiaryId={beneficiary.id}
        fullName={`${beneficiary.firstName} ${beneficiary.lastName}`}
        registrationNumber={registrationNumber}
        status={beneficiary.status}
      />

      <div id="overview" className="scroll-mt-36 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700"><Sparkles size={13} /> Beneficiary Profile 3.0</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">مركز قيادة المستفيد</h1>
            <p className="mt-2 text-sm text-slate-500">رؤية موحدة للهوية، سير الملف، الحضور، الوثائق، المواكبة والتوجيه.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="#personal-data" className="btn-secondary inline-flex items-center gap-2"><Edit3 size={16} /> تعديل البيانات</a>
            <Link href={`/beneficiaries/${beneficiary.id}/documents`} className="btn-secondary inline-flex items-center gap-2"><Upload size={16} /> رفع وثيقة</Link>
            <Link href={`/beneficiaries/${beneficiary.id}/smart-orientation`} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-violet-800"><BrainCircuit size={16} /> التوجيه الذكي</Link>
            <button type="button" className="btn-secondary inline-flex items-center gap-2"><Printer size={16} /> طباعة</button>
            <Link href="/beneficiaries" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"><ArrowRight size={16} /> العودة</Link>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 via-blue-950 to-blue-900 text-white shadow-2xl shadow-blue-950/15">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute -bottom-28 right-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative grid gap-6 p-5 md:p-7 xl:grid-cols-[1.35fr_0.9fr] xl:items-center">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {beneficiary.profilePhotoUrl ? (
                <img src={beneficiary.profilePhotoUrl} alt={`صورة ${beneficiary.firstName} ${beneficiary.lastName}`} className="h-28 w-28 shrink-0 rounded-[1.75rem] object-cover ring-4 ring-white/15 shadow-2xl" />
              ) : (
                <div className="grid h-28 w-28 shrink-0 place-items-center rounded-[1.75rem] bg-gradient-to-br from-blue-500 to-cyan-500 text-3xl font-black ring-4 ring-white/10 shadow-2xl">
                  {beneficiary.firstName.slice(0, 1)}{beneficiary.lastName.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-black md:text-3xl">{beneficiary.firstName} {beneficiary.lastName}</h2>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone[beneficiary.status] || statusTone.PRE_REGISTERED}`}>{statusLabels[beneficiary.status] || beneficiary.status}</span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${risk.className}`}>الخطر: {risk.label}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-blue-100">
                  <span>رقم التسجيل: <bdi className="font-mono font-black text-white">{registrationNumber}</bdi></span>
                  <span>رقم مسار: <bdi className="font-mono font-black text-white">{beneficiary.masarNumber || "غير محدد"}</bdi></span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{currentGroup ? `${currentGroup.name} · ${currentGroup.specialty || currentGroup.track || "المسار غير محدد"}` : "لم يتم إسناده إلى مجموعة بعد"}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                  {beneficiary.phone && <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/8 px-3 py-2"><Phone size={13} /> {beneficiary.phone}</span>}
                  {beneficiary.email && <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/8 px-3 py-2"><Mail size={13} /> {beneficiary.email}</span>}
                  {(beneficiary.commune || beneficiary.province) && <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/8 px-3 py-2"><MapPin size={13} /> {[beneficiary.commune, beneficiary.province].filter(Boolean).join("، ")}</span>}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold text-blue-200">جاهزية الملف</p><p className="mt-1 text-3xl font-black">{completionRate}%</p></div><Gauge size={34} className="text-cyan-300" /></div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-l from-emerald-400 via-cyan-400 to-blue-500" style={{ width: `${completionRate}%` }} /></div>
              <p className="mt-3 text-xs leading-5 text-slate-300">{missingFields ? `بقي ${missingFields} عناصر أساسية لإكمال الملف.` : "البيانات الأساسية مكتملة."}</p>
              <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3"><p className="text-[11px] font-bold text-cyan-200">الإجراء التالي المقترح</p><p className="mt-1 text-sm font-black text-white">{nextAction}</p></div>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-2 border-t border-white/10 p-4 sm:grid-cols-4 xl:grid-cols-8">
            {[
              ["الحضور", `${attendanceRate}%`],
              ["الغيابات", absenceCount],
              ["الوثائق", beneficiary.documents.length],
              ["المتابعات", beneficiary.socialFollowUps.length],
              ["التقييمات", beneficiary.academicResults.length],
              ["المهارات", beneficiary.skillEvaluations.length],
              ["الأنشطة", beneficiary.activityLogs.length],
              ["آخر تحديث", beneficiary.updatedAt.toLocaleDateString("ar-MA")]
            ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white/5 bg-white/5 px-3 py-3"><p className="text-[11px] text-slate-400">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>)}
          </div>

          <div className="relative border-t border-white/10 px-4 py-5 md:px-7">
            <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-black text-slate-300">رحلة المستفيد داخل البرنامج</p><span className="text-xs text-blue-200">المرحلة {currentStage + 1} من {stages.length}</span></div>
            <div className="flex min-w-max items-center gap-2 overflow-x-auto pb-1">
              {stages.map(([label, href, Icon], index) => {
                const completed = index < currentStage;
                const active = index === currentStage;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <a href={href} className={`flex min-w-36 items-center gap-2 rounded-2xl border px-3 py-3 transition ${active ? "border-blue-300/50 bg-blue-400/20 shadow-lg shadow-blue-950/20" : completed ? "border-emerald-400/30 bg-emerald-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                      <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-blue-500" : completed ? "bg-emerald-500" : "bg-white/10"}`}>{completed ? <Check size={16} /> : active ? <Icon size={16} /> : <Circle size={14} />}</span>
                      <div><p className="text-sm font-black">{label}</p><p className="text-[10px] text-slate-400">{completed ? "مكتملة" : active ? "المرحلة الحالية" : "مرحلة لاحقة"}</p></div>
                    </a>
                    {index < stages.length - 1 && <span className="text-slate-600">←</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="app-card p-5 md:p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="app-eyebrow">الملخص التنفيذي</p><h3 className="mt-1 text-xl font-black text-slate-950">ما يحتاجه الفريق الآن</h3></div><UserCheck className="text-blue-700" size={22} /></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-blue-50 p-4"><p className="text-xs font-bold text-blue-700">نقطة القوة</p><p className="mt-2 text-sm font-black text-slate-900">{beneficiary.strengths || beneficiary.personalProject || "تحتاج إلى توثيق"}</p></div>
              <div className="rounded-2xl bg-amber-50 p-4"><p className="text-xs font-bold text-amber-700">الحاجة ذات الأولوية</p><p className="mt-2 text-sm font-black text-slate-900">{beneficiary.priorityNeeds || (absenceCount >= 3 ? "دعم المواظبة والحضور" : "تحتاج إلى تحديد")}</p></div>
              <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-700">الهدف المهني</p><p className="mt-2 text-sm font-black text-slate-900">{beneficiary.careerGoal || beneficiary.careerChoice1 || "غير محدد"}</p></div>
            </div>
          </article>

          <article className={`rounded-3xl border p-5 shadow-sm ${risk.panel}`}>
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black">تحليل المخاطر</p><h3 className="mt-1 text-xl font-black">مستوى الخطر: {risk.label}</h3></div><ShieldAlert size={24} /></div>
            <p className="mt-4 text-sm leading-7">{absenceCount >= 3 ? `سُجلت ${absenceCount} حالات غياب، ويُنصح بتدخل سريع مع المستفيد والأسرة.` : completionRate < 70 ? "ينبغي استكمال عناصر الملف لضمان دقة التوجيه والمتابعة." : "لا توجد إشارات حرجة حاليًا، مع الاستمرار في المتابعة الدورية."}</p>
            <Link href={`/beneficiaries/${beneficiary.id}/smart-orientation`} className="mt-4 inline-flex items-center gap-2 text-sm font-black underline underline-offset-4"><BrainCircuit size={16} /> فتح التحليل والتوجيه الذكي</Link>
          </article>
        </section>
      </div>

      <nav className="sticky top-[7.8rem] z-20 my-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg shadow-slate-200/40 backdrop-blur-xl">
        {tabs.map(([href, label, Icon], index) => (
          <a key={href} href={href} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${index === 0 ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}><Icon size={16} /> {label}</a>
        ))}
      </nav>

      <section id="personal-data" className="scroll-mt-44">
        <div className="mb-4"><p className="app-eyebrow">المعلومات الأساسية</p><h2 className="mt-1 text-2xl font-black text-slate-950">البيانات الشخصية والاجتماعية والتربوية</h2></div>
        <BeneficiaryProfileForm beneficiary={beneficiary} />
      </section>

      <section id="documents" className="mt-10 scroll-mt-44 border-t border-slate-200 pt-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="app-eyebrow">الوثائق الرقمية</p><h2 className="mt-1 text-2xl font-black text-slate-950">وثائق المستفيد</h2><p className="mt-2 text-slate-600">آخر الوثائق المحفوظة داخل الملف الإلكتروني.</p></div>
          <Link href={`/beneficiaries/${beneficiary.id}/documents`} className="btn-primary inline-flex items-center justify-center gap-2"><Upload size={16} /> إدارة الوثائق</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {beneficiary.documents.length ? beneficiary.documents.map((document) => (
            <div key={document.id} className="app-card p-4">
              <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><FileText size={20} /></span><div className="min-w-0 flex-1"><p className="truncate font-black text-slate-900">{document.title}</p><p className="mt-1 truncate text-xs text-slate-500">{document.fileName}</p></div></div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px]"><span className="status-badge status-info">{documentCategoryLabels[document.category] || document.category}</span><span className="status-badge bg-slate-100 text-slate-600">{formatBytes(document.sizeBytes)}</span></div>
              <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500"><p>{document.uploadedByName ? `رفعها: ${document.uploadedByName}` : "رُفعت إلكترونيًا"}</p><p className="mt-1">{document.createdAt.toLocaleDateString("ar-MA")}</p></div>
            </div>
          )) : <div className="empty-state md:col-span-2 xl:col-span-3"><FolderOpen className="mx-auto text-slate-400" size={36} /><p className="mt-3 font-black text-slate-700">لا توجد وثائق مرفوعة بعد.</p><p className="mt-1 text-sm text-slate-500">يمكن إضافة الوثائق من زر إدارة الوثائق.</p></div>}
        </div>
      </section>

      <section id="diagnosis" className="mt-10 scroll-mt-44 border-t border-slate-200 pt-8">
        <div className="mb-5"><p className="app-eyebrow">القبول والتوجيه</p><h2 className="mt-1 text-2xl font-black text-slate-950">المقابلة والتشخيص وقرار اللجنة</h2><p className="mt-2 text-slate-600">توثيق المقابلة والاختبارات والميولات المهنية وقرار لجنة القبول.</p></div>
        <AdmissionAssessmentForm beneficiaryId={beneficiary.id} assessment={beneficiary.admissionAssessment} />
      </section>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <section id="attendance" className="app-card scroll-mt-44 p-6">
          <div className="flex items-center justify-between"><div><p className="app-eyebrow">المواظبة</p><h3 className="mt-1 text-xl font-black">الحضور والغياب</h3></div><CalendarCheck className="text-blue-600" /></div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">السجلات</p><p className="mt-1 text-2xl font-black">{totalAttendance}</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs text-emerald-700">الحضور</p><p className="mt-1 text-2xl font-black text-emerald-700">{presentAttendance}</p></div><div className="rounded-2xl bg-blue-50 p-4"><p className="text-xs text-blue-700">النسبة</p><p className="mt-1 text-2xl font-black text-blue-700">{attendanceRate}%</p></div></div>
          <Link href="/attendance" className="mt-5 inline-flex text-sm font-black text-blue-700">فتح وحدة الحضور ←</Link>
        </section>

        <section id="academic" className="app-card scroll-mt-44 p-6">
          <div className="flex items-center justify-between"><div><p className="app-eyebrow">النتائج</p><h3 className="mt-1 text-xl font-black">آخر التقييمات التربوية</h3></div><BookOpenCheck className="text-blue-600" /></div>
          <div className="mt-5 space-y-3">{beneficiary.academicResults.length ? beneficiary.academicResults.map((result) => <div key={result.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><p className="font-black">{result.assessment.title}</p><p className="text-xs text-slate-500">{result.assessment.subject}</p></div><p className="font-black">{result.score ?? "—"}/{result.assessment.maxScore}</p></div>) : <p className="empty-state text-sm text-slate-500">لا توجد نتائج مسجلة بعد.</p>}</div>
          <Link href="/academic-tracking" className="mt-5 inline-flex text-sm font-black text-blue-700">فتح التتبع التربوي ←</Link>
        </section>

        <section id="social" className="app-card scroll-mt-44 p-6">
          <div className="flex items-center justify-between"><div><p className="app-eyebrow">الدعم الفردي</p><h3 className="mt-1 text-xl font-black">المواكبة الاجتماعية</h3></div><HeartHandshake className="text-blue-600" /></div>
          <div className="mt-5 space-y-3">{beneficiary.socialFollowUps.length ? beneficiary.socialFollowUps.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><p className="font-black">{item.subject}</p><span className="text-xs text-slate-500">{item.eventDate.toLocaleDateString("ar-MA")}</span></div><p className="mt-1 text-xs text-slate-500">{item.status} · {item.priority}</p></div>) : <p className="empty-state text-sm text-slate-500">لم تُسجل مواكبة بعد.</p>}</div>
          <Link href="/social-support" className="mt-5 inline-flex text-sm font-black text-blue-700">فتح وحدة المواكبة ←</Link>
        </section>

        <section id="training" className="app-card scroll-mt-44 p-6">
          <div className="flex items-center justify-between"><div><p className="app-eyebrow">المهارات والمشروع</p><h3 className="mt-1 text-xl font-black">التكوين المهني</h3></div><GraduationCap className="text-blue-600" /></div>
          <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">تقييمات المهارة</p><p className="mt-1 text-2xl font-black">{beneficiary.skillEvaluations.length}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">المشروع المهني</p><p className="mt-1 text-sm font-black">{beneficiary.vocationalProjects[0]?.title || "غير مسجل"}</p></div></div>
          <Link href="/vocational-training" className="mt-5 inline-flex text-sm font-black text-blue-700">فتح وحدة التكوين ←</Link>
        </section>
      </div>

      <section id="integration" className="mt-5 scroll-mt-44 rounded-[2rem] bg-gradient-to-l from-slate-950 to-blue-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-black text-blue-300">المرحلة النهائية</p><h3 className="mt-1 text-2xl font-black">الإدماج المهني والتتبع</h3><p className="mt-2 max-w-2xl text-sm text-slate-300">{beneficiary.careerGoal || "لم يُحدد الهدف المهني بعد."}</p></div><div className="grid min-w-64 grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">التدريب</p><p className="mt-1 font-black">{beneficiary.internships[0]?.organizationName || "غير مسجل"}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">المشروع</p><p className="mt-1 font-black">{beneficiary.vocationalProjects[0]?.status || "غير مسجل"}</p></div></div></div>
        <Link href="/integration" className="mt-5 inline-flex text-sm font-black text-blue-300">فتح وحدة الإدماج ←</Link>
      </section>

      <section id="activity" className="mt-10 scroll-mt-44 border-t border-slate-200 pt-8">
        <div className="mb-5"><p className="app-eyebrow">التتبع الزمني</p><h2 className="mt-1 text-2xl font-black text-slate-950">سجل العمليات والأنشطة</h2><p className="mt-2 text-slate-600">أحدث العمليات المرتبطة بملف المستفيد منذ التسجيل.</p></div>
        <div className="app-card p-5 sm:p-6">
          {beneficiary.activityLogs.length ? <div className="space-y-1">{beneficiary.activityLogs.map((activity, index) => (
            <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
              {index < beneficiary.activityLogs.length - 1 && <span className="absolute right-[17px] top-9 h-[calc(100%-1.5rem)] w-px bg-slate-200" />}
              <span className="relative z-10 mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border-4 border-white bg-blue-600 text-white shadow-sm"><History size={14} /></span>
              <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-900">{activity.title}</p><p className="mt-1 text-xs font-black text-blue-700">{activityCategoryLabels[activity.category] || activity.category}</p></div><time className="text-xs text-slate-500">{activity.eventDate.toLocaleDateString("ar-MA")} · {activity.eventDate.toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" })}</time></div>
                {activity.description && <p className="mt-2 text-sm leading-6 text-slate-600">{activity.description}</p>}
                {activity.actorName && <p className="mt-2 text-xs text-slate-500">بواسطة: {activity.actorName}</p>}
              </div>
            </div>
          ))}</div> : <div className="py-8 text-center"><History className="mx-auto text-slate-400" size={36} /><p className="mt-3 font-black text-slate-700">لا توجد أنشطة مسجلة بعد.</p></div>}
        </div>
      </section>
    </AppShell>
  );
}
