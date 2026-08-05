"use client";

import Link from "next/link";
import {
  Archive,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardCheck,
  FolderOpen,
  GraduationCap,
  HeartHandshake,
  History,
  LayoutDashboard,
  Printer,
  Trash2,
  UserRound,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  PRE_REGISTERED: "مسجل أوليًا",
  UNDER_REVIEW: "قيد دراسة الملف",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "مقبول",
  REJECTED: "غير مقبول",
  ENROLLED: "متمدرس",
  WITHDRAWN: "منسحب",
  COMPLETED: "أنهى البرنامج"
};

const actions = [
  ["#personal-data", "البيانات", UserRound],
  ["#documents", "الوثائق", FolderOpen],
  ["#diagnosis", "التشخيص", ClipboardCheck],
  ["#attendance", "الحضور", CalendarCheck],
  ["#academic", "التتبع", BookOpenCheck],
  ["#social", "المواكبة", HeartHandshake],
  ["#training", "التكوين", GraduationCap],
  ["#integration", "الإدماج", BriefcaseBusiness],
  ["#activity", "السجل", History]
] as const;

type RecordAction = "archive" | "delete";

export function BeneficiaryQuickActions({
  beneficiaryId,
  fullName,
  registrationNumber,
  status
}: {
  beneficiaryId: string;
  fullName: string;
  registrationNumber: string;
  status: string;
}) {
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
      setMessage(result.message);
      setConfirmAction(null);
      setOpen(false);
      router.replace("/beneficiaries");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  function openConfirmation(action: RecordAction) {
    setReason("");
    setMessage("");
    setConfirmAction(action);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-2xl shadow-blue-900/30 transition hover:bg-blue-800 print:hidden"
        aria-label="فتح الإجراءات السريعة"
      >
        <UserRound size={18} /> إجراءات الملف
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 p-3 backdrop-blur-sm print:hidden" onClick={() => setOpen(false)}>
          <aside
            dir="rtl"
            className="mr-auto flex h-full w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="bg-slate-950 p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-blue-300">الإجراءات السريعة</p>
                  <h2 className="mt-1 text-xl font-black">{fullName}</h2>
                  <p className="mt-2 font-mono text-xs text-slate-300">{registrationNumber}</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="rounded-xl bg-white/10 p-2 hover:bg-white/20" aria-label="إغلاق"><X size={18} /></button>
              </div>
              <span className="mt-4 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold">
                {statusLabels[status] || status}
              </span>
            </header>

            <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4">
              <Link href={`/beneficiaries/${beneficiaryId}/overview`} onClick={() => setOpen(false)} className="col-span-2 flex min-h-24 items-center justify-center gap-3 rounded-2xl border border-blue-200 bg-gradient-to-l from-blue-700 to-cyan-700 p-4 text-center text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:from-blue-800 hover:to-cyan-800">
                <LayoutDashboard size={25} /> مركز قيادة المستفيد 2.0
              </Link>
              <Link href={`/beneficiaries/${beneficiaryId}/smart-orientation`} onClick={() => setOpen(false)} className="col-span-2 flex min-h-24 items-center justify-center gap-3 rounded-2xl border border-violet-200 bg-gradient-to-l from-violet-700 to-indigo-800 p-4 text-center text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:from-violet-800 hover:to-indigo-900">
                <BrainCircuit size={25} /> التوجيه الذكي للمسارات
              </Link>
              {actions.map(([href, label, Icon]) => (
                <a key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800">
                  <Icon size={22} /> {label}
                </a>
              ))}
            </div>

            {message && <p className="mx-4 mb-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p>}

            <footer className="space-y-2 border-t border-slate-200 p-4">
              <button type="button" onClick={() => window.print()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white hover:bg-emerald-800">
                <Printer size={17} /> طباعة الملف
              </button>
              <Link href={`/beneficiaries/${beneficiaryId}/documents`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-800 hover:bg-blue-100">
                <FolderOpen size={17} /> إدارة جميع الوثائق
              </Link>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button type="button" onClick={() => openConfirmation("archive")} className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-black text-amber-800 hover:bg-amber-100">
                  <Archive size={17} /> أرشفة
                </button>
                <button type="button" onClick={() => openConfirmation("delete")} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-black text-red-700 hover:bg-red-100">
                  <Trash2 size={17} /> حذف
                </button>
              </div>
            </footer>
          </aside>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm print:hidden" onClick={() => !saving && setConfirmAction(null)}>
          <section dir="rtl" className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className={`p-6 text-white ${confirmAction === "delete" ? "bg-red-700" : "bg-amber-600"}`}>
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">{confirmAction === "delete" ? <Trash2 size={24} /> : <Archive size={24} />}</span>
                <div>
                  <h2 className="text-xl font-black">{confirmAction === "delete" ? "حذف المستفيد نهائيًا" : "أرشفة ملف المستفيد"}</h2>
                  <p className="mt-2 text-sm text-white/85">{fullName} · {registrationNumber}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-sm leading-7 text-slate-600">
                {confirmAction === "delete"
                  ? "سيؤدي هذا الإجراء إلى حذف الملف وجميع الوثائق والحضور والتقييمات والمتابعات المرتبطة به. لا يمكن التراجع عنه."
                  : "سيختفي المستفيد من القائمة النشطة، مع الاحتفاظ بجميع بياناته وسجل عملياته داخل النظام."}
              </p>
              <label className="block text-sm font-black text-slate-700">سبب العملية (اختياري)
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="اكتب سبب الأرشفة أو الحذف..." className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              </label>
              {confirmAction === "delete" && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">تنبيه: الحذف نهائي ولا يمكن استعادة الملف بعد تنفيذه.</p>}
              {message && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p>}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" disabled={saving} onClick={() => setConfirmAction(null)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50">إلغاء</button>
                <button type="button" disabled={saving} onClick={executeAction} className={`rounded-xl px-5 py-3 text-sm font-black text-white disabled:opacity-60 ${confirmAction === "delete" ? "bg-red-700 hover:bg-red-800" : "bg-amber-600 hover:bg-amber-700"}`}>
                  {saving ? "جارٍ التنفيذ..." : confirmAction === "delete" ? "تأكيد الحذف النهائي" : "تأكيد الأرشفة"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
