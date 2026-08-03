"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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

const Field = ({ label, name, defaultValue = "", type = "text", min, max }: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  min?: number;
  max?: number;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium">{label}</span>
    <input name={name} type={type} min={min} max={max} defaultValue={defaultValue}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-700" />
  </label>
);

const TextArea = ({ label, name, defaultValue = "" }: { label: string; name: string; defaultValue?: string }) => (
  <label className="block md:col-span-2">
    <span className="mb-2 block text-sm font-medium">{label}</span>
    <textarea name={name} defaultValue={defaultValue} rows={4}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-700" />
  </label>
);

const dateValue = (value?: string | Date | null) => value ? new Date(value).toISOString().slice(0, 10) : "";

export function AdmissionAssessmentForm({ beneficiaryId, assessment }: { beneficiaryId: string; assessment: Assessment | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/admission`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر حفظ بيانات القبول.");
      setMessage("تم حفظ بيانات القبول والتشخيص والتوجيه بنجاح.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-xl font-bold">المقابلة الأولية</h3>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="تاريخ المقابلة" name="interviewDate" type="date" defaultValue={dateValue(assessment?.interviewDate)} />
          <Field label="اسم المسؤول عن المقابلة" name="interviewerName" defaultValue={assessment?.interviewerName || ""} />
          <Field label="مستوى الدافعية (0–5)" name="motivationLevel" type="number" min={0} max={5} defaultValue={assessment?.motivationLevel ?? ""} />
          <Field label="الاستعداد للمواظبة (0–5)" name="attendanceReadiness" type="number" min={0} max={5} defaultValue={assessment?.attendanceReadiness ?? ""} />
          <TextArea label="خلاصة المقابلة" name="interviewSummary" defaultValue={assessment?.interviewSummary || ""} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-xl font-bold">نتائج الاختبارات والتشخيص</h3>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="اللغة العربية /100" name="arabicScore" type="number" min={0} max={100} defaultValue={assessment?.arabicScore ?? ""} />
          <Field label="اللغة الفرنسية /100" name="frenchScore" type="number" min={0} max={100} defaultValue={assessment?.frenchScore ?? ""} />
          <Field label="الرياضيات /100" name="mathematicsScore" type="number" min={0} max={100} defaultValue={assessment?.mathematicsScore ?? ""} />
          <Field label="الاختبار المعرفي /100" name="cognitiveScore" type="number" min={0} max={100} defaultValue={assessment?.cognitiveScore ?? ""} />
          <TextArea label="الخلاصة النفسية والسلوكية" name="psychologicalSummary" defaultValue={assessment?.psychologicalSummary || ""} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-xl font-bold">الميولات المهنية والتوجيه</h3>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="الصناعات الإبداعية والرقمية /100" name="creativeDigitalInterest" type="number" min={0} max={100} defaultValue={assessment?.creativeDigitalInterest ?? ""} />
          <Field label="الخدمات الاجتماعية /100" name="socialServicesInterest" type="number" min={0} max={100} defaultValue={assessment?.socialServicesInterest ?? ""} />
          <Field label="المهن التقنية /100" name="technicalInterest" type="number" min={0} max={100} defaultValue={assessment?.technicalInterest ?? ""} />
          <Field label="الفلاحة والاقتصاد الأخضر /100" name="greenEconomyInterest" type="number" min={0} max={100} defaultValue={assessment?.greenEconomyInterest ?? ""} />
          <Field label="التنشيط الثقافي والتربوي /100" name="culturalAnimationInterest" type="number" min={0} max={100} defaultValue={assessment?.culturalAnimationInterest ?? ""} />
          <Field label="المسار المقترح" name="proposedTrack" defaultValue={assessment?.proposedTrack || ""} />
          <Field label="الشعبة أو التخصص المقترح" name="proposedSpecialty" defaultValue={assessment?.proposedSpecialty || ""} />
          <TextArea label="ملاحظات الميولات المهنية" name="vocationalInterestNotes" defaultValue={assessment?.vocationalInterestNotes || ""} />
          <TextArea label="مبررات التوجيه" name="orientationReason" defaultValue={assessment?.orientationReason || ""} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-xl font-bold">قرار لجنة القبول</h3>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">القرار</span>
            <select name="decision" defaultValue={assessment?.decision || "PENDING"}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
              <option value="PENDING">في انتظار القرار</option>
              <option value="ACCEPTED">مقبول</option>
              <option value="WAITLISTED">لائحة الانتظار</option>
              <option value="REJECTED">غير مقبول</option>
              <option value="NEEDS_REASSESSMENT">يحتاج إعادة تقييم</option>
            </select>
          </label>
          <Field label="تاريخ القرار" name="decisionDate" type="date" defaultValue={dateValue(assessment?.decisionDate)} />
          <TextArea label="ملاحظات اللجنة" name="committeeNotes" defaultValue={assessment?.committeeNotes || ""} />
        </div>
      </section>

      {message && <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm">{message}</p>}
      <div className="flex justify-end">
        <button disabled={saving} className="rounded-xl bg-slate-900 px-6 py-3 text-white disabled:opacity-60">
          {saving ? "جارٍ الحفظ..." : "حفظ القبول والتوجيه"}
        </button>
      </div>
    </form>
  );
}
