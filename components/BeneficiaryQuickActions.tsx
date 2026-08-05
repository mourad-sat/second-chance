"use client";

import Link from "next/link";
import { Archive, BrainCircuit, FolderOpen, LayoutDashboard, Printer, Trash2, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RecordAction = "archive" | "trash";

export function BeneficiaryQuickActions({ beneficiaryId, fullName, registrationNumber, status }: { beneficiaryId: string; fullName: string; registrationNumber: string; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<RecordAction | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function executeAction() {
    if (!confirmAction) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/record-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: confirmAction, reason })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر تنفيذ العملية.");
      setConfirmAction(null);
      setOpen(false);
      router.replace(confirmAction === "archive" ? "/archive" : "/trash");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-2xl shadow-blue-900/30 hover:bg-blue-800 print:hidden"><UserRound size={18} /> إجراءات الملف</button>

      {open && <div className="fixed inset-0 z-50 bg-slate-950/55 p-3 backdrop-blur-sm print:hidden" onClick={() => setOpen(false)}><aside dir="rtl" className="mr-auto flex h-full w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="bg-slate-950 p-5 text-white"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-blue-300">الإجراءات السريعة</p><h2 className="mt-1 text-xl font-black">{fullName}</h2><p className="mt-2 font-mono text-xs text-slate-300">{registrationNumber}</p></div><button onClick={() => setOpen(false)} className="rounded-xl bg-white/10 p-2"><X size={18} /></button></div><span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{status}</span></header>
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4">
          <Link href={`/beneficiaries/${beneficiaryId}/overview`} className="col-span-2 flex min-h-24 items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-blue-700 to-cyan-700 p-4 text-sm font-black text-white"><LayoutDashboard size={24} /> مركز قيادة المستفيد</Link>
          <Link href={`/beneficiaries/${beneficiaryId}/smart-orientation`} className="col-span-2 flex min-h-24 items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-violet-700 to-indigo-800 p-4 text-sm font-black text-white"><BrainCircuit size={24} /> التوجيه الذكي</Link>
          <Link href={`/beneficiaries/${beneficiaryId}/documents`} className="col-span-2 flex min-h-20 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-black text-blue-800"><FolderOpen size={20} /> إدارة الوثائق</Link>
        </div>
        {message && <p className="mx-4 mb-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p>}
        <footer className="space-y-2 border-t border-slate-200 p-4"><button onClick={() => window.print()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white"><Printer size={17} /> طباعة الملف</button><div className="grid grid-cols-2 gap-2"><button onClick={() => { setReason(""); setConfirmAction("archive"); }} className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-black text-amber-800"><Archive size={17} /> أرشفة</button><button onClick={() => { setReason(""); setConfirmAction("trash"); }} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-black text-red-700"><Trash2 size={17} /> إلى السلة</button></div></footer>
      </aside></div>}

      {confirmAction && <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm print:hidden" onClick={() => !saving && setConfirmAction(null)}><section dir="rtl" className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className={`p-6 text-white ${confirmAction === "trash" ? "bg-red-700" : "bg-amber-600"}`}><h2 className="text-xl font-black">{confirmAction === "trash" ? "نقل الملف إلى سلة المحذوفات" : "أرشفة ملف المستفيد"}</h2><p className="mt-2 text-sm text-white/85">{fullName} · {registrationNumber}</p></div><div className="space-y-4 p-6"><p className="text-sm leading-7 text-slate-600">{confirmAction === "trash" ? "سيختفي الملف من القوائم النشطة، لكنه سيبقى قابلًا للاستعادة من سلة المحذوفات. الحذف النهائي متاح من السلة فقط." : "سيُنقل الملف إلى الأرشيف مع الاحتفاظ بجميع بياناته وإمكانية استعادته."}</p><label className="block text-sm font-black text-slate-700">سبب العملية (اختياري)<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm" /></label>{message && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button disabled={saving} onClick={() => setConfirmAction(null)} className="btn-secondary">إلغاء</button><button disabled={saving} onClick={executeAction} className={`rounded-xl px-5 py-3 text-sm font-black text-white ${confirmAction === "trash" ? "bg-red-700" : "bg-amber-600"}`}>{saving ? "جارٍ التنفيذ..." : "تأكيد العملية"}</button></div></div></section></div>}
    </>
  );
}
