"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, GitBranch, History, ShieldCheck, UserRoundCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Transition = {
  value: string;
  label: string;
  description: string;
  blockers: string[];
  warnings: string[];
  ready: boolean;
};

type HistoryItem = {
  id: string;
  title: string;
  description: string | null;
  actorName: string | null;
  eventDate: string;
  metadata: Record<string, unknown> | null;
};

const labels: Record<string, string> = {
  PRE_REGISTERED: "التسجيل الأولي",
  UNDER_REVIEW: "دراسة الملف والتشخيص",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "القبول",
  REJECTED: "عدم القبول",
  ENROLLED: "التمدرس والتكوين",
  WITHDRAWN: "الانسحاب",
  COMPLETED: "استكمال البرنامج"
};

export function BeneficiaryWorkflowV3({ beneficiary, transitions, history }: {
  beneficiary: { id: string; fullName: string; registrationNumber: string; status: string; progress: number };
  transitions: Transition[];
  history: HistoryItem[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Transition | null>(null);
  const [responsibleName, setResponsibleName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const delayed = useMemo(() => history.filter((item) => {
    const value = item.metadata?.deadline;
    return typeof value === "string" && new Date(value).getTime() < Date.now();
  }).length, [history]);

  async function execute() {
    if (!selected || !selected.ready) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beneficiaryId: beneficiary.id, nextStatus: selected.value, responsibleName, deadline, note })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر تنفيذ الانتقال.");
      setMessage(result.message);
      setSelected(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-white/15"><GitBranch size={14} /> Workflow Engine 3.0</div>
            <h1 className="mt-4 text-3xl font-black">سير ملف {beneficiary.fullName}</h1>
            <p className="mt-2 font-mono text-xs text-blue-200">{beneficiary.registrationNumber}</p>
          </div>
          <div className="min-w-72 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between text-sm"><span>المرحلة الحالية</span><strong>{labels[beneficiary.status] || beneficiary.status}</strong></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-cyan-400" style={{ width: `${beneficiary.progress}%` }} /></div>
            <p className="mt-2 text-xs text-slate-300">نسبة تقدم الرحلة: {beneficiary.progress}%</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="app-card p-5"><ShieldCheck className="text-emerald-600" /><p className="mt-4 text-sm font-bold text-slate-500">انتقالات جاهزة</p><p className="mt-1 text-3xl font-black">{transitions.filter((item) => item.ready).length}</p></article>
        <article className="app-card p-5"><AlertTriangle className="text-amber-600" /><p className="mt-4 text-sm font-bold text-slate-500">انتقالات متوقفة</p><p className="mt-1 text-3xl font-black">{transitions.filter((item) => !item.ready).length}</p></article>
        <article className="app-card p-5"><CalendarClock className="text-red-600" /><p className="mt-4 text-sm font-bold text-slate-500">آجال سابقة</p><p className="mt-1 text-3xl font-black">{delayed}</p></article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="app-card p-5 md:p-6">
          <h2 className="text-xl font-black text-slate-950">الانتقالات المتاحة</h2>
          <p className="mt-1 text-sm text-slate-500">يعتمد السماح بالانتقال على اكتمال المتطلبات الفعلية للملف.</p>
          <div className="mt-5 space-y-4">
            {transitions.length ? transitions.map((transition) => (
              <button key={transition.value} type="button" onClick={() => setSelected(transition)} className={`w-full rounded-2xl border p-4 text-right transition ${transition.ready ? "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50" : "border-red-200 bg-red-50/50"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="font-black text-slate-900">{transition.label}</p><p className="mt-1 text-sm text-slate-600">{transition.description}</p></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${transition.ready ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{transition.ready ? "جاهز" : "متوقف"}</span>
                </div>
                {transition.blockers.length > 0 && <ul className="mt-3 space-y-1 text-xs font-bold text-red-700">{transition.blockers.map((item) => <li key={item}>• {item}</li>)}</ul>}
                {transition.warnings.length > 0 && <ul className="mt-3 space-y-1 text-xs text-amber-700">{transition.warnings.map((item) => <li key={item}>• {item}</li>)}</ul>}
              </button>
            )) : <div className="empty-state"><CheckCircle2 className="mx-auto text-emerald-500" size={38} /><p className="mt-3 font-black">لا توجد انتقالات أخرى</p><p className="mt-1 text-sm text-slate-500">وصل الملف إلى مرحلة نهائية.</p></div>}
          </div>
        </article>

        <article className="app-card p-5 md:p-6">
          <div className="flex items-center gap-3"><History className="text-blue-700" /><div><h2 className="text-xl font-black">سجل الانتقالات</h2><p className="text-sm text-slate-500">جميع التغييرات الموثقة في رحلة المستفيد.</p></div></div>
          <div className="mt-5 space-y-3">
            {history.length ? history.map((item) => {
              const responsible = typeof item.metadata?.responsibleName === "string" ? item.metadata.responsibleName : item.actorName;
              const due = typeof item.metadata?.deadline === "string" ? item.metadata.deadline : null;
              const overdue = due ? new Date(due).getTime() < Date.now() : false;
              return <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.eventDate).toLocaleString("ar-MA")}</p></div>{overdue && <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-black text-red-700">متأخر</span>}</div>{item.description && <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>}<div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">{responsible && <span className="inline-flex items-center gap-1"><UserRoundCog size={13} /> {responsible}</span>}{due && <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {new Date(due).toLocaleDateString("ar-MA")}</span>}</div></div>;
            }) : <p className="empty-state">لا توجد انتقالات مسجلة بعد.</p>}
          </div>
        </article>
      </section>

      <div className="flex justify-end"><Link href={`/beneficiaries/${beneficiary.id}`} className="btn-secondary">العودة إلى ملف المستفيد</Link></div>

      {selected && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => !saving && setSelected(null)}>
          <section className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-xl font-black">{selected.label}</h2>
            <p className="mt-2 text-sm text-slate-500">حدد المسؤول والموعد النهائي قبل تنفيذ الانتقال.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="field-label">المسؤول<input value={responsibleName} onChange={(event) => setResponsibleName(event.target.value)} className="field-control mt-2" placeholder="اسم المسؤول" /></label><label className="field-label">الموعد النهائي<input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="field-control mt-2" /></label></div>
            <label className="field-label mt-4 block">ملاحظة<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="field-control mt-2 resize-none" placeholder="سبب الانتقال أو التعليمات..." /></label>
            {message && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setSelected(null)} className="btn-secondary">إلغاء</button><button type="button" onClick={execute} disabled={saving || !selected.ready} className="btn-primary disabled:opacity-50">{saving ? "جارٍ التنفيذ..." : "تنفيذ الانتقال"}</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
