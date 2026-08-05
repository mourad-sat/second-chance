import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  FolderOpen,
  GraduationCap,
  HeartHandshake,
  History,
  Sparkles
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BeneficiaryProfileHeroV2 } from "@/components/BeneficiaryProfileHeroV2";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

function fallbackNumber(id: string, createdAt: Date) {
  return `SC-${createdAt.getFullYear()}-CAS-${id.slice(-5).toUpperCase()}`;
}

function getNextAction(status: string, documents: number, hasAssessment: boolean, hasGroup: boolean) {
  if (documents === 0) return "استكمال الوثائق الأساسية للملف.";
  if (!hasAssessment) return "إنجاز المقابلة والتشخيص الأولي.";
  if (["PRE_REGISTERED", "UNDER_REVIEW"].includes(status)) return "عرض الملف على لجنة القبول واتخاذ القرار.";
  if (["ACCEPTED", "WAITLISTED"].includes(status) && !hasGroup) return "تحديد المسار وإسناد المستفيد إلى مجموعة.";
  if (status === "ENROLLED") return "متابعة المواظبة والتقدم التربوي والمهني.";
  if (status === "COMPLETED") return "توثيق الإدماج والمتابعة بعد التخرج.";
  return "مراجعة الملف وتحديد الإجراء المناسب.";
}

export default async function BeneficiaryOverviewPage({ params }: { params: { id: string } }) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id },
    include: {
      admissionAssessment: true,
      enrollments: { where: { leftAt: null }, include: { group: true }, orderBy: { enrolledAt: "desc" }, take: 1 },
      attendanceRecords: { select: { status: true } },
      documents: { orderBy: { createdAt: "desc" }, take: 5 },
      socialFollowUps: { orderBy: { eventDate: "desc" }, take: 4 },
      academicResults: { include: { assessment: true }, orderBy: { createdAt: "desc" }, take: 4 },
      activityLogs: { orderBy: { eventDate: "desc" }, take: 7 },
      skillEvaluations: { orderBy: { evaluationDate: "desc" }, take: 4 },
      vocationalProjects: { orderBy: { createdAt: "desc" }, take: 1 },
      internships: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });

  if (!beneficiary) notFound();

  const group = beneficiary.enrollments[0]?.group;
  const totalAttendance = beneficiary.attendanceRecords.length;
  const attended = beneficiary.attendanceRecords.filter((item) => ["PRESENT", "LATE"].includes(item.status)).length;
  const absences = beneficiary.attendanceRecords.filter((item) => item.status === "ABSENT").length;
  const attendanceRate = totalAttendance ? Math.round((attended / totalAttendance) * 100) : 0;

  const completionValues = [
    beneficiary.firstName,
    beneficiary.lastName,
    beneficiary.birthDate,
    beneficiary.masarNumber,
    beneficiary.phone,
    beneficiary.address,
    beneficiary.lastEducationLevel,
    beneficiary.personalProject,
    beneficiary.careerChoice1,
    beneficiary.guardianName,
    beneficiary.admissionAssessment,
    beneficiary.documents.length > 0
  ];
  const completionRate = Math.round((completionValues.filter(Boolean).length / completionValues.length) * 100);

  let risk: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  if (absences >= 6 || completionRate < 45 || beneficiary.status === "WITHDRAWN") risk = "HIGH";
  else if (absences >= 3 || completionRate < 75 || beneficiary.documents.length === 0) risk = "MEDIUM";

  const currentStage = stageIndex[beneficiary.status] ?? 0;
  const stageDefinitions = [
    ["التسجيل", `/beneficiaries/${beneficiary.id}#personal-data`],
    ["التشخيص", `/beneficiaries/${beneficiary.id}#diagnosis`],
    ["القبول", `/beneficiaries/${beneficiary.id}#diagnosis`],
    ["التكوين", `/beneficiaries/${beneficiary.id}#training`],
    ["المواكبة", `/beneficiaries/${beneficiary.id}#social`],
    ["الإدماج", `/beneficiaries/${beneficiary.id}#integration`]
  ];
  const stages = stageDefinitions.map(([label, href], index) => ({
    label,
    href,
    state: index < currentStage ? "completed" as const : index === currentStage ? "active" as const : "upcoming" as const
  }));

  const quickModules = [
    { label: "البيانات الكاملة", note: "تحرير المعلومات الشخصية والاجتماعية", href: `/beneficiaries/${beneficiary.id}#personal-data`, icon: ClipboardCheck },
    { label: "الحضور", note: `${attendanceRate}% نسبة المواظبة`, href: "/attendance", icon: CalendarCheck },
    { label: "التتبع التربوي", note: `${beneficiary.academicResults.length} تقييمات حديثة`, href: "/academic-tracking", icon: BookOpenCheck },
    { label: "المواكبة الاجتماعية", note: `${beneficiary.socialFollowUps.length} متابعات حديثة`, href: "/social-support", icon: HeartHandshake },
    { label: "التكوين المهني", note: `${beneficiary.skillEvaluations.length} تقييمات مهارية`, href: "/vocational-training", icon: GraduationCap },
    { label: "الإدماج", note: beneficiary.internships[0]?.organizationName || "لا يوجد تدريب مسجل", href: "/professional-integration", icon: BriefcaseBusiness }
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-blue-700">Second Chance 2.0</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">مركز قيادة المستفيد</h1>
          </div>
          <Link href="/beneficiaries" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700">
            <ArrowRight size={17} /> العودة إلى المستفيدين
          </Link>
        </div>

        <BeneficiaryProfileHeroV2
          id={beneficiary.id}
          fullName={`${beneficiary.firstName} ${beneficiary.lastName}`}
          initials={`${beneficiary.firstName.slice(0, 1)}${beneficiary.lastName.slice(0, 1)}`}
          photoUrl={beneficiary.profilePhotoUrl}
          statusLabel={statusLabels[beneficiary.status] || beneficiary.status}
          registrationNumber={beneficiary.registrationNumber || fallbackNumber(beneficiary.id, beneficiary.createdAt)}
          masarNumber={beneficiary.masarNumber}
          phone={beneficiary.phone}
          groupLabel={group ? `${group.name} · ${group.specialty || group.track || "المسار غير محدد"}` : "لم يتم إسناده إلى مجموعة بعد"}
          completionRate={completionRate}
          attendanceRate={attendanceRate}
          absenceCount={absences}
          documentsCount={beneficiary.documents.length}
          socialFollowUpsCount={beneficiary.socialFollowUps.length}
          strengths={beneficiary.strengths}
          priorityNeeds={beneficiary.priorityNeeds}
          careerGoal={beneficiary.careerGoal || beneficiary.personalProject}
          nextAction={getNextAction(beneficiary.status, beneficiary.documents.length, Boolean(beneficiary.admissionAssessment), Boolean(group))}
          risk={risk}
          stages={stages}
        />

        <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
          <div className="space-y-5">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div><p className="text-xs font-black text-blue-700">وحدات الملف</p><h2 className="mt-1 text-xl font-black text-slate-950">الوصول التشغيلي السريع</h2></div>
                <Sparkles className="text-blue-700" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickModules.map(({ label, note, href, icon: Icon }) => (
                  <Link key={label} href={href} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm"><Icon size={20} /></span>
                    <div className="min-w-0"><p className="font-black text-slate-900">{label}</p><p className="mt-1 truncate text-xs text-slate-500">{note}</p></div>
                  </Link>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-black text-blue-700">آخر العمليات</p><h2 className="mt-1 text-xl font-black text-slate-950">الخط الزمني للملف</h2></div><History className="text-blue-700" /></div>
              {beneficiary.activityLogs.length ? (
                <div className="space-y-1">
                  {beneficiary.activityLogs.map((activity, index) => (
                    <div key={activity.id} className="relative flex gap-4 pb-5 last:pb-0">
                      {index < beneficiary.activityLogs.length - 1 && <span className="absolute right-[17px] top-9 h-[calc(100%-1rem)] w-px bg-slate-200" />}
                      <span className="relative z-10 mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border-4 border-white bg-blue-700 text-white"><History size={13} /></span>
                      <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="font-black text-slate-900">{activity.title}</p><time className="text-xs text-slate-500">{activity.eventDate.toLocaleDateString("ar-MA")}</time></div>
                        {activity.description && <p className="mt-2 text-sm leading-6 text-slate-600">{activity.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">لا توجد أنشطة مسجلة بعد.</p>}
            </article>
          </div>

          <div className="space-y-5">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-black text-blue-700">الوثائق</p><h2 className="mt-1 text-lg font-black text-slate-950">آخر الملفات المرفوعة</h2></div><FolderOpen className="text-blue-700" /></div>
              <div className="space-y-3">
                {beneficiary.documents.length ? beneficiary.documents.map((document) => (
                  <div key={document.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700"><FileText size={17} /></span>
                    <div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{document.title}</p><p className="mt-1 text-xs text-slate-500">{document.createdAt.toLocaleDateString("ar-MA")}</p></div>
                  </div>
                )) : <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">لا توجد وثائق.</p>}
              </div>
              <Link href={`/beneficiaries/${beneficiary.id}/documents`} className="mt-4 flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800">إدارة جميع الوثائق</Link>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4"><p className="text-xs font-black text-violet-700">التشخيص</p><h2 className="mt-1 text-lg font-black text-slate-950">ملخص القبول والتوجيه</h2></div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between rounded-xl bg-slate-50 p-3"><span className="text-slate-500">قرار اللجنة</span><strong>{beneficiary.admissionAssessment?.decision || "غير محدد"}</strong></div>
                <div className="flex justify-between rounded-xl bg-slate-50 p-3"><span className="text-slate-500">المسار المقترح</span><strong className="max-w-[55%] truncate">{beneficiary.admissionAssessment?.proposedTrack || beneficiary.careerChoice1 || "غير محدد"}</strong></div>
                <div className="flex justify-between rounded-xl bg-slate-50 p-3"><span className="text-slate-500">الدافعية</span><strong>{beneficiary.admissionAssessment?.motivationLevel ?? "—"}</strong></div>
              </div>
              <Link href={`/beneficiaries/${beneficiary.id}/smart-orientation`} className="mt-4 flex w-full items-center justify-center rounded-xl bg-violet-700 px-4 py-3 text-sm font-black text-white hover:bg-violet-800">فتح التوجيه الذكي</Link>
            </article>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
