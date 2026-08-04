"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Save } from "lucide-react";

const statuses = [
  ["PRE_REGISTERED", "مسجل أوليًا"],
  ["UNDER_REVIEW", "قيد دراسة الملف"],
  ["WAITLISTED", "لائحة الانتظار"],
  ["ACCEPTED", "مقبول"],
  ["REJECTED", "غير مقبول"],
  ["ENROLLED", "متمدرس"],
  ["WITHDRAWN", "منسحب"],
  ["COMPLETED", "أنهى البرنامج"]
];

type BeneficiaryData = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | Date | null;
  identityNumber: string | null;
  phone: string | null;
  guardianPhone: string | null;
  address: string | null;
  lastEducationLevel: string | null;
  status: string;
  familySituation: string | null;
  guardianName: string | null;
  guardianRelationship: string | null;
  householdSize: number | null;
  familyIncomeSituation: string | null;
  housingSituation: string | null;
  socialCoverage: string | null;
  lastSchoolName: string | null;
  dropoutYear: number | null;
  dropoutReasons: string | null;
  learningDifficulties: string | null;
  specialNeeds: string | null;
  diagnosticSummary: string | null;
  strengths: string | null;
  priorityNeeds: string | null;
  supportPlan: string | null;
  careerGoal: string | null;
  followUpNotes: string | null;
};

function Section({ title, description, children, defaultOpen = false }: {
  title: string;
  description: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 hover:bg-slate-50">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <ChevronDown className="shrink-0 text-slate-400 transition group-open:rotate-180" size={20} />
      </summary>
      <div className="border-t border-slate-100 p-6">{children}</div>
    </details>
  );
}

const Field = ({ label, name, defaultValue = "", type = "text" }: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
    />
  </label>
);

const TextArea = ({ label, name, defaultValue = "", rows = 4 }: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
    <textarea
      name={name}
      rows={rows}
      defaultValue={defaultValue}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
    />
  </label>
);

export function BeneficiaryProfileForm({ beneficiary }: { beneficiary: BeneficiaryData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const birthDate = beneficiary.birthDate
    ? new Date(beneficiary.birthDate).toISOString().slice(0, 10)
    : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setMessageType("");

    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const response = await fetch(`/api/beneficiaries/${beneficiary.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "تعذر تحديث الملف.");

      setMessage("تم تحديث ملف المستفيد بنجاح.");
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="البيانات الأساسية" description="معلومات الهوية والاتصال والوضعية الحالية داخل البرنامج." defaultOpen>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="الاسم العائلي" name="lastName" defaultValue={beneficiary.lastName} />
          <Field label="الاسم الشخصي" name="firstName" defaultValue={beneficiary.firstName} />
          <Field label="تاريخ الميلاد" name="birthDate" type="date" defaultValue={birthDate} />
          <Field label="رقم البطاقة الوطنية أو مسار" name="identityNumber" defaultValue={beneficiary.identityNumber || ""} />
          <Field label="رقم الهاتف" name="phone" type="tel" defaultValue={beneficiary.phone || ""} />
          <Field label="هاتف ولي الأمر" name="guardianPhone" type="tel" defaultValue={beneficiary.guardianPhone || ""} />
          <Field label="العنوان" name="address" defaultValue={beneficiary.address || ""} />
          <Field label="آخر مستوى دراسي" name="lastEducationLevel" defaultValue={beneficiary.lastEducationLevel || ""} />
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">وضعية المستفيد</span>
            <select name="status" defaultValue={beneficiary.status} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
              {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
      </Section>

      <Section title="الوضعية الاجتماعية والأسرية" description="معطيات تساعد على فهم ظروف المستفيد وتحديد نوع المواكبة المطلوبة.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="الوضعية الأسرية" name="familySituation" defaultValue={beneficiary.familySituation || ""} />
          <Field label="اسم ولي الأمر أو المسؤول" name="guardianName" defaultValue={beneficiary.guardianName || ""} />
          <Field label="صلة القرابة" name="guardianRelationship" defaultValue={beneficiary.guardianRelationship || ""} />
          <Field label="عدد أفراد الأسرة" name="householdSize" type="number" defaultValue={beneficiary.householdSize ?? ""} />
          <Field label="وضعية دخل الأسرة" name="familyIncomeSituation" defaultValue={beneficiary.familyIncomeSituation || ""} />
          <Field label="وضعية السكن" name="housingSituation" defaultValue={beneficiary.housingSituation || ""} />
          <Field label="التغطية الصحية أو الاجتماعية" name="socialCoverage" defaultValue={beneficiary.socialCoverage || ""} />
        </div>
      </Section>

      <Section title="المسار التربوي والانقطاع" description="توثيق آخر تجربة مدرسية وأسباب الانقطاع والصعوبات المسجلة.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="آخر مؤسسة تعليمية" name="lastSchoolName" defaultValue={beneficiary.lastSchoolName || ""} />
          <Field label="سنة الانقطاع" name="dropoutYear" type="number" defaultValue={beneficiary.dropoutYear ?? ""} />
          <div className="md:col-span-2">
            <TextArea label="أسباب الانقطاع" name="dropoutReasons" defaultValue={beneficiary.dropoutReasons || ""} />
          </div>
          <TextArea label="صعوبات التعلم" name="learningDifficulties" defaultValue={beneficiary.learningDifficulties || ""} />
          <TextArea label="الحاجات الخاصة أو الترتيبات الضرورية" name="specialNeeds" defaultValue={beneficiary.specialNeeds || ""} />
        </div>
      </Section>

      <Section title="التشخيص وخطة المواكبة" description="خلاصة التقييم الأولي ونقاط القوة والأهداف والإجراءات المتفق عليها.">
        <div className="grid gap-5 md:grid-cols-2">
          <TextArea label="خلاصة التشخيص" name="diagnosticSummary" defaultValue={beneficiary.diagnosticSummary || ""} />
          <TextArea label="نقاط القوة" name="strengths" defaultValue={beneficiary.strengths || ""} />
          <TextArea label="الحاجات ذات الأولوية" name="priorityNeeds" defaultValue={beneficiary.priorityNeeds || ""} />
          <TextArea label="خطة المواكبة الفردية" name="supportPlan" defaultValue={beneficiary.supportPlan || ""} />
          <TextArea label="الهدف الدراسي أو المهني" name="careerGoal" defaultValue={beneficiary.careerGoal || ""} />
          <TextArea label="ملاحظات التتبع" name="followUpNotes" defaultValue={beneficiary.followUpNotes || ""} />
        </div>
      </Section>

      {message && (
        <p className={`rounded-xl border px-4 py-3 text-sm ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`} role="status">
          {message}
        </p>
      )}

      <div className="sticky bottom-4 z-10 flex justify-end rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          <Save size={18} />
          {saving ? "جارٍ الحفظ..." : "حفظ جميع التعديلات"}
        </button>
      </div>
    </form>
  );
}
