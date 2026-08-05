import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  ChevronLeft,
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
      take: 7
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
  const maxStatus = Math.max(...statusDistribution.map((item) => item._count._all), 1);
  const atRisk = absenceGroups.filter((item) => item._count._all >= 3);

  const cards = [
    {
      label: "إجمالي المستفيدين",
      value: beneficiaries,
      note: `${newThisMonth} ملفًا جديدًا خلال آخر 30 يومًا`,
      icon: Users,
      href: "/beneficiaries",
      iconClass: "bg-blue-50 text-blue-700",
      accent: "from-blue-600 to-cyan-500"
    },
    {
      label: "المستفيدون النشطون",
      value: activeBeneficiaries,
      note: `${completedBeneficiaries} مستفيدًا استكملوا البرنامج`,
      icon: TrendingUp,
      href: "/workflow",
      iconClass: "bg-emerald-50 text-emerald-700",
      accent: "from-emerald-600 to-green-400"
    },
    {
      label: "حضور اليوم",
      value: `${attendanceRate}%`,
      note: `${presentToday} حاضرًا من أصل ${todayAttendance}`,
      icon: CalendarCheck2,
      href: "/attendance",
      iconClass: "bg-violet-50 text-violet-700",
      accent: "from-violet-600 to-fuchsia-400"
    },
    {
      label: "إتمام التداريب",
      value: `${integrationRate}%`,
      note: `${activeInternships} تدريبًا مهنيًا جاريًا`,
      icon: BriefcaseBusiness,
      href: "/integration",
      iconClass: "bg-amber-50 text-amber-700",
      accent: "from-amber-500 to-orange-400"
    }
  ];

  const shortcuts = [
    { href: "/beneficiaries/new", label: "تسجيل مستفيد", icon: UserPlus, className: "bg-blue-50 text-blue-700" },
    { href: "/attendance", label: "تسجيل الحضور", icon: CalendarCheck2, className: "bg-emerald-50 text-emerald-700" },
    { href: "/academic-tracking", label: "إضافة تقييم", icon: BookOpenCheck, className: "bg-violet-50 text-violet-700" },
    { href: "/social-support", label: "متابعة اجتماعية", icon: HeartHandshake, className: "bg-rose-50 text-rose-700" },
    { href: "/vocational-training", label: "إدارة التكوين", icon: GraduationCap, className: "bg-cyan-50 text-cyan-700" },
    { href: "/reports", label: "فتح التقارير", icon: FileText, className: "bg-amber-50 text-amber-700" }
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-l from-blue-700 via-blue-600 to-cyan-500 p-6 text-white shadow-xl shadow-blue-900/10 md:p-8">
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                <Sparkles size={14} /> Second Chance 2.0
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">لوحة القيادة التنفيذية</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-50 md:text-base">
                متابعة لحظية لرحلة المستفيدين من التسجيل والتشخيص إلى التكوين والإدماج، مع تنبيهات عملية تساعد الفريق على التدخل في الوقت المناسب.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/beneficiaries/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-lg shadow-blue-950/10 transition hover:-translate-y-0.5">
                تسجيل مستفيد جديد <ArrowLeft size={17} />
              </Link>
              <Link href="/reports" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/20">
                التقارير التنفيذية <FileText size={17} />
              </Link>
            </div>
          </div>
          <div className="relative mt-7 grid grid-cols-2 gap-3 border-t border-white/15 pt-5 sm:grid-cols-4">
            {[
              ["المجموعات النشطة", groups],
              ["المسارات المهنية", programs],
              ["الوثائق المحفوظة", documents],
              ["المتابعات المفتوحة", openFollowUps]
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs text-blue-100">{label}</p>
                <p className="mt-1 text-2xl font-black">{value}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, note, icon: Icon, href, iconClass, accent }) => (
            <Link key={label} href={href} className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
                </div>
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${iconClass}`}><Icon size={23} /></div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs leading-5 text-slate-500">{note}</p>
                <ChevronLeft size={16} className="shrink-0 text-slate-300 transition group-hover:-translate-x-1 group-hover:text-blue-600" />
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.4fr_0.85fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-blue-600">حالة الملفات</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">توزيع المستفيدين حسب الوضعية</h2>
                <p className="mt-1 text-sm text-slate-500">قراءة مباشرة لمسار الملفات داخل البرنامج</p>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Activity size={21} /></div>
            </div>
            <div className="space-y-5">
              {statusDistribution.length ? statusDistribution.map((item) => {
                const width = Math.max(4, Math.round((item._count._all / maxStatus) * 100));
                return (
                  <div key={item.status}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-700">{statusLabels[item.status] || item.status}</span>
                      <strong className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-800">{item._count._all}</strong>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-l from-blue-600 to-cyan-400" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">لا توجد بيانات كافية بعد.</p>}
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-red-600"><ShieldAlert size={21} /></div>
              <div>
                <h2 className="text-xl font-black text-slate-950">ملفات تحتاج تدخلاً</h2>
                <p className="text-sm text-slate-500">بناءً على الغياب المتكرر</p>
              </div>
            </div>
            <div className="space-y-3">
              {atRisk.length ? atRisk.map((item) => {
                const beneficiary = riskMap.get(item.beneficiaryId);
                if (!beneficiary) return null;
                const critical = item._count._all >= 8;
                return (
                  <Link key={item.beneficiaryId} href={`/beneficiaries/${item.beneficiaryId}`} className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-red-100 hover:bg-red-50/50">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900">{beneficiary.firstName} {beneficiary.lastName}</p>
                      <p className="mt-1 text-xs text-slate-500">{statusLabels[beneficiary.status] || beneficiary.status}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${critical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{item._count._all} غيابات</span>
                  </Link>
                );
              }) : <p className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center text-sm font-bold text-emerald-700">لا توجد ملفات عالية الخطر حاليًا.</p>}
            </div>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-blue-600">النشاطات</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">آخر العمليات المسجلة</h2>
              </div>
              <Link href="/reports" className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">عرض التقارير</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {latestActivities.length ? latestActivities.map((activity) => (
                <Link key={activity.id} href={activity.referenceHref || `/beneficiaries/${activity.beneficiaryId}`} className="flex items-center justify-between gap-4 rounded-xl px-2 py-4 transition hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">{activityLabels[activity.category] || activity.category}</span>
                      <p className="truncate font-black text-slate-800">{activity.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{activity.beneficiary.firstName} {activity.beneficiary.lastName}{activity.actorName ? ` · ${activity.actorName}` : ""}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-400">{activity.eventDate.toLocaleDateString("ar-MA")}</span>
                </Link>
              )) : <p className="py-10 text-center text-sm text-slate-500">لا توجد أنشطة مسجلة بعد.</p>}
            </div>
          </article>

          <div className="space-y-5">
            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle size={21} /></div>
                <div><h2 className="font-black text-slate-950">التنبيهات المهمة</h2><p className="text-sm text-slate-500">أولويات العمل الحالية</p></div>
              </div>
              <div className="space-y-3">
                <Link href="/social-support" className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm"><span className="font-bold text-red-800">حالات اجتماعية مستعجلة</span><strong className="text-red-700">{urgentFollowUps}</strong></Link>
                <Link href="/academic-tracking" className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm"><span className="font-bold text-amber-800">خطط دعم مفتوحة</span><strong className="text-amber-700">{openSupportPlans}</strong></Link>
                <Link href="/social-support" className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm"><span className="font-bold text-blue-800">متابعات اجتماعية مفتوحة</span><strong className="text-blue-700">{openFollowUps}</strong></Link>
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-4 flex items-center gap-3"><FolderOpen className="text-blue-600" /><h2 className="font-black text-slate-950">ملخص الموارد</h2></div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["المجموعات", groups],
                  ["المسارات", programs],
                  ["الوثائق", documents],
                  ["التداريب الجارية", activeInternships]
                ].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p></div>)}
              </div>
            </article>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-wider text-blue-600">العمل اليومي</p><h2 className="mt-1 text-xl font-black text-slate-950">إجراءات سريعة</h2></div>
            <p className="hidden text-sm text-slate-500 md:block">الوصول المباشر إلى أكثر العمليات استخدامًا</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {shortcuts.map(({ href, label, icon: Icon, className }) => (
              <Link key={href} href={href} className="group flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl ${className}`}><Icon size={21} /></span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
