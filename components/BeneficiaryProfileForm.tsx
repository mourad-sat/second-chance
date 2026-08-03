"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
};

const Field = ({ label, name, defaultValue = "", type = "text" }: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium">{label}</span>
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-700"
    />
  </label>
);

export function BeneficiaryProfileForm({ beneficiary }: { beneficiary: BeneficiaryData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const birthDate = beneficiary.birthDate
    ? new Date(beneficiary.birthDate).toISOString().slice(0, 10)
    : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch(`/api/beneficiaries/${beneficiary.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "تعذر تحديث الملف.");

      setMessage("تم تحديث ملف المستفيد بنجاح.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
          <span className="mb-2 block text-sm font-medium">وضعية المستفيد</span>
          <select name="status" defaultValue={beneficiary.status} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
            {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      {message && <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm">{message}</p>}

      <div className="mt-6 flex justify-end">
        <button disabled={saving} className="rounded-xl bg-slate-900 px-6 py-3 text-white disabled:opacity-60">
          {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
        </button>
      </div>
    </form>
  );
}
