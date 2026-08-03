"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Group = { id: string; name: string; academicYear: string };
type Beneficiary = { id: string; firstName: string; lastName: string };
type Assessment = {
  id: string;
  title: string;
  subject: string;
  type: string;
  assessmentDate: string | Date;
  maxScore: number;
  group: { name: string };
  beneficiaries: Beneficiary[];
  results: { beneficiaryId: string; score: number | null; competencyLevel: string | null; notes: string | null }[];
};

export function AcademicTrackingManager({ groups, assessments }: { groups: Group[]; assessments: Assessment[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function createAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(result.message || "تعذر إنشاء التقويم.");
    event.currentTarget.reset(); setMessage("تم إنشاء التقويم بنجاح."); router.refresh();
  }

  async function saveResults(event: FormEvent<HTMLFormElement>, assessmentId: string, beneficiaries: Beneficiary[]) {
    event.preventDefault(); setSaving(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const results = beneficiaries.map((b) => ({
      beneficiaryId: b.id,
      score: data.get(`score-${b.id}`),
      competencyLevel: data.get(`level-${b.id}`),
      notes: data.get(`notes-${b.id}`)
    }));
    const response = await fetch(`/api/assessments/${assessmentId}/results`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ results }) });
    const result = await response.json(); setSaving(false);
    if (!response.ok) return setMessage(result.message || "تعذر حفظ النتائج.");
    setMessage("تم حفظ النتائج بنجاح."); router.refresh();
  }

  return <div className="space-y-8">
    <form onSubmit={createAssessment} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-xl font-bold">إنشاء تقويم جديد</h3>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <input required name="title" placeholder="عنوان التقويم" className="rounded-xl border px-4 py-3" />
        <input required name="subject" placeholder="المادة أو المجزوءة" className="rounded-xl border px-4 py-3" />
        <select required name="groupId" className="rounded-xl border px-4 py-3"><option value="">اختر المجموعة</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name} — {g.academicYear}</option>)}</select>
        <select name="type" defaultValue="FORMATIVE" className="rounded-xl border px-4 py-3"><option value="DIAGNOSTIC">تشخيصي</option><option value="FORMATIVE">تكويني</option><option value="SUMMATIVE">إجمالي</option><option value="PROJECT">مشروع</option><option value="PRACTICAL">تطبيقي</option></select>
        <input required type="date" name="assessmentDate" className="rounded-xl border px-4 py-3" />
        <input required type="number" min="1" step="0.5" name="maxScore" defaultValue="20" className="rounded-xl border px-4 py-3" />
      </div>
      <button disabled={saving} className="mt-5 rounded-xl bg-slate-900 px-6 py-3 text-white">إنشاء التقويم</button>
    </form>

    {message && <p className="rounded-xl bg-slate-100 px-4 py-3">{message}</p>}

    {assessments.map(a => <form key={a.id} onSubmit={(e) => saveResults(e, a.id, a.beneficiaries)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-bold">{a.title}</h3><p className="text-sm text-slate-500">{a.subject} — {a.group.name} — /{a.maxScore}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{new Date(a.assessmentDate).toLocaleDateString("ar-MA")}</span></div>
      <div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-slate-50"><tr><th className="px-3 py-3">المستفيد</th><th className="px-3 py-3">النقطة</th><th className="px-3 py-3">مستوى الكفاية</th><th className="px-3 py-3">ملاحظات</th></tr></thead><tbody>
        {a.beneficiaries.map(b => { const r = a.results.find(x => x.beneficiaryId === b.id); return <tr key={b.id} className="border-t"><td className="px-3 py-3 font-medium">{b.firstName} {b.lastName}</td><td className="px-3 py-3"><input name={`score-${b.id}`} type="number" min="0" max={a.maxScore} step="0.25" defaultValue={r?.score ?? ""} className="w-24 rounded-lg border px-3 py-2" /></td><td className="px-3 py-3"><select name={`level-${b.id}`} defaultValue={r?.competencyLevel || ""} className="rounded-lg border px-3 py-2"><option value="">غير محدد</option><option value="متقن">متقن</option><option value="في طور الإتقان">في طور الإتقان</option><option value="متعثر">متعثر</option></select></td><td className="px-3 py-3"><input name={`notes-${b.id}`} defaultValue={r?.notes || ""} className="min-w-52 rounded-lg border px-3 py-2" /></td></tr> })}
      </tbody></table></div>
      <button disabled={saving} className="mt-5 rounded-xl bg-slate-900 px-6 py-3 text-white">حفظ النتائج</button>
    </form>)}
  </div>;
}
