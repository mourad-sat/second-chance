"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type BeneficiaryOption = { id: string; firstName: string; lastName: string };

export function SocialFollowUpForm({ beneficiaries }: { beneficiaries: BeneficiaryOption[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/social-follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر الحفظ.");
      form.reset();
      setMessage("تم تسجيل عملية المواكبة بنجاح.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-xl font-bold">تسجيل عملية مواكبة</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label><span className="mb-2 block text-sm font-medium">المستفيد</span><select required name="beneficiaryId" className={inputClass}><option value="">اختر المستفيد</option>{beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.firstName} {b.lastName}</option>)}</select></label>
        <label><span className="mb-2 block text-sm font-medium">نوع العملية</span><select name="type" className={inputClass}><option value="INDIVIDUAL_INTERVIEW">مقابلة فردية</option><option value="FAMILY_VISIT">زيارة أسرية</option><option value="PHONE_CALL">اتصال هاتفي</option><option value="MEDIATION">وساطة</option><option value="REFERRAL">إحالة</option><option value="MATERIAL_SUPPORT">دعم مادي</option><option value="PSYCHOLOGICAL_SUPPORT">دعم نفسي</option><option value="OTHER">أخرى</option></select></label>
        <label><span className="mb-2 block text-sm font-medium">تاريخ العملية</span><input required type="date" name="eventDate" className={inputClass} /></label>
        <label><span className="mb-2 block text-sm font-medium">الأولوية</span><select name="priority" className={inputClass}><option value="LOW">منخفضة</option><option value="NORMAL">عادية</option><option value="HIGH">مرتفعة</option><option value="URGENT">مستعجلة</option></select></label>
        <label><span className="mb-2 block text-sm font-medium">المسؤول</span><input name="responsibleName" className={inputClass} /></label>
        <label><span className="mb-2 block text-sm font-medium">الموضوع</span><input required name="subject" className={inputClass} /></label>
        <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium">التفاصيل</span><textarea name="details" rows={3} className={inputClass} /></label>
        <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium">الإجراءات المتخذة</span><textarea name="actionsTaken" rows={2} className={inputClass} /></label>
        <label><span className="mb-2 block text-sm font-medium">الشريك المحال إليه</span><input name="partnerName" className={inputClass} /></label>
        <label><span className="mb-2 block text-sm font-medium">سبب الإحالة</span><input name="referralReason" className={inputClass} /></label>
        <label><span className="mb-2 block text-sm font-medium">الإجراء المقبل</span><input name="nextAction" className={inputClass} /></label>
        <label><span className="mb-2 block text-sm font-medium">موعد المتابعة المقبلة</span><input type="date" name="nextFollowUpDate" className={inputClass} /></label>
      </div>
      {message && <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm">{message}</p>}
      <div className="mt-5 flex justify-end"><button disabled={saving} className="rounded-xl bg-slate-900 px-6 py-3 text-white disabled:opacity-60">{saving ? "جارٍ الحفظ..." : "حفظ عملية المواكبة"}</button></div>
    </form>
  );
}