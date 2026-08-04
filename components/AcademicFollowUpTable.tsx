"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Search, ShieldCheck, TrendingUp } from "lucide-react";

type FollowUpItem = {
  id: string;
  fullName: string;
  groupName: string;
  specialty: string;
  attendanceRate: number;
  absences: number;
  academicAverage: number;
  trainingReadiness: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  lastAssessment: string;
  lastSupport: string;
  hasResults: boolean;
  hasAttendance: boolean;
};

const riskLabels = {
  LOW: "مستقر",
  MEDIUM: "يحتاج متابعة",
  HIGH: "خطر مرتفع"
};

const riskStyles = {
  LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-rose-50 text-rose-700"
};

export function AcademicFollowUpTable({ items }: { items: FollowUpItem[] }) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("ALL");
  const [group, setGroup] = useState("ALL");

  const groups = useMemo(
    () => Array.from(new Set(items.map((item) => item.groupName))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = !normalizedQuery || [item.fullName, item.groupName, item.specialty]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesRisk = risk === "ALL" || item.riskLevel === risk;
      const matchesGroup = group === "ALL" || item.groupName === group;
      return matchesQuery && matchesRisk && matchesGroup;
    });
  }, [items, query, risk, group]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">لوحة المتابعة الفردية</h2>
            <p className="mt-1 text-sm text-slate-500">ابحث عن المستفيد، راقب مؤشرات الخطر، وافتح خطة الدعم لاتخاذ الإجراء المناسب.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[680px]">
            <label className="relative block sm:col-span-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="الاسم أو المجموعة..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3 pr-10 text-sm outline-none focus:border-blue-500"
              />
            </label>
            <select value={risk} onChange={(event) => setRisk(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option value="ALL">كل مستويات الخطر</option>
              <option value="HIGH">خطر مرتفع</option>
              <option value="MEDIUM">يحتاج متابعة</option>
              <option value="LOW">مستقر</option>
            </select>
            <select value={group} onChange={(event) => setGroup(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option value="ALL">كل المجموعات</option>
              {groups.map((groupName) => <option key={groupName} value={groupName}>{groupName}</option>)}
            </select>
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500">النتائج المعروضة: {filtered.length} من {items.length}</p>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500">لا توجد نتائج مطابقة للبحث أو التصفية.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4">المستفيد</th>
                <th className="px-5 py-4">المجموعة والمسار</th>
                <th className="px-5 py-4">الحضور</th>
                <th className="px-5 py-4">التقدم</th>
                <th className="px-5 py-4">الجاهزية للتكوين</th>
                <th className="px-5 py-4">مؤشر الخطر</th>
                <th className="px-5 py-4">آخر تقويم</th>
                <th className="px-5 py-4">آخر دعم</th>
                <th className="px-5 py-4">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="align-top hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900">{item.fullName}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.absences} غيابات مسجلة</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">{item.groupName}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.specialty}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2"><span className="font-bold">{item.attendanceRate}%</span>{item.hasAttendance ? <ShieldCheck size={16} className="text-emerald-600" /> : null}</div>
                    <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.attendanceRate}%` }} /></div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2"><span className="font-bold">{item.academicAverage}%</span><TrendingUp size={16} className="text-violet-600" /></div>
                    <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${item.academicAverage}%` }} /></div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-blue-700">{item.trainingReadiness}%</span>
                    <p className="mt-1 text-xs text-slate-500">{item.trainingReadiness >= 70 ? "جاهز مبدئيًا" : "يحتاج تطويرًا"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${riskStyles[item.riskLevel]}`}>
                      {item.riskLevel === "HIGH" && <AlertTriangle size={13} />}
                      {riskLabels[item.riskLevel]}
                    </span>
                  </td>
                  <td className="max-w-56 px-5 py-4 text-xs leading-6 text-slate-600">{item.lastAssessment}</td>
                  <td className="max-w-56 px-5 py-4 text-xs leading-6 text-slate-600">{item.lastSupport}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2">
                      <Link href={`/beneficiaries/${item.id}/support-plan`} className="inline-flex justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
                        خطة الدعم الفردية
                      </Link>
                      <Link href={`/beneficiaries/${item.id}#academic`} className="inline-flex justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100">
                        فتح الملف الموحد
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
