"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, BriefcaseBusiness, GraduationCap, RefreshCw, UsersRound } from "lucide-react";

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

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("ar-MA", { day: "2-digit", month: "2-digit" });
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

  if (loading && !data) {
    return <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">جارٍ تحميل التحليلات التنفيذية...</section>;
  }

  if (error && !data) {
    return <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center"><p className="text-sm font-semibold text-red-700">{error}</p><button onClick={load} className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white">إعادة المحاولة</button></section>;
  }

  if (!data) return null;

  return (
    <section className="mx-auto mt-6 max-w-7xl space-y-6" aria-label="التحليلات التنفيذية">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><p className="text-sm font-semibold text-blue-600">تحليلات الأداء</p><h2 className="mt-1 text-2xl font-bold text-slate-950">اتجاهات وتشخيص تشغيلي</h2><p className="mt-1 text-sm text-slate-500">تحديث تلقائي كل دقيقتين من البيانات الفعلية.</p></div>
        <button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> تحديث الآن</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">خطط الدعم المفتوحة</p><p className="mt-2 text-3xl font-bold">{supportOpen}</p></div><GraduationCap className="text-amber-600" /></div><Link href="/academic-tracking" className="mt-4 inline-flex text-xs font-semibold text-blue-700">فتح التتبع التربوي ←</Link></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">إتمام التداريب</p><p className="mt-2 text-3xl font-bold">{internshipTotal ? Math.round((internshipCompleted / internshipTotal) * 100) : 0}%</p></div><BriefcaseBusiness className="text-blue-600" /></div><p className="mt-4 text-xs text-slate-500">{internshipCompleted} مكتمل من أصل {internshipTotal}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">الكفايات المتقنة</p><p className="mt-2 text-3xl font-bold">{totalSkills ? Math.round((competentSkills / totalSkills) * 100) : 0}%</p></div><BarChart3 className="text-emerald-600" /></div><p className="mt-4 text-xs text-slate-500">{competentSkills} تقييمًا بمستوى متمكن أو متقدم</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">المجموعات المقاسة</p><p className="mt-2 text-3xl font-bold">{data.groupPerformance.length}</p></div><UsersRound className="text-violet-600" /></div><p className="mt-4 text-xs text-slate-500">آخر 14 يومًا من سجلات الحضور</p></article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6"><h3 className="text-xl font-bold">اتجاه الحضور خلال 14 يومًا</h3><p className="mt-1 text-sm text-slate-500">النسبة اليومية للحضور والتأخر المقبول من مجموع السجلات.</p></div>
          <div className="flex h-64 items-end gap-2 overflow-x-auto border-b border-slate-200 pb-3">
            {data.attendanceTrend.map((item) => (
              <div key={item.date} className="flex min-w-10 flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[11px] font-bold text-slate-700">{item.total ? `${item.rate}%` : "—"}</span>
                <div className="flex h-44 w-full items-end rounded-t-xl bg-slate-100"><div className="w-full rounded-t-xl bg-blue-600 transition-all" style={{ height: item.total ? `${Math.max(5, (item.rate / maxAttendance) * 100)}%` : "2%" }} title={`${item.rate}% من ${item.total} سجل`} /></div>
                <span className="text-[10px] text-slate-500">{dateLabel(item.date)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5"><h3 className="text-xl font-bold">أداء المجموعات</h3><p className="mt-1 text-sm text-slate-500">ترتيب الحضور خلال آخر 14 يومًا.</p></div>
          <div className="space-y-3">
            {data.groupPerformance.length ? data.groupPerformance.map((group) => (
              <div key={group.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{group.name}</p><p className="mt-1 text-xs text-slate-500">{group.pathway} · {group.beneficiaries} مستفيدًا</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${group.attendanceRate >= 85 ? "bg-emerald-100 text-emerald-700" : group.attendanceRate >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{group.attendanceRate}%</span></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600" style={{ width: `${group.attendanceRate}%` }} /></div>
              </div>
            )) : <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">لا توجد بيانات حضور كافية للمجموعات.</p>}
          </div>
        </article>
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5"><h3 className="text-xl font-bold">توزيع مستويات الكفايات المهنية</h3><p className="mt-1 text-sm text-slate-500">صورة مجمعة لجميع تقييمات الكفايات المسجلة.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(skillLabels).map(([key, label]) => {
            const value = data.skills[key] || 0;
            const rate = totalSkills ? Math.round((value / totalSkills) * 100) : 0;
            return <div key={key} className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">{label}</span><strong>{value}</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600" style={{ width: `${rate}%` }} /></div><p className="mt-2 text-xs text-slate-500">{rate}% من التقييمات</p></div>;
          })}
        </div>
      </article>

      <p className="text-left text-xs text-slate-400">آخر تحديث: {new Date(data.generatedAt).toLocaleString("ar-MA")}</p>
    </section>
  );
}
