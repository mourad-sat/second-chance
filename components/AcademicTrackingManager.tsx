"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardPlus,
  Save,
  TriangleAlert,
  UsersRound
} from "lucide-react";

type Group = { id: string; name: string; academicYear: string };
type Beneficiary = { id: string; firstName: string; lastName: string };
type Result = {
  beneficiaryId: string;
  score: number | null;
  competencyLevel: string | null;
  notes: string | null;
};
type Assessment = {
  id: string;
  title: string;
  subject: string;
  type: string;
  assessmentDate: string | Date;
  maxScore: number;
  group: { name: string };
  beneficiaries: Beneficiary[];
  results: Result[];
};

type Analysis = {
  completed: number;
  average: number;
  highest: number;
  lowest: number;
  successRate: number;
  supportCount: number;
};

const assessmentTypeLabels: Record<string, string> = {
  DIAGNOSTIC: "تشخيصي",
  FORMATIVE: "تكويني",
  SUMMATIVE: "إجمالي",
  PROJECT: "مشروع",
  PRACTICAL: "تطبيقي"
};

function analyseResults(results: Result[], maxScore: number): Analysis {
  const scores = results
    .map((result) => result.score)
    .filter((score): score is number => score !== null && Number.isFinite(score));

  if (!scores.length) {
    return { completed: 0, average: 0, highest: 0, lowest: 0, successRate: 0, supportCount: 0 };
  }

  const percentages = scores.map((score) => (score / maxScore) * 100);
  const average = Math.round(percentages.reduce((sum, score) => sum + score, 0) / percentages.length);
  const successCount = percentages.filter((score) => score >= 50).length;
  const supportCount = percentages.filter((score) => score < 50).length;

  return {
    completed: scores.length,
    average,
    highest: Math.round(Math.max(...percentages)),
    lowest: Math.round(Math.min(...percentages)),
    successRate: Math.round((successCount / scores.length) * 100),
    supportCount
  };
}

function StatusMessage({ message, type }: { message: string; type: "success" | "error" | "" }) {
  if (!message) return null;
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
      {type === "success" ? <CheckCircle2 className="mt-0.5 shrink-0" size={19} /> : <TriangleAlert className="mt-0.5 shrink-0" size={19} />}
      <p>{message}</p>
    </div>
  );
}

function AssessmentCard({
  assessment,
  saving,
  onSave
}: {
  assessment: Assessment;
  saving: boolean;
  onSave: (event: FormEvent<HTMLFormElement>, assessmentId: string, beneficiaries: Beneficiary[]) => void;
}) {
  const analysis = analyseResults(assessment.results, assessment.maxScore);

  return (
    <form onSubmit={(event) => onSave(event, assessment.id, assessment.beneficiaries)} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-slate-950">{assessment.title}</h3>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {assessmentTypeLabels[assessment.type] || assessment.type}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {assessment.subject} · {assessment.group.name} · الدرجة القصوى {assessment.maxScore}
            </p>
            <p className="mt-1 text-xs text-slate-500">{new Date(assessment.assessmentDate).toLocaleDateString("ar-MA")}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {[
              ["المدخلون", `${analysis.completed}/${assessment.beneficiaries.length}`],
              ["المتوسط", `${analysis.average}%`],
              ["الأعلى", `${analysis.highest}%`],
              ["الأدنى", `${analysis.lowest}%`],
              ["النجاح", `${analysis.successRate}%`],
              ["يحتاجون دعمًا", analysis.supportCount]
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center">
                <p className="text-[11px] text-slate-500">{label}</p>
                <p className="mt-1 font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {assessment.beneficiaries.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">لا يوجد مستفيدون مسجلون في هذه المجموعة.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-white text-slate-600">
              <tr>
                <th className="px-4 py-4">المستفيد</th>
                <th className="px-4 py-4">النقطة</th>
                <th className="px-4 py-4">النسبة</th>
                <th className="px-4 py-4">مستوى الكفاية</th>
                <th className="px-4 py-4">ملاحظات المؤطر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessment.beneficiaries.map((beneficiary) => {
                const result = assessment.results.find((item) => item.beneficiaryId === beneficiary.id);
                const percentage = result?.score != null ? Math.round((result.score / assessment.maxScore) * 100) : null;
                return (
                  <tr key={beneficiary.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-4 font-semibold text-slate-900">{beneficiary.firstName} {beneficiary.lastName}</td>
                    <td className="px-4 py-4">
                      <input
                        name={`score-${beneficiary.id}`}
                        type="number"
                        min="0"
                        max={assessment.maxScore}
                        step="0.25"
                        defaultValue={result?.score ?? ""}
                        className="w-24 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${percentage == null ? "bg-slate-100 text-slate-600" : percentage >= 50 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {percentage == null ? "غير مدخل" : `${percentage}%`}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <select name={`level-${beneficiary.id}`} defaultValue={result?.competencyLevel || ""} className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500">
                        <option value="">غير محدد</option>
                        <option value="متقن">متقن</option>
                        <option value="في طور الإتقان">في طور الإتقان</option>
                        <option value="متعثر">متعثر</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        name={`notes-${beneficiary.id}`}
                        defaultValue={result?.notes || ""}
                        placeholder="ملاحظة مختصرة..."
                        className="min-w-64 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 p-4">
        <button disabled={saving || assessment.beneficiaries.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
          <Save size={17} /> {saving ? "جارٍ الحفظ..." : "حفظ نتائج المجموعة"}
        </button>
      </div>
    </form>
  );
}

export function AcademicTrackingManager({ groups, assessments }: { groups: Group[]; assessments: Assessment[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const filteredAssessments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return assessments;
    return assessments.filter((assessment) =>
      `${assessment.title} ${assessment.subject} ${assessment.group.name}`.toLowerCase().includes(normalized)
    );
  }, [assessments, query]);

  async function createAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر إنشاء التقويم.");

      event.currentTarget.reset();
      setMessage("تم إنشاء التقويم بنجاح وأصبح جاهزًا لإدخال النتائج.");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إنشاء التقويم.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function saveResults(event: FormEvent<HTMLFormElement>, assessmentId: string, beneficiaries: Beneficiary[]) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const data = new FormData(event.currentTarget);
      const results = beneficiaries.map((beneficiary) => ({
        beneficiaryId: beneficiary.id,
        score: data.get(`score-${beneficiary.id}`),
        competencyLevel: data.get(`level-${beneficiary.id}`),
        notes: data.get(`notes-${beneficiary.id}`)
      }));

      const response = await fetch(`/api/assessments/${assessmentId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر حفظ النتائج.");

      setMessage("تم حفظ نتائج المجموعة وتحديث مؤشرات التحليل بنجاح.");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر حفظ النتائج.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={createAssessment} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-slate-100 bg-slate-50/70 p-6">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><ClipboardPlus size={22} /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-950">إنشاء تقويم جديد</h3>
            <p className="mt-1 text-sm text-slate-500">حدد المجموعة والمادة ونوع التقويم قبل إدخال النتائج جماعيًا.</p>
          </div>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
          <label><span className="mb-2 block text-sm font-semibold">عنوان التقويم</span><input required name="title" placeholder="مثال: التقويم التكويني الأول" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" /></label>
          <label><span className="mb-2 block text-sm font-semibold">المادة أو المجزوءة</span><input required name="subject" placeholder="مثال: اللغة الفرنسية" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" /></label>
          <label><span className="mb-2 block text-sm font-semibold">المجموعة</span><select required name="groupId" className="w-full rounded-xl border border-slate-300 px-4 py-3"><option value="">اختر المجموعة</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name} — {group.academicYear}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-semibold">نوع التقويم</span><select name="type" defaultValue="FORMATIVE" className="w-full rounded-xl border border-slate-300 px-4 py-3"><option value="DIAGNOSTIC">تشخيصي</option><option value="FORMATIVE">تكويني</option><option value="SUMMATIVE">إجمالي</option><option value="PROJECT">مشروع</option><option value="PRACTICAL">تطبيقي</option></select></label>
          <label><span className="mb-2 block text-sm font-semibold">تاريخ الإنجاز</span><input required type="date" name="assessmentDate" className="w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
          <label><span className="mb-2 block text-sm font-semibold">الدرجة القصوى</span><input required type="number" min="1" step="0.5" name="maxScore" defaultValue="20" className="w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
        </div>
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 p-4">
          <button disabled={saving || groups.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            <BookOpenCheck size={17} /> {saving ? "جارٍ الإنشاء..." : "إنشاء التقويم"}
          </button>
        </div>
      </form>

      <StatusMessage message={message} type={messageType} />

      <section>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600"><BarChart3 size={21} /></div>
            <div><h3 className="text-xl font-bold">التقويمات والنتائج</h3><p className="text-sm text-slate-500">{assessments.length} تقويمًا مسجلًا</p></div>
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالعنوان أو المادة أو المجموعة..." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 md:w-96" />
        </div>

        {filteredAssessments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <UsersRound className="mx-auto text-slate-400" size={30} />
            <p className="mt-3 font-semibold text-slate-700">لا توجد تقويمات مطابقة.</p>
            <p className="mt-1 text-sm text-slate-500">أنشئ تقويمًا جديدًا أو غيّر عبارة البحث.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAssessments.map((assessment) => (
              <AssessmentCard key={assessment.id} assessment={assessment} saving={saving} onSave={saveResults} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
