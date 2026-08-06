"use client";

import { ChevronLeft, LayoutGrid, Search, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ResultItem = { href: string; label: string; description: string; type: "beneficiary" | "group" };

const pages = [
  ["/", "لوحة القيادة", "المؤشرات والإحصائيات"],
  ["/beneficiaries", "المستفيدون", "البحث وإدارة الملفات"],
  ["/beneficiaries/new", "تسجيل مستفيد", "إنشاء ملف داخلي جديد"],
  ["/admissions", "التشخيص والقبول", "التسجيلات القبلية وقرارات اللجنة"],
  ["/workflow", "سير الملفات", "مراحل رحلة المستفيد"],
  ["/attendance", "الحضور والغياب", "المجموعات والمواظبة اليومية"],
  ["/academic-tracking", "التتبع التربوي", "النتائج وخطط الدعم"],
  ["/social-support", "المواكبة الاجتماعية", "المتابعات والتدخلات"],
  ["/vocational-training", "التكوين المهني", "الكفايات والورشات"],
  ["/integration", "الإدماج المهني", "التداريب والمشاريع"],
  ["/reports", "التقارير", "الإحصائيات والتصدير"],
  ["/notifications", "الإشعارات", "التنبيهات والمهام"],
  ["/settings", "الإعدادات", "الحسابات والحوكمة"]
] as const;

export function GlobalSearchOverlay() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", keyboard, true);
    return () => window.removeEventListener("keydown", keyboard, true);
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) { setRemote([]); setLoading(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        setRemote([
          ...(data.beneficiaries || []).map((item: Omit<ResultItem, "type">) => ({ ...item, type: "beneficiary" as const })),
          ...(data.groups || []).map((item: Omit<ResultItem, "type">) => ({ ...item, type: "group" as const }))
        ]);
      } finally { setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const pageResults = useMemo(() => {
    const value = query.trim().toLowerCase();
    const filtered = value ? pages.filter((item) => `${item[1]} ${item[2]}`.toLowerCase().includes(value)) : pages.slice(0, 7);
    return filtered.map(([href, label, description]) => ({ href, label, description }));
  }, [query]);

  function navigate(href: string) {
    setOpen(false); setQuery(""); setRemote([]); router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center bg-slate-950/60 px-4 pt-[8vh] backdrop-blur-md" onClick={() => setOpen(false)}>
      <section dir="rtl" role="dialog" aria-modal="true" aria-label="البحث الشامل" className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Search className="shrink-0 text-emerald-700" size={22} />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن مستفيد، رقم مسار، مجموعة، صفحة أو إجراء..." className="h-11 flex-1 border-0 bg-transparent text-base font-bold shadow-none outline-none focus:shadow-none" />
          {loading && <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />}
          <button type="button" onClick={() => setOpen(false)} className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200" aria-label="إغلاق"><X size={17} /></button>
        </div>
        <div className="max-h-[68vh] overflow-y-auto p-3">
          {remote.length > 0 && <><p className="px-3 pb-2 pt-1 text-[11px] font-black text-slate-400">نتائج البيانات</p>{remote.map((item, index) => {
            const Icon = item.type === "beneficiary" ? Users : LayoutGrid;
            return <button key={`${item.type}-${item.href}-${index}`} type="button" onClick={() => navigate(item.href)} className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right hover:bg-emerald-50"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 group-hover:bg-white"><Icon size={19} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{item.label}</strong><span className="mt-1 block truncate text-xs text-slate-500">{item.description}</span></span><ChevronLeft size={17} className="text-slate-300 group-hover:text-emerald-700" /></button>;
          })}</>}
          <p className="px-3 pb-2 pt-4 text-[11px] font-black text-slate-400">الصفحات والإجراءات</p>
          {pageResults.map((item) => <button key={item.href} type="button" onClick={() => navigate(item.href)} className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right hover:bg-emerald-50"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-emerald-700"><LayoutGrid size={19} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{item.label}</strong><span className="mt-1 block truncate text-xs text-slate-500">{item.description}</span></span><ChevronLeft size={17} className="text-slate-300 group-hover:text-emerald-700" /></button>)}
          {!loading && !remote.length && !pageResults.length && <div className="py-12 text-center text-slate-500"><Search className="mx-auto text-slate-300" size={36} /><p className="mt-3 font-bold">لا توجد نتائج مطابقة</p></div>}
        </div>
        <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold text-slate-500"><span>تظهر نتائج قاعدة البيانات بعد إدخال حرفين</span><span className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono">Ctrl K</span></footer>
      </section>
    </div>
  );
}
