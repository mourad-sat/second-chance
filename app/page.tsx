import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  FileText,
  GraduationCap,
  HeartHandshake,
  ShieldAlert,
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
    openSupportPlans
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
      take: 6
    }),
    prisma.activityLog.findMany({
      include: { beneficiary: { select: { firstName: true, lastName: true } } },
      orderBy: { eventDate: "desc" },
      take: 8
    }),
    prisma.beneficiary.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.academicSupportPlan.count({ where: { status: { in: ["PLANNED", "IN_PROGRESS"] } } })
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

  const cards = [
    { label: "إجمالي المستفيدين", value: beneficiaries, note: `${newThisMonth} ملفًا خلال آخر 30 يومًا`, icon: Users, href: "/beneficiaries" },
    { label: "المستفيدون النشطون", value: activeBeneficiaries, note: `${completedBeneficiaries} استكملوا البرنامج`, icon: TrendingUp, href: "/workflow" },
    { label: "حضور اليوم", value: `${attendanceRate}%`, note: `${presentToday} حاضرًا من أصل ${todayAttendance}`, icon: CalendarCheck2, href: "/attendance" },
    { label: "مؤشر إتمام التداريب", value: `${integrationRate}%`, note: `${activeInternships} تدريبًا جاريًا`, icon: BriefcaseBusiness, href: "/integration" }
  ];

  const maxStatus = Math.max(...statusDistribution.map((item) => item._count._all), 1);

  const shortcuts = [
    { href: "/beneficiaries/new", label: "تسجيل مستفيد", icon: UserPlus },
    { href: "/attendance", label: "تسجيل الحضور", icon: CalendarCheck2 },
    { href: "/academic-tracking", label: "إضافة تقييم", icon: BookOpenCheck },
    { href: "/social-support", label: "متابعة اجتماعية", icon: HeartHandshake },
    { href: "/vocational-training", label: "إدارة التكوين", icon: GraduationCap },
    { href: "/reports", label: "فتح التقارير", icon: FileText }
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-sm font-semibold text-blue-300">مركز القيادة التنفيذي</p>
            <h1 className="mt-2 text-3xl font-bold">لوحة مؤشرات برنامج الفرصة الثانية</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">قراءة لحظية للتسجيل والمواظبة والمواكبة والتكوين والإدماج، مع إبراز الملفات التي تحتاج إلى تدخل.</p>
          </div>
          <Link href="/beneficiaries/new" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">
            تسجيل مستفيد جديد <ArrowLeft size={17} />
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, note, icon: Icon, href }) => (
            <Link key={label} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-950">{value}</p></div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={22} /></div>
              </div>
              <p className="mt-5 text-xs text-slate-500">{note}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div><h2 className="text-xl font-bold">توزيع المستفيدين حسب الوضعية</h2><p className="mt-1 text-sm text-slate-500">قراءة مباشرة لمسار الملفات داخل البرنامج</p></div>
              <Activity className="text-blue-600" />
            </div>
            <div className="space-y-4">
              {statusDistribution.map((item) => (
                <div key={item.status}>
                  <div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-medium text-slate-700">{statusLabels[item.status] || item.status}</span><strong>{item._count._all}</strong></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(4, Math.round((item._count._all / maxStatus) * 100))}%` }} /></div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-red-50 p-3 text-red-600"><ShieldAlert size={21} /></div><div><h2 className="text-xl font-bold">ملفات معرضة للانقطاع</h2><p className="text-sm text-slate-500">بناءً على الغياب المتكرر</p></div></div>
            <div className="space-y-3">
              {absenceGroups.filter((item) => item._count._all >= 3).length ? absenceGroups.filter((item) => item._count._all >= 3).map((item) => {
                const beneficiary = riskMap.get(item.beneficiaryId);
                if (!beneficiary) return null;
                const critical = item._count._all >= 8;
                return <Link key={item.beneficiaryId} href={`/beneficiaries/${item.beneficiaryId}`} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 hover:bg-slate-100"><div><p className="font-semibold">{beneficiary.firstName} {beneficiary.lastName}</p><p className="mt-1 text-xs text-slate-500">{statusLabels[beneficiary.status] || beneficiary.status}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${critical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{item._count._all} غيابات</span></Link>;
              }) : <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">لا توجد ملفات عالية الخطر حاليًا.</p>}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold">آخر الأنشطة</h2><p className="mt-1 text-sm text-slate-500">أحدث العمليات المسجلة في ملفات المستفيدين</p></div><Link href="/reports" className="text-sm font-semibold text-blue-600">التقارير</Link></div>
            <div className="divide-y divide-slate-100">
              {latestActivities.length ? latestActivities.map((activity) => (
                <Link key={activity.id} href={activity.referenceHref || `/beneficiaries/${activity.beneficiaryId}`} className="flex items-center justify-between gap-4 py-4 hover:bg-slate-50">
                  <div className="min-w-0"><div className="flex items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">{activityLabels[activity.category] || activity.category}</span><p className="truncate font-semibold">{activity.title}</p></div><p className="mt-1 text-xs text-slate-500">{activity.beneficiary.firstName} {activity.beneficiary.lastName}{activity.actorName ? ` · ${activity.actorName}` : ""}</p></div>
                  <span className="shrink-0 text-xs text-slate-400">{activity.eventDate.toLocaleDateString("ar-MA")}</span>
                </Link>
              )) : <p className="py-10 text-center text-sm text-slate-500">لا توجد أنشطة مسجلة بعد.</p>}
            </div>
          </article>

          <div className="space-y-6">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-3 text-amber-600"><AlertTriangle size={21} /></div><div><h2 className="font-bold">مؤشرات تحتاج تدخلاً</h2><p className="text-sm text-slate-500">أولويات العمل الحالية</p></div></div>
              <div className="space-y-3">
                <Link href="/social-support" className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm"><span className="font-medium text-red-800">حالات اجتماعية مستعجلة</span><strong className="text-red-700">{urgentFollowUps}</strong></Link>
                <Link href="/academic-tracking" className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-sm"><span className="font-medium text-amber-800">خطط دعم مفتوحة</span><strong className="text-amber-700">{openSupportPlans}</strong></Link>
                <Link href="/social-support" className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 text-sm"><span className="font-medium text-blue-800">متابعات اجتماعية مفتوحة</span><strong className="text-blue-700">{openFollowUps}</strong></Link>
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm"><span className="font-medium text-emerald-800">وثائق محفوظة</span><strong className="text-emerald-700">{documents}</strong></div>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold">اختصارات سريعة</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {shortcuts.map(({ href, label, icon: Icon }) => <Link key={href + label} href={href} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Icon size={17} /> {label}</Link>)}
              </div>
            </article>
          </div>
        </section>

        <footer className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-900 p-5 text-white"><p className="text-xs text-slate-400">المجموعات النشيطة</p><p className="mt-2 text-2xl font-bold">{groups}</p></div>
          <div className="rounded-2xl bg-slate-900 p-5 text-white"><p className="text-xs text-slate-400">برامج التكوين النشيطة</p><p className="mt-2 text-2xl font-bold">{programs}</p></div>
          <div className="rounded-2xl bg-slate-900 p-5 text-white"><p className="text-xs text-slate-400">التداريب الجارية</p><p className="mt-2 text-2xl font-bold">{activeInternships}</p></div>
        </footer>
      </div>
    </AppShell>
  );
}
