"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, Filter, RefreshCw, Search } from "lucide-react";

type Group = { id: string; name: string; academicYear: string };
type Row = {
  id: string;
  fullName: string;
  identityNumber: string;
  phone: string;
  status: string;
  groupName: string;
  academicYear: string;
  track: string;
  attendanceRate: number;
  absences: number;
  documents: number;
  activeInternships: number;
  completedInternships: number;
  registeredAt: string;
};
type Summary = {
  total: number;
  enrolled: number;
  completed: number;
  averageAttendance: number;
  highAbsenceRisk: number;
  withDocuments: number;
};

type ResponseData = { rows: Row[]; groups: Group[]; summary: Summary };

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

function buildQuery(form: HTMLFormElement) {
  const data = new FormData(form);
  const params = new URLSearchParams();
  for (const key of ["status", "groupId", "from", "to"]) {
    const value = String(data.get(key) || "").trim();
    if (value) params.set(key, value);
  }
  return params;
}

export function ReportExplorer() {
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeParams, setActiveParams] = useState(new URLSearchParams());

  async function load(params = activeParams) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/reports/explorer?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("تعذر تحميل التقرير المفلتر.");
      setData(await response.json());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(new URLSearchParams()); }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = buildQuery(event.currentTarget);
    setActiveParams(params);
    load(params);
  }

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data?.rows || [];
    return (data?.rows || []).filter((row) =>
      [row.fullName, row.identityNumber, row.phone, row.groupName, row.track]
        .some((value) => value.toLowerCase().includes(normalized))
    );
  }, [data, query]);

  const summaryCards = data ? [
    ["النتائج", data.summary.total],
    ["المتمدرسون", data.summary.enrolled],
    ["المستكملون", data.summary.completed],
    ["متوسط الحضور", `${data.summary.averageAttendance}%`],
    ["خطر غياب مرتفع", data.summary.highAbsenceRisk],
    ["لديهم وثائق", data.summary.withDocuments]
  ] : [];

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 print:hidden">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">منشئ التقارير</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">تقرير مفلتر وقابل للتصدير</h2>
          <p className="mt-2 text-sm text-slate-500">اختر الفترة والوضعية والمجموعة، ثم صدّر النتائج إلى CSV.</p>
        </div>
        <a href={`/api/reports/explorer?${activeParams.toString()}${activeParams.toString() ? "&" : ""}format=csv`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
          <Download size={17} /> تصدير CSV
        </a>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-5">
        <select name="status" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="">جميع الوضعيات</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select name="groupId" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="">جميع المجموعات</option>
          {(data?.groups || []).map((group) => <option key={group.id} value={group.id}>{group.name} · {group.academicYear}</option>)}
        </select>
        <input name="from" type="date" aria-label="من تاريخ" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
        <input name="to" type="date" aria-label="إلى تاريخ" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
        <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Filter size={16} /> تطبيق الفلاتر</button>
      </form>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>)}
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث داخل النتائج..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-3 pr-10 text-sm" />
        </div>
        <button type="button" onClick={() => load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> تحديث</button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr>{["المستفيد", "الوضعية", "المجموعة", "الحضور", "الغيابات", "الوثائق", "التداريب", "التسجيل"].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 font-semibold">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">جارٍ تحميل التقرير...</td></tr> : filteredRows.length ? filteredRows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><a href={`/beneficiaries/${row.id}`} className="font-semibold text-blue-700 hover:underline">{row.fullName}</a><p className="mt-1 text-xs text-slate-400">{row.identityNumber || row.phone || "بدون معرف"}</p></td>
                <td className="whitespace-nowrap px-4 py-3">{statusLabels[row.status] || row.status}</td>
                <td className="whitespace-nowrap px-4 py-3">{row.groupName}<p className="mt-1 text-xs text-slate-400">{row.track}</p></td>
                <td className="px-4 py-3 font-semibold">{row.attendanceRate}%</td>
                <td className={`px-4 py-3 font-semibold ${row.absences >= 5 ? "text-red-700" : ""}`}>{row.absences}</td>
                <td className="px-4 py-3">{row.documents}</td>
                <td className="whitespace-nowrap px-4 py-3">{row.activeInternships} جارية · {row.completedInternships} مكتملة</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(row.registeredAt).toLocaleDateString("ar-MA")}</td>
              </tr>
            )) : <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">لا توجد نتائج مطابقة.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">يعرض الجدول حتى 1000 سجل في كل تقرير.</p>
    </section>
  );
}
