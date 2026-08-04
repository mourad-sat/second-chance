"use client";

import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

type AdmissionItem = {
  id: string;
  fullName: string;
  fileNumber: string;
  identityNumber: string;
  phone: string;
  registrationDate: string;
  interviewDate: string;
  proposedTrack: string;
  proposedSpecialty: string;
  decision: string;
  hasAssessment: boolean;
};

const decisionLabels: Record<string, string> = {
  NOT_STARTED: "لم يبدأ التشخيص",
  PENDING: "في انتظار القرار",
  ACCEPTED: "مقبول",
  WAITLISTED: "لائحة الانتظار",
  REJECTED: "غير مقبول",
  NEEDS_REASSESSMENT: "إعادة تقييم"
};

const decisionStyles: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700",
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  WAITLISTED: "bg-blue-50 text-blue-700",
  REJECTED: "bg-rose-50 text-rose-700",
  NEEDS_REASSESSMENT: "bg-violet-50 text-violet-700"
};

export function AdmissionsTable({ items }: { items: AdmissionItem[] }) {
  const [query, setQuery] = useState("");
  const [decision, setDecision] = useState("ALL");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const itemDecision = item.hasAssessment ? item.decision : "NOT_STARTED";
      const matchesDecision = decision === "ALL" || itemDecision === decision;
      const haystack = [
        item.fullName,
        item.fileNumber,
        item.identityNumber,
        item.phone,
        item.proposedTrack,
        item.proposedSpecialty
      ]
        .join(" ")
        .toLowerCase();

      return matchesDecision && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [items, query, decision]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-bold">لائحة التشخيص والقبول</h2>
            <p className="mt-1 text-sm text-slate-500">ابدأ التشخيص أو استكمل التوجيه وقرار اللجنة.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-0 sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="الاسم، رقم الملف، الهاتف أو المسار..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm outline-none focus:border-blue-400 focus:bg-white"
              />
            </label>

            <label className="relative sm:w-56">
              <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <select
                value={decision}
                onChange={(event) => setDecision(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm outline-none focus:border-blue-400"
              >
                <option value="ALL">كل الحالات</option>
                <option value="NOT_STARTED">لم يبدأ التشخيص</option>
                <option value="PENDING">في انتظار القرار</option>
                <option value="ACCEPTED">مقبول</option>
                <option value="WAITLISTED">لائحة الانتظار</option>
                <option value="NEEDS_REASSESSMENT">إعادة تقييم</option>
                <option value="REJECTED">غير مقبول</option>
              </select>
            </label>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">النتائج المعروضة: {filtered.length} من أصل {items.length}</p>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <p className="font-semibold text-slate-700">لا توجد نتائج مطابقة.</p>
          <p className="mt-1 text-sm text-slate-500">غيّر عبارة البحث أو حالة التصفية.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4">المستفيد</th>
                <th className="px-5 py-4">رقم الملف</th>
                <th className="px-5 py-4">تاريخ التسجيل</th>
                <th className="px-5 py-4">المقابلة</th>
                <th className="px-5 py-4">التوجيه المقترح</th>
                <th className="px-5 py-4">قرار اللجنة</th>
                <th className="px-5 py-4">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const itemDecision = item.hasAssessment ? item.decision : "NOT_STARTED";
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{item.fullName}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.phone || item.identityNumber || "لا توجد وسيلة اتصال"}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{item.fileNumber}</td>
                    <td className="px-5 py-4">{item.registrationDate}</td>
                    <td className="px-5 py-4">{item.interviewDate || "غير منجزة"}</td>
                    <td className="px-5 py-4">{item.proposedSpecialty || item.proposedTrack || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${decisionStyles[itemDecision]}`}>
                        {decisionLabels[itemDecision]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/beneficiaries/${item.id}#diagnosis`}
                        className="inline-flex rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {item.hasAssessment ? "فتح التشخيص" : "بدء التشخيص"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
