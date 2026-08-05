"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  GraduationCap,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UsersRound
} from "lucide-react";

type Analytics = {
  attendanceTrend: { date: string; rate: number; total: number }[];
  supportPlans: Record<string, number>;
  internships: Record<string, number>;
  skills: Record<string, number>;
  groupPerformance: { id: string; name: string; pathway: string; beneficiaries: number; attendanceRate: number }[];
  generatedAt: string;
};

const skillLabels: Record<string, string> = {
  NOT_ASSESSED: "غير مقيم",
  BEGINNER: "مبتدئ",
  DEVELOPING: "في طور التطور",
  COMPETENT: "متمكن",
  ADVANCED: "متقدم"
};

const skillTones: Record<string, string> = {
  NOT_ASSESSED: "from-slate-400 to-slate-300",
  BEGINNER: "from-amber-500 to-orange-300",
  DEVELOPING: "from-blue-500 to-cyan-300",
  COMPETENT: "from-emerald-600 to-green-300",
  ADVANCED: "from-violet-600 to-fuchsia-300"
};

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("ar-MA", { day: "2-digit", month: "2-digit" });
}

function DashboardSkeleton() {
  return (
    <section className="mt-6 space-y-5" aria-label="جارٍ تحميل التحليلات">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2"><div className="skeleton h-4 w-28" /><div className="skeleton h-8 w-64" /></div>
        <div className="skeleton h-11 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="app-card space-y-4 p-5"><div className="skeleton h-12 w-12" /><div className="skeleton h-4 w-32" /><div className="skeleton h-9 w-20" /><div className="skeleton h-3 w-full" /></div>)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="app-card h-80 p-6"><div className="skeleton h-full w-full" /></div>
        <div className="app-card h-80 p-6"><div className="skeleton h-full w-full" /></div>
      </div>
    </section>
  );
}

export function DashboardAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/dashboard/analytics", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "تعذر تحميل التحليلات.");
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل التحليلات.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 120000);
    return () => window.clearInterval(timer);
  }, []);

  const maxAttendance = useMemo(() => Math.max(...(data?.attendanceTrend.map((item) => item.rate) || [100]), 100), [data]);
  const supportOpen = (data?.supportPlans.PLANNED || 0) + (data?.supportPlans.IN_PROGRESS || 0);
  const internshipTotal = Object.values(data?.internships || {}).reduce((sum, value) => sum + value, 0);
  const internshipCompleted = data?.internships.COMPLETED || 0;
  const competentSkills = (data?.skills.COMPETENT || 0) + (data?.skills.ADVANCED || 0);
  const totalSkills = Object.values(data?.skills || {}).reduce((sum, value) => sum + value, 0);

  if (loading && !data) return <DashboardSkeleton />;

  if (error && !data) {
    return (
      <section className="mt-6 rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <p className="font-black text-red-800">تعذر تحميل التحليلات التنفيذية</p>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white hover:bg-red-800"><RefreshCw size={16} /> إعادة المحاولة</button>
      </section>
    );
  }

  if (!data) return null;

  const metrics = [
    { label: "خطط الدعم المفتوحة", value: supportOpen, note: "خطط تحتاج متابعة أو تنفيذ", icon: GraduationCap, href: "/academic-tracking", tone: "bg-amber-50 text-amber-700", accent: "from-amber-500 to-orange-300" },
    { label: "إتمام التداريب", value: `${internshipTotal ? Math.round((internshipCompleted / internshipTotal) * 100) : 0}%`, note: `${internshipCompleted} مكتمل من أصل ${internshipTotal}`, icon: BriefcaseBusiness, href: "/integration", tone: "bg-blue-50 text-blue-700", accent: "from-blue-600 to-cyan-300" },
    { label: "الكفايات المتقنة", value: `${totalSkills ? Math.round((competentSkills / totalSkills) * 100) : 0}%`, note: `${competentSkills} تقييمًا متمكنًا أو متقدمًا`, icon: BarChart3, href: "/vocational-training", tone: "bg-emerald-50 text-emerald-700", accent: "from-emerald-600 to-green-300" },
    { label: "المجموعات المقاسة", value: data.groupPerformance.length, note: "وفق بيانات الحضور لـ14 يومًا", icon: UsersRound, href: "/groups", tone: "bg-violet-50 text-violet-700", accent: "from-violet-600 to-fuchsia-300" }
  ];

  return (
    <section className="mt-6 space-y-5" aria-label="التحليلات التنفيذية">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-black text-violet-700"><Sparkles size={13} /> Analytics 3.0</div>
          <h2 className="mt-3 text-2xl font-black text-slate-950 md:text-3xl">اتجاهات الأداء والتشخيص التشغيلي</h2>
          <p className="mt-2 text-sm text-slate-500">مؤشرات حية تُحدّث تلقائيًا كل دقيقتين من البيانات الفعلية للمنصة.</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary inline-flex items-center justify-center gap-2 self-start md:self-auto">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> تحديث الآن
        </button>
      </div>

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">تعذر التحديث الأخير، ويتم عرض آخر بيانات متاحة.</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, note, icon: Icon, href, tone, accent }) => (
          <Link key={label} href={href} className="app-card group relative overflow-hidden p-5 hover:-translate-y-1">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div>
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon size={22} /></span>
            </div>
            <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">{note}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <article className="app-card p-5 md:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div><p className="app-eyebrow">الحضور اليومي</p><h3 className="mt-1 text-xl font-black text-slate-950">اتجاه الحضور خلال 14 يومًا</h3><p className="mt-1 text-sm text-slate-500">الحضور والتأخر المقبول من مجموع السجلات اليومية.</p></div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"><TrendingUp size={20} /></span>
          </div>
          <div className="flex h-64 items-end gap-2 overflow-x-auto border-b border-slate-200 pb-3">
            {data.attendanceTrend.map((item) => (
              <div key={item.date} className="flex min-w-10 flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[11px] font-black text-slate-700">{item.total ? `${item.rate}%` : "—"}</span>
                <div className="flex h-44 w-full items-end overflow-hidden rounded-t-xl bg-slate-100">
                  <div className="w-full rounded-t-xl bg-gradient-to-t from-blue-700 to-cyan-400 transition-all" style={{ height: item.total ? `${Math.max(5, (item.rate / maxAttendance) * 100)}%` : "2%" }} title={`${item.rate}% من ${item.total} سجل`} />
                </div>
                <span className="text-[10px] font-medium text-slate-500">{dateLabel(item.date)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="app-card p-5 md:p-6">
          <div className="mb-5"><p className="app-eyebrow">مقارنة تشغيلية</p><h3 className="mt-1 text-xl font-black text-slate-950">أداء المجموعات</h3><p className="mt-1 text-sm text-slate-500">ترتيب الحضور خلال آخر 14 يومًا.</p></div>
          <div className="space-y-3">
            {data.groupPerformance.length ? data.groupPerformance.map((group) => (
              <div key={group.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-blue-100 hover:bg-blue-50/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate font-black text-slate-900">{group.name}</p><p className="mt-1 truncate text-xs text-slate-500">{group.pathway} · {group.beneficiaries} مستفيدًا</p></div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${group.attendanceRate >= 85 ? "bg-emerald-100 text-emerald-700" : group.attendanceRate >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{group.attendanceRate}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-l from-blue-700 to-cyan-400" style={{ width: `${group.attendanceRate}%` }} /></div>
              </div>
            )) : <div className="empty-state"><UsersRound className="mx-auto mb-3 text-slate-300" size={36} /><p className="font-black text-slate-700">لا توجد بيانات حضور كافية</p><p className="mt-1 text-sm text-slate-500">ستظهر مقارنة المجموعات بعد تسجيل الحضور.</p></div>}
          </div>
        </article>
      </div>

      <article className="app-card p-5 md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="app-eyebrow">التكوين المهني</p><h3 className="mt-1 text-xl font-black text-slate-950">توزيع مستويات الكفايات المهنية</h3><p className="mt-1 text-sm text-slate-500">صورة مجمعة لجميع تقييمات الكفايات المسجلة.</p></div>
          <Link href="/vocational-training" className="text-sm font-black text-blue-700 hover:text-blue-900">فتح التكوين المهني ←</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(skillLabels).map(([key, label]) => {
            const value = data.skills[key] || 0;
            const rate = totalSkills ? Math.round((value / totalSkills) * 100) : 0;
            return (
              <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-black text-slate-700">{label}</span><strong className="text-lg text-slate-950">{value}</strong></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full bg-gradient-to-l ${skillTones[key]}`} style={{ width: `${rate}%` }} /></div>
                <p className="mt-2 text-xs text-slate-500">{rate}% من التقييمات</p>
              </div>
            );
          })}
        </div>
      </article>

      <p className="flex items-center justify-end gap-1.5 text-xs text-slate-400"><Clock3 size={13} /> آخر تحديث: {new Date(data.generatedAt).toLocaleString("ar-MA")}</p>
    </section>
  );
}
