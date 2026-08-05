"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function IntelligenceDecisionPanel({ beneficiaryId, recommendation }: { beneficiaryId: string; recommendation: string }) {
  const router = useRouter();
  const [decision, setDecision] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    if (!decision) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/intelligence-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note, recommendation })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "تعذر تسجيل القرار.");
      setMessage(payload.message);
      setDecision(null);
      setNote("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
      <p className="text-xs font-black text-violet-700">المراجعة البشرية</p>
      <h3 className="mt-1 text-xl font-black text-violet-950">اعتماد التوصية أو رفضها</h3>
      <p className="mt-2 text-sm leading-7 text-violet-900">التقرير أداة دعم قرار فقط. يجب على المسؤول مراجعة السياق والتواصل مع المستفيد قبل اعتماد أي إجراء.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => setDecision("ACCEPTED")} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black ${decision === "ACCEPTED" ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-200 bg-white text-emerald-800"}`}><CheckCircle2 size={17} /> اعتماد كتوصية عمل</button>
        <button type="button" onClick={() => setDecision("REJECTED")} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black ${decision === "REJECTED" ? "border-red-600 bg-red-600 text-white" : "border-red-200 bg-white text-red-700"}`}><XCircle size={17} /> رفض التوصية</button>
      </div>
      {decision && <div className="mt-4"><label className="text-sm font-black text-slate-700">تعليل القرار<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500" placeholder="اكتب أسباب الاعتماد أو الرفض والسياق المهني..." /></label><button type="button" disabled={saving || note.trim().length < 5} onClick={submit} className="mt-3 rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? "جارٍ التسجيل..." : "تسجيل القرار البشري"}</button></div>}
      {message && <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700">{message}</p>}
    </section>
  );
}
