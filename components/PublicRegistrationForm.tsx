"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

async function readResponse(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { message: text || "حدث خطأ غير متوقع." }; }
}

export function PublicRegistrationForm() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [applicationNumber, setApplicationNumber] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError("");

    try {
      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());
      const response = await fetch("/api/public-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, consent: data.get("consent") === "on" })
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.message || "تعذر إرسال الطلب.");
      setApplicationNumber(result.applicationNumber);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إرسال الطلب.");
    } finally {
      setSaving(false);
    }
  }

  if (applicationNumber) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
        <CheckCircle2 className="mx-auto text-emerald-600" size={56} />
        <h2 className="mt-5 text-2xl font-bold text-slate-950">تم إرسال طلبك بنجاح</h2>
        <p className="mt-3 text-slate-600">احتفظ برقم الطلب التالي للاستفسار والمتابعة:</p>
        <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-slate-950 px-5 py-4 font-mono text-xl font-bold tracking-wider text-white">{applicationNumber}</div>
        <p className="mt-4 text-sm text-slate-500">ستتواصل معك إدارة البرنامج بعد مراجعة المعلومات.</p>
        <button onClick={() => setApplicationNumber("")} className="mt-6 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50">إرسال طلب آخر</button>
      </div>
    );
  }

  const input = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">الاسم الشخصي *<input required name="firstName" className={input} /></label>
        <label className="text-sm font-semibold text-slate-700">الاسم العائلي *<input required name="lastName" className={input} /></label>
        <label className="text-sm font-semibold text-slate-700">تاريخ الازدياد *<input required name="birthDate" type="date" className={input} /></label>
        <label className="text-sm font-semibold text-slate-700">رقم الهاتف *<input required name="phone" inputMode="tel" className={input} /></label>
        <label className="text-sm font-semibold text-slate-700">رقم البطاقة الوطنية<input name="identityNumber" className={input} /></label>
        <label className="text-sm font-semibold text-slate-700">هاتف ولي الأمر<input name="guardianPhone" inputMode="tel" className={input} /></label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">العنوان<input name="address" className={input} /></label>
        <label className="text-sm font-semibold text-slate-700">آخر مستوى دراسي
          <select name="lastEducationLevel" className={input} defaultValue="">
            <option value="">اختر المستوى</option><option>ابتدائي</option><option>إعدادي</option><option>ثانوي تأهيلي</option><option>تكوين مهني</option><option>أخرى</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">آخر مؤسسة دراسية<input name="lastSchoolName" className={input} /></label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">سبب الانقطاع عن الدراسة<textarea name="dropoutReasons" rows={3} className={input} /></label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">المجال أو المهنة التي ترغب فيها<textarea name="careerGoal" rows={2} className={input} /></label>
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <input required name="consent" type="checkbox" className="mt-1 h-4 w-4" />
        أوافق على استعمال هذه المعلومات لدراسة طلب الاستفادة من برنامج الفرصة الثانية والتواصل معي بخصوصه.
      </label>

      {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <button disabled={saving} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {saving ? <><Loader2 className="animate-spin" size={18} /> جارٍ إرسال الطلب...</> : <><Send size={18} /> إرسال طلب التسجيل القبلي</>}
      </button>
    </form>
  );
}
