"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  HeartPulse,
  Save,
  Sparkles,
  TriangleAlert,
  UsersRound
} from "lucide-react";

type Assessment = {
  interviewDate?: string | Date | null;
  interviewerName?: string | null;
  interviewSummary?: string | null;
  motivationLevel?: number | null;
  attendanceReadiness?: number | null;
  arabicScore?: number | null;
  frenchScore?: number | null;
  mathematicsScore?: number | null;
  cognitiveScore?: number | null;
  psychologicalSummary?: string | null;
  creativeDigitalInterest?: number | null;
  socialServicesInterest?: number | null;
  technicalInterest?: number | null;
  greenEconomyInterest?: number | null;
  culturalAnimationInterest?: number | null;
  vocationalInterestNotes?: string | null;
  proposedTrack?: string | null;
  proposedSpecialty?: string | null;
  orientationReason?: string | null;
  committeeNotes?: string | null;
  decision?: string | null;
  decisionDate?: string | Date | null;
};

type Metrics = {
  readiness: number;
  completion: number;
  missing: string[];
  suggestedTrack: string;
};

const dateValue = (value?: string | Date | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

const numberValue = (value: FormDataEntryValue | null, max = 100) => {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(max, Math.max(0, parsed));
};

function calculateMetrics(data: FormData): Metrics {
  const motivation = numberValue(data.get("motivationLevel"), 5);
  const attendance = numberValue(data.get("attendanceReadiness"), 5);
  const arabic = numberValue(data.get("arabicScore"));
  const french = numberValue(data.get("frenchScore"));
  const mathematics = numberValue(data.get("mathematicsScore"));
  const cognitive = numberValue(data.get("cognitiveScore"));

  const normalized = [
    motivation === null ? null : motivation * 20,
    attendance === null ? null : attendance * 20,
    arabic,
    french,
    mathematics,
    cognitive
  ].filter((value): value is number => value !== null);

  const readiness = normalized.length
    ? Math.round(normalized.reduce((sum, value) => sum + value, 0) / normalized.length)
    : 0;

  const requiredFields: Array<[string, string]> = [
    ["interviewDate", "تاريخ المقابلة"],
    ["interviewerName", "اسم المسؤول عن المقابلة"],
    ["motivationLevel", "مستوى الدافعية"],
    ["attendanceReadiness", "الاستعداد للمواظبة"],
    ["interviewSummary", "خلاصة المقابلة"],
    ["arabicScore", "نتيجة اللغة العربية"],
    ["frenchScore", "نتيجة اللغة الفرنسية"],
    ["mathematicsScore", "نتيجة الرياضيات"],
    ["cognitiveScore", "الاختبار المعرفي"],
    ["psychologicalSummary", "الخلاصة النفسية والسلوكية"],
    ["proposedTrack", "المسار المقترح"],
    ["orientationReason", "مبررات التوجيه"]
  ];

  const missing = requiredFields
    .filter(([name]) => {
      const value = data.get(name);
      return value === null || String(value).trim() === "";
    })
    .map(([, label]) => label);

  const completion = Math.round(
    ((requiredFields.length - missing.length) / requiredFields.length) * 100
  );

  const interests = [
    ["الصناعات الإبداعية والرقمية", numberValue(data.get("creativeDigitalInterest")) ?? -1],
    ["الخدمات الاجتماعية", numberValue(data.get("socialServicesInterest")) ?? -1],
    ["المهن التقنية", numberValue(data.get("technicalInterest")) ?? -1],
    ["الفلاحة والاقتصاد الأخضر", numberValue(data.get("greenEconomyInterest")) ?? -1],
    ["التنشيط الثقافي والتربوي", numberValue(data.get("culturalAnimationInterest")) ?? -1]
  ] as const;

  const bestInterest = [...interests].sort((a, b) => b[1] - a[1])[0];
  const suggestedTrack = bestInterest[1] >= 0 ? bestInterest[0] : "غير محدد بعد";

  return { readiness, completion, missing, suggestedTrack };
}

function initialMetrics(assessment: Assessment | null): Metrics {
  const data = new FormData();
  if (!assessment) return calculateMetrics(data);

  Object.entries(assessment).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      data.set(key, value instanceof Date ? dateValue(value) : String(value));
    }
  });
  return calculateMetrics(data);
}

function Section({
  icon,
  title,
  description,
  children
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">{icon}</div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue = "",
  type = "text",
  min,
  max,
  required = false,
  hint
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  min?: number;
  max?: number;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-rose-500">*</span>}
      </span>
      <input
        name={name}
        type={type}
        min={min}
        max={max}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
      />
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue = "",
  required = false,
  rows = 4,
  hint
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-rose-500">*</span>}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        required={required}
        rows={rows}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
      />
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function readinessLabel(score: number) {
  if (score >= 75) return "جاهزية مرتفعة";
  if (score >= 50) return "جاهزية متوسطة";
  if (score > 0) return "يحتاج دعمًا أوليًا";
  return "غير محسوبة";
}

export function AdmissionAssessmentForm({
  beneficiaryId,
  assessment
}: {
  beneficiaryId: string;
  assessment: Assessment | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [metrics, setMetrics] = useState<Metrics>(() => initialMetrics(assessment));

  const readinessStyle = useMemo(() => {
    if (metrics.readiness >= 75) return "bg-emerald-50 text-emerald-700";
    if (metrics.readiness >= 50) return "bg-amber-50 text-amber-700";
    return "bg-rose-50 text-rose-700";
  }, [metrics.readiness]);

  function updateMetrics(form: HTMLFormElement) {
    setMetrics(calculateMetrics(new FormData(form)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setMessageType("");

    const formData = new FormData(event.currentTarget);
    const currentMetrics = calculateMetrics(formData);
    setMetrics(currentMetrics);

    if (currentMetrics.missing.length > 0) {
      setMessage(`يرجى استكمال الحقول الأساسية: ${currentMetrics.missing.join("، ")}.`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/admission`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر حفظ بيانات التشخيص.");

      setMessage("تم حفظ استمارة التشخيص والتوجيه بنجاح.");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onInput={(event) => updateMetrics(event.currentTarget)}
      className="space-y-6"
    >
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-semibold text-slate-400">اكتمال التشخيص</p>
          <p className="mt-2 text-3xl font-bold">{metrics.completion}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${metrics.completion}%` }} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400">درجة الجاهزية المقترحة</p>
          <p className="mt-2 text-3xl font-bold">{metrics.readiness}/100</p>
          <p className="mt-2 text-xs text-slate-400">{readinessLabel(metrics.readiness)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400">المجال المهني الأعلى</p>
          <p className="mt-2 text-base font-bold leading-7">{metrics.suggestedTrack}</p>
          <p className="mt-2 text-xs text-slate-400">اقتراح آلي غير ملزم للجنة.</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400">المعطيات الناقصة</p>
          <p className="mt-2 text-3xl font-bold">{metrics.missing.length}</p>
          <p className="mt-2 text-xs text-slate-400">حقول أساسية قبل اعتماد التشخيص.</p>
        </div>
      </section>

      {metrics.missing.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <TriangleAlert className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-bold">الاستمارة غير مكتملة بعد</p>
            <p className="mt-1 text-sm leading-6">المتبقي: {metrics.missing.join("، ")}.</p>
          </div>
        </div>
      )}

      <Section
        icon={<UsersRound size={22} />}
        title="1. المقابلة الأولية"
        description="توثيق ظروف المقابلة، مستوى الدافعية، والاستعداد للالتزام بمسار البرنامج."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="تاريخ المقابلة" name="interviewDate" type="date" required defaultValue={dateValue(assessment?.interviewDate)} />
          <Field label="اسم المسؤول عن المقابلة" name="interviewerName" required defaultValue={assessment?.interviewerName || ""} />
          <Field label="مستوى الدافعية" name="motivationLevel" type="number" min={0} max={5} required defaultValue={assessment?.motivationLevel ?? ""} hint="من 0 (ضعيف جدًا) إلى 5 (مرتفع جدًا)." />
          <Field label="الاستعداد للمواظبة" name="attendanceReadiness" type="number" min={0} max={5} required defaultValue={assessment?.attendanceReadiness ?? ""} hint="تقدير القدرة على الالتزام بالحضور والجدول." />
          <TextArea label="خلاصة المقابلة" name="interviewSummary" required defaultValue={assessment?.interviewSummary || ""} hint="الدوافع، التوقعات، العوائق، وملاحظات التواصل." />
        </div>
      </Section>

      <Section
        icon={<GraduationCap size={22} />}
        title="2. الكفايات الأساسية والتموقع"
        description="إدخال نتائج الاختبارات التشخيصية الأساسية على سلم من 100."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="اللغة العربية /100" name="arabicScore" type="number" min={0} max={100} required defaultValue={assessment?.arabicScore ?? ""} />
          <Field label="اللغة الفرنسية /100" name="frenchScore" type="number" min={0} max={100} required defaultValue={assessment?.frenchScore ?? ""} />
          <Field label="الرياضيات /100" name="mathematicsScore" type="number" min={0} max={100} required defaultValue={assessment?.mathematicsScore ?? ""} />
          <Field label="الاختبار المعرفي /100" name="cognitiveScore" type="number" min={0} max={100} required defaultValue={assessment?.cognitiveScore ?? ""} />
        </div>
      </Section>

      <Section
        icon={<HeartPulse size={22} />}
        title="3. التشخيص النفسي والسلوكي"
        description="خلاصة مهنية مختصرة حول الثقة بالنفس، التواصل، الانضباط، والتكيف."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <TextArea label="الخلاصة النفسية والسلوكية" name="psychologicalSummary" required rows={5} defaultValue={assessment?.psychologicalSummary || ""} hint="لا تُدرج تشخيصات طبية؛ اكتفِ بالملاحظات الوظيفية المرتبطة بالتعلم والمواكبة." />
        </div>
      </Section>

      <Section
        icon={<BriefcaseBusiness size={22} />}
        title="4. الميولات المهنية"
        description="تقدير الميل لكل منظومة مهنية من 0 إلى 100، ثم تحديد المسار والتخصص المقترحين."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="الصناعات الإبداعية والرقمية /100" name="creativeDigitalInterest" type="number" min={0} max={100} defaultValue={assessment?.creativeDigitalInterest ?? ""} />
          <Field label="الخدمات الاجتماعية /100" name="socialServicesInterest" type="number" min={0} max={100} defaultValue={assessment?.socialServicesInterest ?? ""} />
          <Field label="المهن التقنية /100" name="technicalInterest" type="number" min={0} max={100} defaultValue={assessment?.technicalInterest ?? ""} />
          <Field label="الفلاحة والاقتصاد الأخضر /100" name="greenEconomyInterest" type="number" min={0} max={100} defaultValue={assessment?.greenEconomyInterest ?? ""} />
          <Field label="التنشيط الثقافي والتربوي /100" name="culturalAnimationInterest" type="number" min={0} max={100} defaultValue={assessment?.culturalAnimationInterest ?? ""} />
          <TextArea label="ملاحظات الميولات المهنية" name="vocationalInterestNotes" defaultValue={assessment?.vocationalInterestNotes || ""} />
        </div>
      </Section>

      <Section
        icon={<Sparkles size={22} />}
        title="5. التوجيه المقترح"
        description="صياغة التوجيه اعتمادًا على النتائج والميولات والفرص الواقعية المتاحة للمستفيد."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="المسار المقترح" name="proposedTrack" required defaultValue={assessment?.proposedTrack || ""} hint={`الاقتراح الآلي الحالي: ${metrics.suggestedTrack}.`} />
          <Field label="الشعبة أو التخصص المقترح" name="proposedSpecialty" defaultValue={assessment?.proposedSpecialty || ""} />
          <TextArea label="مبررات التوجيه" name="orientationReason" required defaultValue={assessment?.orientationReason || ""} hint="اربط الاختيار بنتائج التشخيص والميولات والحاجات وخطة المواكبة." />
        </div>
      </Section>

      <Section
        icon={<ClipboardList size={22} />}
        title="6. قرار لجنة القبول"
        description="هذه الخانة توثق القرار الإداري النهائي؛ المؤشرات الآلية مساعدة ولا تستبدل قرار اللجنة."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">القرار</span>
            <select
              name="decision"
              defaultValue={assessment?.decision || "PENDING"}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            >
              <option value="PENDING">في انتظار القرار</option>
              <option value="ACCEPTED">مقبول</option>
              <option value="WAITLISTED">لائحة الانتظار</option>
              <option value="REJECTED">غير مقبول</option>
              <option value="NEEDS_REASSESSMENT">يحتاج إعادة تقييم</option>
            </select>
          </label>
          <Field label="تاريخ القرار" name="decisionDate" type="date" defaultValue={dateValue(assessment?.decisionDate)} />
          <TextArea label="ملاحظات اللجنة" name="committeeNotes" defaultValue={assessment?.committeeNotes || ""} hint="اذكر الشروط أو المبررات أو الإجراءات اللاحقة عند الحاجة." />
        </div>
      </Section>

      {message && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {messageType === "success" ? <CheckCircle2 className="shrink-0" size={20} /> : <TriangleAlert className="shrink-0" size={20} />}
          <p>{message}</p>
        </div>
      )}

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className={`rounded-xl px-4 py-2 text-sm font-semibold ${readinessStyle}`}>
          الجاهزية: {metrics.readiness}/100 · {readinessLabel(metrics.readiness)}
        </div>
        <button
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? "جارٍ الحفظ..." : "حفظ استمارة التشخيص"}
        </button>
      </div>
    </form>
  );
}
