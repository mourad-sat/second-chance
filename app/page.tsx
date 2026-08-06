import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Check,
  Eye,
  FolderOpen,
  Plus,
  UserRoundCheck,
  Users
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const activeFileWhere = { archivedAt: null, deletedAt: null } as const;

const statusLabels: Record<string, string> = {
  PRE_REGISTERED: "مسجل جديد",
  UNDER_REVIEW: "قيد الدراسة",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  ENROLLED: "متمدرس",
  WITHDRAWN: "منقطع",
  COMPLETED: "مندمج"
};

const statusColors: Record<string, string> = {
  PRE_REGISTERED: "#0ea5e9",
  UNDER_REVIEW: "#f59e0b",
  WAITLISTED: "#8b5cf6",
  ACCEPTED: "#10b981",
  REJECTED: "#f43f5e",
  ENROLLED: "#22c55e",
  WITHDRAWN: "#ef4444",
  COMPLETED: "#14b8a6"
};

const attendanceLabels: Record<string, string> = {
  PRESENT: "حاضر",
  LATE: "متأخر",
  ABSENT: "غائب",
  EXCUSED: "غياب مبرر"
};

const attendanceBadge: Record<string, string> = {
  PRESENT: "border-emerald-200 bg-emerald-50 text-emerald-700",
  LATE: "border-amber-200 bg-amber-50 text-amber-700",
  ABSENT: "border-rose-200 bg-rose-50 text-rose-700",
  EXCUSED: "border-sky-200 bg-sky-50 text-sky-700"
};

const beneficiaryBadge: Record<string, string> = {
  PRE_REGISTERED: "border-sky-200 bg-sky-50 text-sky-700",
  UNDER_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  WAITLISTED: "border-violet-200 bg-violet-50 text-violet-700",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  ENROLLED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  WITHDRAWN: "border-rose-200 bg-rose-50 text-rose-700",
  COMPLETED: "border-teal-200 bg-teal-50 text-teal-700"
};

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ar-MA", { day: "numeric", month: "short", year: "numeric" }).format(value);
}

export default async function DashboardPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalBeneficiaries,
    acceptedThisYear,
    activeGroups,
    todayAttendance,
    presentToday,
    statusDistribution,
    recentBeneficiaries,
    recentAttendance,
    registrations
  ] = await Promise.all([
    prisma.beneficiary.count({ where: activeFileWhere }),
    prisma.beneficiary.count({
      where: {
        ...activeFileWhere,
        status: { in: ["ACCEPTED", "ENROLLED", "COMPLETED"] },
        updatedAt: { gte: new Date(now.getFullYear(), 0, 1) }
      }
    }),
    prisma.learningGroup.count({ where: { isActive: true } }),
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
    prisma.beneficiary.groupBy({
      by: ["status"],
      where: activeFileWhere,
      _count: { _all: true }
    }),
    prisma.beneficiary.findMany({
      where: activeFileWhere,
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        enrollments: {
          where: { leftAt: null },
          take: 1,
          select: { group: { select: { name: true } } }
        }
      }
    }),
    prisma.attendanceRecord.findMany({
      where: { beneficiary: activeFileWhere },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        date: true,
        status: true,
        arrivalTime: true,
        beneficiary: { select: { firstName: true, lastName: true } }
      }
    }),
    prisma.beneficiary.findMany({
      where: { ...activeFileWhere, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
      take: 2000
    })
  ]);

  const attendanceRate = percent(presentToday, todayAttendance);
  const months = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1));
  const monthCounts = months.map((month) => registrations.filter((item) => item.createdAt.getFullYear() === month.getFullYear() && item.createdAt.getMonth() === month.getMonth()).length);
  const maxMonth = Math.max(...monthCounts, 1);
  const monthLabels = months.map((month) => new Intl.DateTimeFormat("ar-MA", { month: "short" }).format(month));

  let currentAngle = 0;
  const totalStatuses = statusDistribution.reduce((sum, item) => sum + item._count._all, 0) || 1;
  const donutStops = statusDistribution.map((item) => {
    const start = currentAngle;
    const value = (item._count._all / totalStatuses) * 360;
    currentAngle += value;
    return `${statusColors[item.status] || "#94a3b8"} ${start}deg ${currentAngle}deg`;
  });
  const donutBackground = donutStops.length ? `conic-gradient(${donutStops.join(",")})` : "#e2e8f0";

  const todayLabel = new Intl.DateTimeFormat("ar-MA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(now);

  const cards = [
    { label: "إجمالي المستفيدين", value: totalBeneficiaries, icon: Users, tone: "bg-emerald-100 text-emerald-700", href: "/beneficiaries" },
    { label: "المقبولون هذه السنة", value: acceptedThisYear, icon: Check, tone: "bg-sky-100 text-sky-700", href: "/admissions" },
    { label: "مجموعات نشطة", value: activeGroups, icon: FolderOpen, tone: "bg-violet-100 text-violet-700", href: "/groups" },
    { label: "نسبة الحضور اليوم", value: `${attendanceRate}%`, icon: CalendarDays, tone: "bg-amber-100 text-amber-700", href: "/attendance" }
  ];

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">لوحة القيادة</h1>
            <p className="mt-1 text-xs font-bold text-slate-500">{todayLabel}</p>
          </div>
          <Link href="/beneficiaries/new" className="btn-primary self-start !rounded-xl !px-5 !py-2.5">
            <Plus size={17} /> مستفيد جديد
          </Link>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, tone, href }) => (
            <Link key={label} href={href} className="app-card flex items-center justify-between gap-4 p-5 hover:-translate-y-0.5">
              <div>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
              </div>
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}><Icon size={22} /></span>
            </Link>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
          <article className="app-card p-5 md:p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-slate-800">التسجيلات خلال آخر 6 أشهر</h2>
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500">آخر 6 أشهر</span>
            </div>
            <div className="flex h-64 items-end gap-4 border-b border-slate-200 px-2 pb-4">
              {monthCounts.map((value, index) => (
                <div key={monthLabels[index]} className="flex h-full min-w-10 flex-1 flex-col items-center justify-end gap-3">
                  <span className="text-xs font-black text-slate-600">{value}</span>
                  <div className="flex h-48 w-full max-w-16 items-end overflow-hidden rounded-t-xl bg-emerald-50">
                    <div className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all" style={{ height: `${Math.max(value ? 12 : 2, (value / maxMonth) * 100)}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{monthLabels[index]}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="app-card p-5 md:p-6">
            <h2 className="text-lg font-black text-slate-800">توزيع الوضعيات</h2>
            <div className="mt-5 flex flex-col items-center">
              <div className="relative h-48 w-48 rounded-full" style={{ background: donutBackground }}>
                <div className="absolute inset-10 grid place-items-center rounded-full bg-white shadow-inner">
                  <div className="text-center"><p className="text-3xl font-black text-slate-900">{totalBeneficiaries}</p><p className="text-xs font-bold text-slate-500">ملف نشط</p></div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {statusDistribution.map((item) => (
                  <span key={item.status} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[item.status] || "#94a3b8" }} />
                    {statusLabels[item.status] || item.status}
                  </span>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <article className="app-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-black text-slate-800">أحدث المستفيدين المسجلين</h2>
              <UserRoundCheck size={19} className="text-emerald-600" />
            </div>
            <div className="overflow-x-auto">
              <table className="data-table min-w-[650px]">
                <thead><tr><th>الاسم</th><th>الوضعية</th><th>المجموعة</th><th>التسجيل</th><th>الإجراء</th></tr></thead>
                <tbody>
                  {recentBeneficiaries.map((beneficiary) => (
                    <tr key={beneficiary.id}>
                      <td className="font-black text-slate-800">{beneficiary.firstName} {beneficiary.lastName}</td>
                      <td><span className={`status-badge ${beneficiaryBadge[beneficiary.status] || "border-slate-200 bg-slate-50 text-slate-700"}`}>{statusLabels[beneficiary.status] || beneficiary.status}</span></td>
                      <td className="text-slate-500">{beneficiary.enrollments[0]?.group.name || "—"}</td>
                      <td className="text-slate-500">{formatDate(beneficiary.createdAt)}</td>
                      <td><Link href={`/beneficiaries/${beneficiary.id}`} className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 hover:text-emerald-900"><Eye size={14} /> عرض</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-5 py-3"><Link href="/beneficiaries" className="text-xs font-black text-emerald-700">عرض جميع المستفيدين ←</Link></div>
          </article>

          <article className="app-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-black text-slate-800">آخر سجلات المواظبة والحضور</h2>
              <CalendarDays size={19} className="text-emerald-600" />
            </div>
            <div className="overflow-x-auto">
              <table className="data-table min-w-[560px]">
                <thead><tr><th>المستفيد</th><th>التاريخ</th><th>الحالة</th><th>الوصول</th></tr></thead>
                <tbody>
                  {recentAttendance.length ? recentAttendance.map((record) => (
                    <tr key={record.id}>
                      <td className="font-black text-slate-800">{record.beneficiary.firstName} {record.beneficiary.lastName}</td>
                      <td className="text-slate-500">{formatDate(record.date)}</td>
                      <td><span className={`status-badge ${attendanceBadge[record.status]}`}>{attendanceLabels[record.status]}</span></td>
                      <td className="font-mono text-slate-500">{record.arrivalTime || "—"}</td>
                    </tr>
                  )) : <tr><td colSpan={4} className="py-10 text-center text-slate-400">لا توجد سجلات حضور بعد.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-5 py-3"><Link href="/attendance" className="text-xs font-black text-emerald-700">عرض جميع السجلات ←</Link></div>
          </article>
        </section>

        <footer className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-[11px] font-bold text-slate-400 sm:flex-row sm:justify-between">
          <span>منصة الفرصة الثانية — تدبير مسار المستفيدين</span>
          <span>مرحبًا، {session.fullName}</span>
        </footer>
      </div>
    </AppShell>
  );
}
