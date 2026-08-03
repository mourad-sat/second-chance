"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const Field = ({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium">{label}{required ? " *" : ""}</span>
    <input required={required} name={name} type={type} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-700" />
  </label>
);

export function BeneficiaryForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "تعذر حفظ الملف.");

      router.push("/beneficiaries");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="الاسم العائلي" name="lastName" required />
        <Field label="الاسم الشخصي" name="firstName" required />
        <Field label="تاريخ الميلاد" name="birthDate" type="date" />
        <Field label="رقم البطاقة الوطنية أو مسار" name="identityNumber" />
        <Field label="رقم الهاتف" name="phone" type="tel" />
        <Field label="هاتف ولي الأمر" name="guardianPhone" type="tel" />
        <Field label="العنوان" name="address" />
        <Field label="آخر مستوى دراسي" name="lastEducationLevel" />
      </div>
      {message && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="reset" disabled={saving} className="rounded-xl border border-slate-300 px-5 py-3 disabled:opacity-50">إفراغ الحقول</button>
        <button type="submit" disabled={saving} className="rounded-xl bg-slate-900 px-6 py-3 text-white disabled:opacity-50">
          {saving ? "جارٍ الحفظ..." : "حفظ الملف الأولي"}
        </button>
      </div>
    </form>
  );
}
