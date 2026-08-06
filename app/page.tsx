import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarCheck2,
  ClipboardCheck,
  FileText,
  FolderOpen,
  GraduationCap,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const activeFileWhere = { archivedAt: null, deletedAt: null } as const;

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

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default async function DashboardPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

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
    prisma.beneficiary.count({ where: activeFileWhere }),
    prisma.beneficiary.count({ where: { ...activeFileWhere, status: { in: ["ACCEPTED", "ENROLLED"] } } }),
    prisma.beneficiary.count({ where: { ...activeFileWhere, status: "COMPLETED" } }),
    prisma.learningGroup.count({ where: { isActive: true } }),
    prisma.vocationalProgram.count({ where: { isActive: true } }),
    prisma.attendanceRecord.count({
      where: { date: { gte: startOfDay, lt: endOfDay }, beneficiary: activeFileWhere }
    }),
    prisma.attendanceRecord.count({
      where: {
        date: { gte: startOfDay, lt: endOfDay },
        status: { in: ["PRESENT", "LATE"] },
        beneficiary: activeFileWhere
      }
    }),
    prisma.socialFollowUp.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, beneficiary: activeFileWhere }
    }),
    prisma.socialFollowUp.count({
      where: { priority: "URGENT", status: { in: ["OPEN", "IN_PROGRESS"] }, beneficiary: activeFileWhere }
    }),
    prisma.internship.count({ where: { status: "ACTIVE", beneficiary: activeFileWhere } }),
    prisma.internship.count({ where: { status: "COMPLETED", beneficiary: activeFileWhere } }),
    prisma.document.count({ where: { beneficiary: activeFileWhere } }),
    prisma.beneficiary.groupBy({ by: ["status"], where: activeFileWhere, _count: { _all: true } }),
    prisma.attendanceRecord.groupBy({
      by: ["beneficiaryId"],
      where: { status: "ABSENT", beneficiary: activeFileWhere },
      _count: { _all: true },
      orderBy: { _count: { beneficiaryId: "desc" } },
      take: 8
    }),
    prisma.activityLog.findMany({
      where: { beneficiary: activeFileWhere },
      select: {
        id: true,
        title: true,
        category: true,
        eventDate: true,
        beneficiary: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { eventDate: "desc" },
      take: 8
    }),
    prisma.beneficiary.count({ where: { ...activeFileWhere, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.academicSupportPlan.count({
      where: { status: { in: ["PLANNED", "IN_PROGRESS"] }, beneficiary: activeFileWhere }
    }),
    prisma.admissionAssessment.count({ where: { decision: "PENDING", beneficiary: activeFileWhere } }),
    prisma.beneficiary.count({ where: { ...activeFileWhere, documents: { none: {} } } })
  ]);

  const riskIds = absenceGroups.filter((item) => item._count._all >= 3).map((item) => item.beneficiaryId);
  const riskBeneficiaries = riskIds.length
    ? await prisma.beneficiary.findMany({
        where: { ...activeFileWhere, id: { in: riskIds } },
        select: { id: true, firstName: true, lastName: true, status: true }
      })
    : [];
  const riskMap = new Map(riskBeneficiaries.map((item) => [item.id, item]));
  const atRisk = absenceGroups.filter((item) => item._count._all >= 3 && riskMap.has(item.beneficiaryId));

  const attendanceRate = percent(presentToday, todayAttendance);
  const integrationRate = percent(completedInternships, completedInternships + activeInternships);
  const completionRate = percent(completedBeneficiaries, beneficiaries);
  const maxStatus = Math.max(...statusDistribution.map((item) => item._count._all), 1);
  const todayLabel = new Intl.DateTimeFormat("ar-MA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  const cards = [
    { label: "الملفات النشطة", value: beneficiaries, note: `${newThisMonth} ملفًا جديدًا خلال 30 يومًا`, icon: Users, href: "/beneficiaries" },
    { label: "في المسار النشط", value: activeBeneficiaries, note: `${completedBeneficiaries} استكملوا البرنامج`, icon: TrendingUp, href: "/workflow" },
    { label: "حضور اليوم", value: `${attendanceRate}%`, note: `${presentToday} حاضرًا من أصل ${todayAttendance}`, icon: CalendarCheck2, href: "/attendance" },
    { label: "إتمام التداريب", value: `${integrationRate}%`, note: `${activeInternships} تدريبًا نشطًا`, icon: BriefcaseBusiness, href: "/integration" },
    { label: "قرارات معلقة", value: pendingAdmissions, note: "ملفات تنتظر قرار اللجنة", icon: ClipboardCheck, href: "/admissions" },
    { label: "ملفات دون وثائق", value: filesWithoutDocuments, note: "تحتاج استكمالًا إداريًا", icon: FolderOpen, href: "/beneficiaries" },
    { label: "متابعات مفتوحة", value: openFollowUps, note: `${urgentFollowUps} حالات عاجلة`, icon: HeartHandshake, href: "/social-support" },
    { label: "إنجاز البرنامج", value: `${completionRate}%`, note: "من الملفات النشطة", icon: GraduationCap, href: "/reports" }
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1540px] space-y-6">
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black"><Sparkles size={14} /> Dashboard Enterprise 3.0</p>
              <h1 className="mt-4 text-3xl font-black md:text-5xl">مركز قيادة البرنامج</h1>
              <p className="mt-3 text-sm font-bold text-blue-200">{todayLabel}</p>
              <p className="mt-3 text-sm text-blue-50">مرحبًا {session.fullName}. جميع المؤشرات أدناه تخص الملفات النشطة فقط.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/beneficiaries/new" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-800">تسجيل مستفيد <ArrowLeft size={17} /></Link>
              <Link href="/reports" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">التقارير <FileText size={17} /></Link>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">
            {[["المجموعات النشطة", groups], ["المسارات المهنية", programs], ["الوثائق المحفوظة", documents], ["التداريب النشطة", activeInternships]].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl bg-white/10 px-4 py-3"><p className="text-xs text-blue-200">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>
            ))}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, note, icon: Icon, href }) => (
            <Link key={label} href={href} className="app-card group p-5 hover:-translate-y-1">
              <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Icon size={22} /></span></div>
              <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">{note}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <article className="app-card p-6">
            <div className="mb-6 flex items-center gap-3"><Activity className="text-blue-700" /><div><h2 className="text-xl font-black">توزيع الملفات حسب المرحلة</h2><p className="text-sm text-slate-500">لا يشمل الأرشيف أو سلة المحذوفات.</p></div></div>
            <div className="space-y-4">
              {statusDistribution.length ? statusDistribution.map((item) => {
                const width = Math.max(4, Math.round((item._count._all / maxStatus) * 100));
                return <div key={item.status}><div className="mb-2 flex justify-between text-sm"><span className="font-bold">{statusLabels[item.status] || item.status}</span><strong>{item._count._all}</strong></div><div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-blue-700 to-cyan-400" style={{ width: `${width}%` }} /></div></div>;
              }) : <div className="empty-state">لا توجد بيانات بعد.</div>}
            </div>
          </article>

          <article className="app-card p-6">
            <div className="mb-5 flex items-center gap-3"><AlertTriangle className="text-amber-600" /><h2 className="text-xl font-black">أولويات اليوم</h2></div>
            <div className="space-y-3">
              {[
                ["ملفات تنتظر اللجنة", pendingAdmissions, "/admissions"],
                ["ملفات بلا وثائق", filesWithoutDocuments, "/beneficiaries"],
                ["متابعات عاجلة", urgentFollowUps, "/social-support"],
                ["خطط دعم مفتوحة", openSupportPlans, "/academic-tracking"]
              ].map(([label, value, href]) => <Link key={String(label)} href={String(href)} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"><span className="text-sm font-black">{label}</span><strong className="text-2xl">{value}</strong></Link>)}
            </div>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <article className="app-card p-6">
            <div className="mb-5 flex items-center gap-3"><ShieldAlert className="text-red-600" /><h2 className="text-xl font-black">ملفات معرضة للانقطاع</h2></div>
            <div className="space-y-3">
              {atRisk.length ? atRisk.map((entry) => {
                const beneficiary = riskMap.get(entry.beneficiaryId)!;
                return <Link key={entry.beneficiaryId} href={`/beneficiaries/${entry.beneficiaryId}`} className="flex items-center justify-between rounded-2xl bg-red-50 p-4"><div><p className="font-black">{beneficiary.firstName} {beneficiary.lastName}</p><p className="text-xs text-slate-500">{statusLabels[beneficiary.status] || beneficiary.status}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-red-700">{entry._count._all} غيابات</span></Link>;
              }) : <div className="empty-state">لا توجد حالات حرجة حاليًا.</div>}
            </div>
          </article>

          <article className="app-card p-6">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">آخر الأنشطة</h2><Link href="/notifications" className="text-sm font-black text-blue-700">عرض الكل ←</Link></div>
            <div className="space-y-2">
              {latestActivities.length ? latestActivities.map((activity) => <Link key={activity.id} href={`/beneficiaries/${activity.beneficiary.id}`} className="block rounded-2xl p-3 hover:bg-slate-50"><p className="font-black">{activity.title}</p><p className="mt-1 text-xs text-slate-500">{activity.beneficiary.firstName} {activity.beneficiary.lastName} · {activity.eventDate.toLocaleString("ar-MA")}</p></Link>) : <div className="empty-state">لا توجد أنشطة مسجلة بعد.</div>}
            </div>
          </article>
        </section>

        <section className="app-card p-6">
          <h2 className="text-xl font-black">الوصول السريع</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["/beneficiaries/new", "تسجيل مستفيد", UserPlus],
              ["/attendance", "تسجيل الحضور", CalendarCheck2],
              ["/workflow", "سير الملفات", Activity],
              ["/reports", "التقارير التنفيذية", FileText]
            ].map(([href, label, Icon]) => {
              const ShortcutIcon = Icon as typeof UserPlus;
              return <Link key={String(href)} href={String(href)} className="rounded-2xl border border-slate-200 p-4 hover:border-blue-200"><ShortcutIcon className="text-blue-700" /><p className="mt-3 font-black">{label}</p></Link>;
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
