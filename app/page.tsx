import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  FolderOpen,
  GitBranch,
  GraduationCap,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

const statusLabels: Record<string, string> = {
  PRE_REGISTERED: "مسجل أوليًا",
  UNDER_REVIEW: "قيد الدراسة",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "مقبول",
  REJECTED: "غير مقبول",
  ENROLLED: "متمدرس",
  WITHDRAWN: "منسحب",
  COMPLETED: "مستكمل"
};

const activityLabels: Record<string, string> = {
  REGISTRATION: "التسجيل",
  DIAGNOSIS: "التشخيص",
  ADMISSION: "القبول",
  ATTENDANCE: "الحضور",
  ASSESSMENT: "التقييم",
  SUPPORT: "الدعم",
  SOCIAL: "المواكبة",
  TRAINING: "التكوين",
  INTERNSHIP: "التدريب",
  INTEGRATION: "الإدماج",
  DOCUMENT: "الوثائق",
  NOTE: "ملاحظة"
};

export default async function DashboardPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    beneficiaries,
    activeBeneficiaries,
    completedBeneficiaries,
    groups,
    programs,
    todayAttendance,
    presentToday,
    openFollowUps,
    urgentFollowUps,
    activeInternships,
    completedInternships,
    documents,
    statusDistribution,
    absenceGroups,
    latestActivities,
    newThisMonth,
    openSupportPlans,
    pendingAdmissions,
    filesWithoutDocuments
  ] = await Promise.all([
    prisma.beneficiary.count(),
    prisma.beneficiary.count({ where: { status: { in: ["ACCEPTED", "ENROLLED"] } } }),
    prisma.beneficiary.count({ where: { status: "COMPLETED" } }),
    prisma.learningGroup.count({ where: { isActive: true } }),
    prisma.vocationalProgram.count({ where: { isActive: true } }),
    prisma.attendanceRecord.count({ where: { date: { gte: startOfDay, lt: endOfDay } } }),
    prisma.attendanceRecord.count({ where: { date: { gte: startOfDay, lt: endOfDay }, status: { in: ["PRESENT", "LATE"] } } }),
    prisma.socialFollowUp.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.socialFollowUp.count({ where: { priority: "URGENT", status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.internship.count({ where: { status: "ACTIVE" } }),
    prisma.internship.count({ where: { status: "COMPLETED" } }),
    prisma.document.count(),
    prisma.beneficiary.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.attendanceRecord.groupBy({
      by: ["beneficiaryId"],
      where: { status: "ABSENT" },
      _count: { _all: true },
      orderBy: { _count: { beneficiaryId: "desc" } },
      take: 8
    }),
    prisma.activityLog.findMany({
      include: { beneficiary: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { eventDate: "desc" },
      take: 8
    }),
    prisma.beneficiary.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.academicSupportPlan.count({ where: { status: { in: ["PLANNED", "IN_PROGRESS"] } } }),
    prisma.admissionAssessment.count({ where: { decision: "PENDING" } }),
    prisma.beneficiary.count({ where: { documents: { none: {} } } })
  ]);

  const riskIds = absenceGroups.filter((item) => item._count._all >= 3).map((item) => item.beneficiaryId);
  const riskBeneficiaries = riskIds.length
    ? await prisma.beneficiary.findMany({
        where: { id: { in: riskIds } },
        select: { id: true, firstName: true, lastName: true, status: true }
      })
    : [];
  const riskMap = new Map(riskBeneficiaries.map((item) => [item.id, item]));

  const attendanceRate = percent(presentToday, todayAttendance);
  const integrationRate = percent(completedInternships, completedInternships + activeInternships);
  const completionRate = percent(completedBeneficiaries, beneficiaries);
  const maxStatus = Math.max(...statusDistribution.map((item) => item._count._all), 1);
  const atRisk = absenceGroups.filter((item) => item._count._all >= 3);
  const todayLabel = new Intl.DateTimeFormat("ar-MA", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  const cards = [
    { label: "إجمالي المستفيدين", value: beneficiaries, note: `${newThisMonth} ملفًا جديدًا خلال 30 يومًا`, icon: Users, href: "/beneficiaries", tone: "bg-blue-50 text-blue-700", accent: "from-blue-600 to-cyan-400" },
    { label: "المستفيدون النشطون", value: activeBeneficiaries, note: `${completedBeneficiaries} استكملوا البرنامج`, icon: TrendingUp, href: "/workflow", tone: "bg-emerald-50 text-emerald-700", accent: "from-emerald-600 to-green-400" },
    { label: "حضور اليوم", value: `${attendanceRate}%`, note: `${presentToday} حاضرًا من أصل ${todayAttendance}`, icon: CalendarCheck2, href: "/attendance", tone: "bg-violet-50 text-violet-700", accent: "from-violet-600 to-fuchsia-400" },
    { label: "الإدماج والتدريب", value: `${integrationRate}%`, note: `${activeInternships} تدريبًا نشطًا`, icon: BriefcaseBusiness, href: "/integration", tone: "bg-amber-50 text-amber-700", accent: "from-amber-500 to-orange-400" },
    { label: "قرارات معلقة", value: pendingAdmissions, note: "ملفات تنتظر قرار اللجنة", icon: ClipboardCheck, href: "/admissions", tone: "bg-cyan-50 text-cyan-700", accent: "from-cyan-600 to-sky-400" },
    { label: "ملفات دون وثائق", value: filesWithoutDocuments, note: "تحتاج استكمالًا إداريًا", icon: FolderOpen, href: "/beneficiaries", tone: "bg-rose-50 text-rose-700", accent: "from-rose-600 to-red-400" },
    { label: "متابعات مفتوحة", value: openFollowUps, note: `${urgentFollowUps} حالات عاجلة`, icon: HeartHandshake, href: "/social-support", tone: "bg-indigo-50 text-indigo-700", accent: "from-indigo-600 to-violet-400" },
    { label: "إنجاز البرنامج", value: `${completionRate}%`, note: "نسبة الملفات المستكملة", icon: GraduationCap, href: "/reports", tone: "bg-teal-50 text-teal-700", accent: "from-teal-600 to-emerald-400" }
  ];

  const shortcuts = [
    { href: "/beneficiaries/new", label: "تسجيل مستفيد", note: "إنشاء ملف جديد", icon: UserPlus, tone: "bg-blue-50 text-blue-700" },
    { href: "/attendance", label: "تسجيل الحضور", note: "الحصة اليومية", icon: CalendarCheck2, tone: "bg-emerald-50 text-emerald-700" },
    { href: "/workflow", label: "سير الملفات", note: "الانتقالات والشروط", icon: GitBranch, tone: "bg-violet-50 text-violet-700" },
    { href: "/academic-tracking", label: "إضافة تقييم", note: "النتائج والدعم", icon: BookOpenCheck, tone: "bg-amber-50 text-amber-700" },
    { href: "/vocational-training", label: "إدارة التكوين", note: "الكفايات والمسارات", icon: GraduationCap, tone: "bg-cyan-50 text-cyan-700" },
    { href: "/reports", label: "فتح التقارير", note: "التحليل والتصدير", icon: FileText, tone: "bg-rose-50 text-rose-700" }
  ];

  const priorities = [
    { label: "ملفات تنتظر اللجنة", value: pendingAdmissions, href: "/admissions", tone: "border-amber-200 bg-amber-50 text-amber-800" },
    { label: "ملفات بلا وثائق", value: filesWithoutDocuments, href: "/beneficiaries", tone: "border-rose-200 bg-rose-50 text-rose-800" },
    { label: "متابعات عاجلة", value: urgentFollowUps, href: "/social-support", tone: "border-red-200 bg-red-50 text-red-800" },
    { label: "خطط دعم مفتوحة", value: openSupportPlans, href: "/academic-tracking", tone: "border-blue-200 bg-blue-50 text-blue-800" }
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1540px] space-y-6">
        <header className="relative overflow-hidden rounded-[2rem] border border-blue-200/70 bg-gradient-to-l from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-2xl shadow-blue-950/15 md:p-8">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl" />
          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black backdrop-blur"><Sparkles size={14} /> Dashboard Enterprise 3.0</div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">مركز قيادة البرنامج</h1>
              <p className="mt-3 text-sm font-bold text-blue-200">{todayLabel}</p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-50 md:text-base">رؤية موحدة للمستفيدين والحضور وسير الملفات والتكوين والإدماج، مع إبراز الأولويات التي تتطلب تدخل الفريق اليوم.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/beneficiaries/new" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-800 shadow-xl hover:-translate-y-0.5">تسجيل مستفيد <ArrowLeft size={17} /></Link>
              <Link href="/reports" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur hover:bg-white/20">التقارير التنفيذية <FileText size={17} /></Link>
            </div>
          </div>
          <div className="relative mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">
            {[["المجموعات النشطة", groups], ["المسارات المهنية", programs], ["الوثائق المحفوظة", documents], ["التداريب النشطة", activeInternships]].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"><p className="text-xs text-blue-200">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>
            ))}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, note, icon: Icon, href, tone, accent }) => (
            <Link key={label} href={href} className="app-card group relative overflow-hidden p-5 hover:-translate-y-1">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
              <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div><span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon size={22} /></span></div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-xs leading-5 text-slate-500">{note}</p><ChevronLeft size={16} className="text-slate-300 group-hover:-translate-x-1 group-hover:text-blue-600" /></div>
            </Link>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
          <article className="app-card p-5 md:p-6">
            <div className="mb-6 flex items-start justify-between gap-4"><div><p className="app-eyebrow">رحلة المستفيد</p><h2 className="mt-1 text-xl font-black text-slate-950">توزيع الملفات حسب المرحلة</h2><p className="mt-1 text-sm text-slate-500">قراءة تشغيلية لمسار الملفات داخل البرنامج.</p></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Activity size={21} /></span></div>
            <div className="space-y-4">
              {statusDistribution.length ? statusDistribution.map((item) => {
                const width = Math.max(4, Math.round((item._count._all / maxStatus) * 100));
                return <div key={item.status}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-bold text-slate-700">{statusLabels[item.status] || item.status}</span><strong className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-800">{item._count._all}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-blue-700 to-cyan-400" style={{ width: `${width}%` }} /></div></div>;
              }) : <div className="empty-state">لا توجد بيانات كافية بعد.</div>}
            </div>
          </article>

          <article className="app-card p-5 md:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700"><AlertTriangle size={21} /></span><div><h2 className="text-xl font-black text-slate-950">أولويات اليوم</h2><p className="text-sm text-slate-500">ملفات ومهام تحتاج قرارًا أو متابعة.</p></div></div>
            <div className="space-y-3">
              {priorities.map((item) => <Link key={item.label} href={item.href} className={`flex items-center justify-between rounded-2xl border p-4 transition hover:-translate-y-0.5 ${item.tone}`}><span className="text-sm font-black">{item.label}</span><strong className="text-2xl">{item.value}</strong></Link>)}
            </div>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="app-card p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between"><div><p className="app-eyebrow">الإنذار المبكر</p><h2 className="mt-1 text-xl font-black text-slate-950">ملفات معرضة للانقطاع</h2></div><ShieldAlert className="text-red-600" size={22} /></div>
            <div className="space-y-3">
              {atRisk.length ? atRisk.map((entry) => {
                const beneficiary = riskMap.get(entry.beneficiaryId);
                if (!beneficiary) return null;
                return <Link key={entry.beneficiaryId} href={`/beneficiaries/${entry.beneficiaryId}`} className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50/70 p-4 hover:border-red-200"><div><p className="font-black text-slate-900">{beneficiary.firstName} {beneficiary.lastName}</p><p className="mt-1 text-xs text-slate-500">{statusLabels[beneficiary.status] || beneficiary.status}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-200">{entry._count._all} غيابات</span></Link>;
              }) : <div className="empty-state"><ShieldAlert className="mx-auto mb-3 text-emerald-400" size={36} /><p className="font-black text-slate-700">لا توجد حالات حرجة حاليًا</p></div>}
            </div>
          </article>

          <article className="app-card p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between"><div><p className="app-eyebrow">سجل المنصة</p><h2 className="mt-1 text-xl font-black text-slate-950">آخر الأنشطة</h2></div><Link href="/notifications" className="text-sm font-black text-blue-700">عرض الكل ←</Link></div>
            <div className="space-y-1">
              {latestActivities.length ? latestActivities.map((activity) => (
                <Link key={activity.id} href={`/beneficiaries/${activity.beneficiary.id}`} className="flex gap-3 rounded-2xl p-3 hover:bg-slate-50"><span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-100" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-black text-slate-900">{activity.title}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{activityLabels[activity.category] || activity.category}</span></div><p className="mt-1 text-xs text-slate-500">{activity.beneficiary.firstName} {activity.beneficiary.lastName} · {activity.eventDate.toLocaleString("ar-MA")}</p></div></Link>
              )) : <div className="empty-state">لا توجد أنشطة مسجلة بعد.</div>}
            </div>
          </article>
        </section>

        <section className="app-card p-5 md:p-6">
          <div className="mb-5"><p className="app-eyebrow">الوصول السريع</p><h2 className="mt-1 text-xl font-black text-slate-950">إجراءات العمل اليومية</h2><p className="mt-1 text-sm text-slate-500">اختصارات للوحدات الأكثر استخدامًا داخل المنصة.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {shortcuts.map(({ href, label, note, icon: Icon, tone }) => <Link key={href} href={href} className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 hover:border-blue-200 hover:bg-white hover:shadow-md"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon size={20} /></span><p className="mt-4 font-black text-slate-900 group-hover:text-blue-700">{label}</p><p className="mt-1 text-xs text-slate-500">{note}</p></Link>)}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
