"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AdmissionItem = {
  id: string;
  fullName: string;
  registrationNumber: string;
  masarNumber: string;
  identityNumber: string;
  phone: string;
  gender: string;
  province: string;
  profilePhotoUrl: string;
  registrationDate: string;
  status: string;
  source: "EXTERNAL" | "INTERNAL";
  documentCount: number;
  interviewDate: string;
  proposedTrack: string;
  proposedSpecialty: string;
  decision: string;
  hasAssessment: boolean;
};

const pageSize = 25;

const statusLabels: Record<string, string> = {
  PRE_REGISTERED: "تسجيل قبلي",
  UNDER_REVIEW: "قيد الدراسة",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "مقبول",
  REJECTED: "غير مقبول"
};

const statusStyles: Record<string, string> = {
  PRE_REGISTERED: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  WAITLISTED: "bg-orange-50 text-orange-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700"
};

export function AdmissionsTable({ items }: { items: AdmissionItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = status === "ALL" || item.status === status;
      const matchesSource = source === "ALL" || item.source === source;
      const haystack = [
        item.fullName,
        item.registrationNumber,
        item.masarNumber,
        item.identityNumber,
        item.phone,
        item.province,
        item.proposedTrack,
        item.proposedSpecialty
      ].join(" ").toLowerCase();
      return matchesStatus && matchesSource && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [items, query, status, source]);

  useEffect(() => setPage(1), [query, status, source]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5 md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">لائحة الطلبات</h2>
            <p className="mt-1 text-sm text-slate-500">ابحث، صفّ الطلبات، ثم افتح الملف لمراجعة البيانات والوثائق واتخاذ القرار.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[320px_210px_190px]">
            <label className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="الاسم، رقم الطلب، مسار أو الهاتف..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-10 text-sm outline-none focus:border-blue-500 focus:bg-white" />
            </label>
            <label className="relative">
              <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm outline-none focus:border-blue-500">
                <option value="ALL">كل الحالات</option>
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <select value={source} onChange={(event) => setSource(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500">
              <option value="ALL">كل المصادر</option>
              <option value="EXTERNAL">استمارة خارجية</option>
              <option value="INTERNAL">تسجيل داخلي</option>
            </select>
          </div>
        </div>
        <p className="mt-4 text-xs font-bold text-slate-500">النتائج: {filtered.length} من أصل {items.length}</p>
      </div>

      {visible.length === 0 ? (
        <div className="p-12 text-center"><p className="font-black text-slate-700">لا توجد طلبات مطابقة.</p><p className="mt-1 text-sm text-slate-500">غيّر البحث أو عوامل التصفية.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table min-w-[1250px]">
            <thead><tr><th>المترشح</th><th>رقم الطلب</th><th>المصدر</th><th>التسجيل</th><th>المجال المطلوب</th><th>الوثائق</th><th>الحالة</th><th>الإجراء</th></tr></thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {item.profilePhotoUrl ? <img src={item.profilePhotoUrl} alt="" className="h-11 w-11 rounded-xl object-cover" /> : <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 font-black text-slate-500">{item.fullName.slice(0, 1)}</div>}
                      <div><p className="font-black text-slate-900">{item.fullName}</p><p className="mt-1 text-xs text-slate-500">{item.phone || "بدون هاتف"} · {item.province || "الإقليم غير محدد"}</p></div>
                    </div>
                  </td>
                  <td><p className="font-mono text-xs font-black text-slate-800">{item.registrationNumber}</p><p className="mt-1 text-xs text-slate-400">مسار: {item.masarNumber || "—"}</p></td>
                  <td><span className={`rounded-full px-3 py-1 text-xs font-black ${item.source === "EXTERNAL" ? "bg-cyan-50 text-cyan-700" : "bg-slate-100 text-slate-700"}`}>{item.source === "EXTERNAL" ? "خارجي" : "داخلي"}</span></td>
                  <td>{new Date(item.registrationDate).toLocaleDateString("ar-MA")}</td>
                  <td>{item.proposedSpecialty || item.proposedTrack || "لم يحدد"}</td>
                  <td><span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700"><FileText size={14} /> {item.documentCount}</span></td>
                  <td><span className={`rounded-full px-3 py-1 text-xs font-black ${statusStyles[item.status] || "bg-slate-100 text-slate-700"}`}>{statusLabels[item.status] || item.status}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/beneficiaries/${item.id}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white"><ExternalLink size={14} /> فتح الملف</Link>
                      <Link href={`/beneficiaries/${item.id}#diagnosis`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">التشخيص</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold text-slate-500">الصفحة {safePage} من {totalPages} · {pageSize} طلبًا في الصفحة</p>
        <div className="flex gap-2">
          <button disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black disabled:opacity-40"><ChevronRight size={16} /> السابق</button>
          <button disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black disabled:opacity-40">التالي <ChevronLeft size={16} /></button>
        </div>
      </div>
    </section>
  );
}
