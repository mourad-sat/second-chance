"use client";

import Link from "next/link";
import { ArchiveRestore, Search, Trash2, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type LifecycleItem = {
  id: string;
  firstName: string;
  lastName: string;
  registrationNumber: string | null;
  masarNumber: string | null;
  profilePhotoUrl: string | null;
  status: string;
  eventAt: string;
  reason: string | null;
  actorName: string | null;
};

export function BeneficiaryLifecycleManager({ mode, items }: { mode: "archive" | "trash"; items: LifecycleItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<LifecycleItem | null>(null);
  const [action, setAction] = useState<"restore" | "permanent-delete" | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) => [item.firstName, item.lastName, item.registrationNumber || "", item.masarNumber || "", item.reason || ""].join(" ").toLowerCase().includes(value));
  }, [items, query]);

  function confirm(item: LifecycleItem, nextAction: "restore" | "permanent-delete") {
    setTarget(item);
    setAction(nextAction);
    setMessage("");
  }

  async function execute() {
    if (!target || !action) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/beneficiaries/${target.id}/record-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "تعذر تنفيذ العملية.");
      setTarget(null);
      setAction(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تنفيذ العملية.");
    } finally {
      setSaving(false);
    }
  }

  const archiveMode = mode === "archive";

  return (
    <div className="space-y-5">
      <header className={`overflow-hidden rounded-[2rem] p-6 text-white shadow-xl md:p-8 ${archiveMode ? "bg-gradient-to-l from-amber-700 via-orange-600 to-amber-500" : "bg-gradient-to-l from-red-900 via-red-700 to-rose-600"}`}>
        <p className="text-xs font-black text-white/75">إدارة دورة حياة الملفات</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">{archiveMode ? "أرشيف المستفيدين" : "سلة المحذوفات"}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80">{archiveMode ? "ملفات محفوظة خارج العمل اليومي مع إمكانية استعادتها في أي وقت." : "ملفات محذوفة منطقيًا. يمكن استعادتها أو حذفها نهائيًا بعد التأكد."}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-3 text-center ring-1 ring-white/15"><p className="text-xs text-white/70">إجمالي الملفات</p><p className="mt-1 text-3xl font-black">{items.length}</p></div>
        </div>
      </header>

      <section className="app-card overflow-hidden">
        <div className="border-b border-slate-100 p-4 md:p-5">
          <div className="relative max-w-2xl"><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم، رقم التسجيل، رقم مسار أو السبب..." className="field-control w-full pr-11" /></div>
        </div>

        {filtered.length ? (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 md:p-5">
            {filtered.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  {item.profilePhotoUrl ? <img src={item.profilePhotoUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-600"><UserRound size={23} /></span>}
                  <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-black text-slate-950">{item.firstName} {item.lastName}</h2><p className="mt-1 font-mono text-xs font-bold text-slate-500">{item.registrationNumber || item.id}</p><p className="mt-1 text-xs text-slate-500">مسار: {item.masarNumber || "—"}</p></div>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm"><p className="text-xs font-black text-slate-500">السبب</p><p className="mt-1 leading-6 text-slate-700">{item.reason || "لم يُسجل سبب."}</p><p className="mt-3 text-xs text-slate-500">{new Date(item.eventAt).toLocaleString("ar-MA")} {item.actorName ? `· بواسطة ${item.actorName}` : ""}</p></div>
                <div className="mt-4 flex flex-wrap gap-2"><Link href={`/beneficiaries/${item.id}`} className="btn-secondary flex-1 text-center text-sm">عرض الملف</Link><button type="button" onClick={() => confirm(item, "restore")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-black text-white hover:bg-emerald-800"><ArchiveRestore size={16} /> استعادة</button>{!archiveMode && <button type="button" onClick={() => confirm(item, "permanent-delete")} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-black text-red-700 hover:bg-red-100"><Trash2 size={16} /> حذف نهائي</button>}</div>
              </article>
            ))}
          </div>
        ) : <div className="empty-state m-5"><UserRound className="mx-auto text-slate-300" size={38} /><p className="mt-3 font-black text-slate-700">لا توجد ملفات هنا</p><p className="mt-1 text-sm text-slate-500">{query ? "لا توجد نتائج مطابقة للبحث." : archiveMode ? "لم تتم أرشفة أي مستفيد." : "سلة المحذوفات فارغة."}</p></div>}
      </section>

      {target && action && <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm" onClick={() => !saving && setTarget(null)}><section className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><header className={`p-6 text-white ${action === "permanent-delete" ? "bg-red-800" : "bg-emerald-700"}`}><div className="flex items-start justify-between"><div><p className="text-xs font-black text-white/70">تأكيد العملية</p><h2 className="mt-1 text-xl font-black">{action === "permanent-delete" ? "حذف نهائي لا يمكن التراجع عنه" : "استعادة ملف المستفيد"}</h2><p className="mt-2 text-sm text-white/80">{target.firstName} {target.lastName}</p></div><button onClick={() => setTarget(null)} className="rounded-xl bg-white/10 p-2"><X size={18} /></button></div></header><div className="space-y-4 p-6"><p className="text-sm leading-7 text-slate-600">{action === "permanent-delete" ? "سيُحذف الملف وجميع البيانات المرتبطة به نهائيًا. استخدم هذا الإجراء فقط بعد التأكد الكامل." : "سيعود الملف إلى قائمة المستفيدين النشطين وتُلغى حالة الأرشفة أو الحذف."}</p>{message && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button disabled={saving} onClick={() => setTarget(null)} className="btn-secondary">إلغاء</button><button disabled={saving} onClick={execute} className={`rounded-xl px-5 py-3 text-sm font-black text-white disabled:opacity-60 ${action === "permanent-delete" ? "bg-red-800" : "bg-emerald-700"}`}>{saving ? "جارٍ التنفيذ..." : "تأكيد العملية"}</button></div></div></section></div>}
    </div>
  );
}
