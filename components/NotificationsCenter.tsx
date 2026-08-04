"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, CheckCheck, Filter, Search } from "lucide-react";

type Notification = {
  id: string;
  type: "ATTENDANCE" | "ACADEMIC" | "SOCIAL" | "INTERNSHIP";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  href: string;
  beneficiaryName?: string;
  dueDate?: string;
};

const storageKey = "second-chance-read-notifications";
const typeLabels: Record<string, string> = { ATTENDANCE: "المواظبة", ACADEMIC: "التتبع التربوي", SOCIAL: "المواكبة الاجتماعية", INTERNSHIP: "التداريب" };
const priorityLabels: Record<string, string> = { CRITICAL: "عاجل", HIGH: "مرتفع", MEDIUM: "متوسط", LOW: "منخفض" };

export function NotificationsCenter() {
  const [items, setItems] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try { setReadIds(JSON.parse(localStorage.getItem(storageKey) || "[]")); } catch { setReadIds([]); }
    fetch("/api/notifications", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { notifications: [] })
      .then((result) => setItems(result.notifications || []))
      .finally(() => setLoading(false));
  }, []);

  function persist(ids: string[]) {
    setReadIds(ids);
    localStorage.setItem(storageKey, JSON.stringify(ids));
  }

  const filtered = useMemo(() => items.filter((item) => {
    const matchesQuery = `${item.title} ${item.description} ${item.beneficiaryName || ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesType = type === "ALL" || item.type === type;
    const matchesRead = !unreadOnly || !readIds.includes(item.id);
    return matchesQuery && matchesType && matchesRead;
  }), [items, query, type, unreadOnly, readIds]);

  const unreadCount = items.filter((item) => !readIds.includes(item.id)).length;
  const criticalCount = items.filter((item) => item.priority === "CRITICAL").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">إجمالي التنبيهات</p><p className="mt-2 text-3xl font-bold">{items.length}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">غير المقروءة</p><p className="mt-2 text-3xl font-bold text-blue-700">{unreadCount}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">الحالات العاجلة</p><p className="mt-2 text-3xl font-bold text-red-700">{criticalCount}</p></article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto_auto]">
          <label className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في التنبيهات..." className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-sm" /></label>
          <label className="relative"><Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-sm"><option value="ALL">كل الأنواع</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button onClick={() => setUnreadOnly((value) => !value)} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${unreadOnly ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}>غير المقروءة فقط</button>
          <button onClick={() => persist(items.map((item) => item.id))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"><CheckCheck size={17} /> تعليم الكل كمقروء</button>
        </div>
      </section>

      <section className="space-y-3">
        {loading ? <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">جارٍ تحليل البيانات...</p> : filtered.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">لا توجد تنبيهات مطابقة.</p> : filtered.map((item) => {
          const read = readIds.includes(item.id);
          return (
            <article key={item.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${read ? "border-slate-200 opacity-70" : item.priority === "CRITICAL" ? "border-red-200" : item.priority === "HIGH" ? "border-orange-200" : "border-amber-100"}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className={`rounded-xl p-3 ${item.priority === "CRITICAL" ? "bg-red-50 text-red-700" : item.priority === "HIGH" ? "bg-orange-50 text-orange-700" : "bg-amber-50 text-amber-700"}`}>{item.priority === "CRITICAL" ? <AlertTriangle size={21} /> : <BellRing size={21} />}</div>
                  <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{item.title}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{priorityLabels[item.priority]}</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">{typeLabels[item.type]}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>{item.beneficiaryName && <p className="mt-2 text-xs font-semibold text-slate-500">المستفيد: {item.beneficiaryName}</p>}{item.dueDate && <p className="mt-1 text-xs text-slate-400">الموعد: {new Date(item.dueDate).toLocaleDateString("ar-MA")}</p>}</div>
                </div>
                <div className="flex shrink-0 gap-2"><button onClick={() => persist(read ? readIds.filter((id) => id !== item.id) : [...readIds, item.id])} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{read ? "تعليم كغير مقروء" : "تعليم كمقروء"}</button><Link href={item.href} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white">فتح الملف</Link></div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
