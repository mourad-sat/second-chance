"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleSlash2,
  Clock3,
  Search,
  ShieldCheck
} from "lucide-react";

type TransitionOption = {
  value: string;
  label: string;
  description: string;
  blockers: string[];
  warnings: string[];
  ready: boolean;
};

type WorkflowItem = {
  id: string;
  firstName: string;
  lastName: string;
  registrationNumber: string | null;
  masarNumber: string | null;
  status: string;
  stageLabel: string;
  progress: number;
  readinessRate: number;
  groupName: string | null;
  blockersCount: number;
  warningsCount: number;
  lastTransition: { title: string; date: string; actorName: string | null } | null;
  nextOptions: TransitionOption[];
};

const statusLabels: Record<string, string> = {
  PRE_REGISTERED: "مسجل أوليًا",
  UNDER_REVIEW: "قيد الدراسة",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "مقبول",
  REJECTED: "غير مقبول",
  ENROLLED: "متمدرس",
  WITHDRAWN: "منسحب",
  COMPLETED: "أنهى البرنامج"
};

export function WorkflowManager({ items }: { items: WorkflowItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [readinessFilter, setReadinessFilter] = useState("ALL");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const searchable = `${item.firstName} ${item.lastName} ${item.registrationNumber || ""} ${item.masarNumber || ""} ${item.groupName || ""}`.toLowerCase();
      const matchesQuery = !normalized || searchable.includes(normalized);
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const hasReady = item.nextOptions.some((option) => option.ready);
      const matchesReadiness = readinessFilter === "ALL" || (readinessFilter === "READY" ? hasReady : !hasReady && item.nextOptions.length > 0);
      return matchesQuery && matchesStatus && matchesReadiness;
    });
  }, [items, query, statusFilter, readinessFilter]);

  async function submit(event: FormEvent<HTMLFormElement>, beneficiaryId: string, nextStatus: string) {
    event.preventDefault();
    const key = `${beneficiaryId}:${nextStatus}`;
    setSavingKey(key);
    setMessage("");
    const form = event.currentTarget;
    const note = String(new FormData(form).get("note") || "");

    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beneficiaryId, nextStatus, note })
      });
      const result = await response.json();
      if (!response.ok) {
        const blockers = Array.isArray(result.blockers) ? ` ${result.blockers.join(" ")}` : "";
        throw new Error((result.message || "تعذر تحديث المسار.") + blockers);
      }
      setMessage(result.message);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_220px]">
        <label className="relative block">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو رقم التسجيل أو مسار أو المجموعة..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-11 text-sm outline-none transition focus:border-blue-500 focus:bg-white" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500">
          <option value="ALL">جميع المراحل</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={readinessFilter} onChange={(event) => setReadinessFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500">
          <option value="ALL">كل حالات الجاهزية</option>
          <option value="READY">جاهز للانتقال</option>
          <option value="BLOCKED">متطلبات ناقصة</option>
        </select>
      </section>

      {message && <p className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">{message}</p>}

      <div className="flex items-center justify-between px-1 text-sm text-slate-500">
        <span>{filtered.length} ملفًا معروضًا</span>
        <span>{items.length} ملفًا إجمالًا</span>
      </div>

      <section className="grid gap-5 xl:grid-cols-2">
        {filtered.map((item) => {
          const readyCount = item.nextOptions.filter((option) => option.ready).length;
          const completed = item.nextOptions.length === 0;
          return (
            <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-700 font-black text-white">{item.firstName.charAt(0)}{item.lastName.charAt(0)}</span>
                    <div>
                      <Link href={`/beneficiaries/${item.id}/overview`} className="text-lg font-black text-slate-950 hover:text-blue-700">{item.firstName} {item.lastName}</Link>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>{item.registrationNumber || "دون رقم تسجيل"}</span>
                        <span>مسار: {item.masarNumber || "غير محدد"}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-black ${completed ? "bg-violet-50 text-violet-700" : readyCount ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {completed ? "المسار مكتمل" : readyCount ? `${readyCount} انتقال جاهز` : "متطلبات ناقصة"}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-500">المرحلة الحالية</p><p className="mt-1 text-sm font-black text-slate-900">{item.stageLabel}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-500">المجموعة</p><p className="mt-1 text-sm font-black text-slate-900">{item.groupName || "غير مسند"}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-500">جاهزية الانتقال</p><p className="mt-1 text-sm font-black text-slate-900">{item.readinessRate}%</p></div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs font-bold text-slate-500"><span>تقدم رحلة المستفيد</span><span>{item.progress}%</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700" style={{ width: `${item.progress}%` }} /></div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs font-bold text-slate-500"><span>جاهزية الخطوة التالية</span><span>{item.readinessRate}%</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.readinessRate === 100 ? "bg-emerald-600" : item.readinessRate > 0 ? "bg-amber-500" : "bg-slate-300"}`} style={{ width: `${item.readinessRate}%` }} /></div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-red-700"><CircleSlash2 size={14} /> {item.blockersCount} متطلبات مانعة</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-amber-700"><AlertTriangle size={14} /> {item.warningsCount} تنبيهات</span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><ShieldCheck size={18} className="text-blue-700" /> الإجراءات المتاحة</h3>
                <div className="mt-4 space-y-3">
                  {item.nextOptions.length ? item.nextOptions.map((option) => (
                    <details key={option.value} className={`group rounded-2xl border ${option.ready ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-slate-50"}`}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3">
                          <span className={`grid h-9 w-9 place-items-center rounded-xl ${option.ready ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>{option.ready ? <CheckCircle2 size={18} /> : <CircleSlash2 size={18} />}</span>
                          <div><p className="text-sm font-black text-slate-900">{option.label}</p><p className="mt-0.5 text-xs text-slate-500">{option.ready ? "جاهز للتنفيذ" : "لا يمكن التنفيذ حاليًا"}</p></div>
                        </div>
                        <ChevronDown size={18} className="text-slate-400 transition group-open:rotate-180" />
                      </summary>
                      <div className="border-t border-slate-200/70 p-4">
                        <p className="text-sm leading-6 text-slate-600">{option.description}</p>
                        {option.blockers.length > 0 && <div className="mt-3 rounded-xl bg-red-50 p-3"><p className="text-xs font-black text-red-800">المتطلبات الإلزامية</p><ul className="mt-2 space-y-1 text-xs text-red-700">{option.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul></div>}
                        {option.warnings.length > 0 && <div className="mt-3 rounded-xl bg-amber-50 p-3"><p className="text-xs font-black text-amber-800">تنبيهات قبل التنفيذ</p><ul className="mt-2 space-y-1 text-xs text-amber-700">{option.warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul></div>}
                        <form onSubmit={(event) => submit(event, item.id, option.value)} className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <input name="note" placeholder="ملاحظة توثق سبب الانتقال..." className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-500" />
                          <button disabled={!option.ready || savingKey === `${item.id}:${option.value}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                            {savingKey === `${item.id}:${option.value}` ? "جارٍ التنفيذ..." : <><ArrowLeft size={14} /> تنفيذ الانتقال</>}
                          </button>
                        </form>
                      </div>
                    </details>
                  )) : <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50 p-6 text-center"><CheckCircle2 className="mx-auto text-violet-700" size={30} /><p className="mt-2 font-black text-violet-900">لا توجد انتقالات أخرى</p><p className="mt-1 text-xs text-violet-700">وصل الملف إلى نهاية المسار الحالي.</p></div>}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  {item.lastTransition ? <div className="flex items-start gap-2 text-xs text-slate-500"><Clock3 size={15} className="mt-0.5 shrink-0" /><div><p className="font-bold text-slate-700">{item.lastTransition.title}</p><p className="mt-1">{new Intl.DateTimeFormat("ar-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.lastTransition.date))}{item.lastTransition.actorName ? ` · ${item.lastTransition.actorName}` : ""}</p></div></div> : <p className="text-xs text-slate-400">لم يُسجل انتقال سابق لهذا الملف.</p>}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {filtered.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">لا توجد ملفات مطابقة لمعايير البحث.</div>}
    </div>
  );
}
