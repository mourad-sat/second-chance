"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, UserRoundPlus } from "lucide-react";

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
};

function Field({ label, name, type = "text", required = false, placeholder, maxLength }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">{label}{required ? <span className="text-red-600"> *</span> : null}</span>
      <input
        required={required}
        name={name}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({ label, name, options, required = false }: { label: string; name: string; options: string[]; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">{label}{required ? <span className="text-red-600"> *</span> : null}</span>
      <select required={required} name={name} defaultValue="" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
        <option value="">اختر...</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, name, placeholder, maxLength = 1000 }: { label: string; name: string; placeholder?: string; maxLength?: number }) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <textarea name={name} placeholder={placeholder} maxLength={maxLength} rows={4} className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
    </label>
  );
}

const steps = [
  { title: "الهوية والاتصال", note: "المعلومات الأساسية" },
  { title: "الوضع الاجتماعي", note: "الأسرة والسكن" },
  { title: "المسار الدراسي", note: "المستوى والانقطاع" },
  { title: "الميولات والأهداف", note: "الاختيارات المهنية" }
];

export function BeneficiaryForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  function goNext(form: HTMLFormElement) {
    const visibleRequired = Array.from(form.querySelectorAll<HTMLElement>(`[data-step="${step}"] [required]`));
    const invalid = visibleRequired.find((element) => element instanceof HTMLInputElement || element instanceof HTMLSelectElement ? !element.checkValidity() : false);
    if (invalid instanceof HTMLInputElement || invalid instanceof HTMLSelectElement) {
      invalid.reportValidity();
      return;
    }
    setStep((value) => Math.min(value + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < steps.length - 1) {
      goNext(event.currentTarget);
      return;
    }

    setSaving(true);
    setMessage(null);
    setSuccess(false);

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "تعذر حفظ التسجيل القبلي.");

      setSuccess(true);
      setMessage("تم حفظ التسجيل القبلي بنجاح. سيتم فتح ملف المستفيد الآن.");
      setTimeout(() => {
        router.push(`/beneficiaries/${result.id}`);
        router.refresh();
      }, 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black text-blue-700">المرحلة {step + 1} من {steps.length}</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{steps[step].title}</h2>
            <p className="mt-1 text-sm text-slate-500">{steps[step].note}</p>
          </div>
          <div className="min-w-64">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500"><span>نسبة التقدم</span><span>{progress}%</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-blue-700 to-cyan-400 transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          {steps.map((item, index) => (
            <button key={item.title} type="button" onClick={() => index < step && setStep(index)} className={`rounded-2xl border px-3 py-3 text-right text-xs transition ${index === step ? "border-blue-500 bg-blue-50 text-blue-800" : index < step ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-400"}`}>
              <span className="font-black">{index + 1}. {item.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div data-step="0" className={step === 0 ? "grid gap-5 md:grid-cols-2" : "hidden"}>
          <Field label="الاسم الشخصي" name="firstName" required maxLength={80} />
          <Field label="الاسم العائلي" name="lastName" required maxLength={80} />
          <SelectField label="الجنس" name="gender" options={["ذكر", "أنثى"]} />
          <Field label="تاريخ الميلاد" name="birthDate" type="date" />
          <Field label="مكان الميلاد" name="birthPlace" maxLength={120} />
          <Field label="رقم البطاقة الوطنية" name="identityNumber" maxLength={40} placeholder="مثال: AB123456" />
          <Field label="رقم مسار" name="masarNumber" maxLength={30} />
          <Field label="رقم الهاتف" name="phone" type="tel" maxLength={20} placeholder="06XXXXXXXX" />
          <Field label="البريد الإلكتروني" name="email" type="email" maxLength={160} />
          <Field label="العنوان" name="address" maxLength={300} />
          <Field label="الجماعة" name="commune" maxLength={120} />
          <Field label="الإقليم/العمالة" name="province" maxLength={120} />
        </div>

        <div data-step="1" className={step === 1 ? "grid gap-5 md:grid-cols-2" : "hidden"}>
          <SelectField label="الوضعية العائلية" name="familySituation" options={["يعيش مع الوالدين", "مع أحد الوالدين", "مع ولي أمر", "متزوج", "وضعية أخرى"]} />
          <Field label="اسم ولي الأمر" name="guardianName" maxLength={160} />
          <Field label="صلة القرابة" name="guardianRelationship" maxLength={80} />
          <Field label="هاتف ولي الأمر" name="guardianPhone" type="tel" maxLength={20} />
          <Field label="عدد أفراد الأسرة" name="householdSize" type="number" />
          <SelectField label="وضعية دخل الأسرة" name="familyIncomeSituation" options={["مستقر", "غير مستقر", "محدود", "بدون دخل قار"]} />
          <SelectField label="وضعية السكن" name="housingSituation" options={["ملك", "كراء", "سكن عائلي", "سكن مؤقت", "وضعية أخرى"]} />
          <SelectField label="التغطية الاجتماعية" name="socialCoverage" options={["AMO", "RAMED سابقًا", "تغطية خاصة", "بدون تغطية", "غير معروف"]} />
          <TextArea label="حاجات خاصة أو وضعية صحية يجب مراعاتها" name="specialNeeds" maxLength={1000} />
        </div>

        <div data-step="2" className={step === 2 ? "grid gap-5 md:grid-cols-2" : "hidden"}>
          <SelectField label="آخر مستوى دراسي" name="lastEducationLevel" options={["ابتدائي", "إعدادي", "ثانوي تأهيلي", "تكوين مهني", "تعليم عالٍ", "غير متمدرس"]} />
          <Field label="آخر مؤسسة دراسية" name="lastSchoolName" maxLength={200} />
          <Field label="سنة الانقطاع" name="dropoutYear" type="number" />
          <TextArea label="أسباب الانقطاع عن الدراسة" name="dropoutReasons" maxLength={1200} />
          <TextArea label="صعوبات التعلم المصرح بها" name="learningDifficulties" maxLength={1000} />
          <TextArea label="خبرات أو تكوينات سابقة" name="priorExperience" maxLength={1000} />
        </div>

        <div data-step="3" className={step === 3 ? "grid gap-5 md:grid-cols-2" : "hidden"}>
          <Field label="الاختيار المهني الأول" name="careerChoice1" maxLength={160} />
          <Field label="الاختيار المهني الثاني" name="careerChoice2" maxLength={160} />
          <Field label="الاختيار المهني الثالث" name="careerChoice3" maxLength={160} />
          <Field label="المشروع الشخصي أو المهني" name="personalProject" maxLength={500} />
          <TextArea label="لماذا اخترت هذا المسار؟" name="careerChoiceReason" maxLength={1200} />
          <TextArea label="ما الذي تنتظره من البرنامج؟" name="programExpectation" maxLength={1200} />
          <TextArea label="أهداف التسجيل" name="registrationGoals" maxLength={1200} />
        </div>
      </section>

      {message && <div className={`flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm font-bold ${success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{success ? <CheckCircle2 size={20} /> : null}<span>{message}</span></div>}

      <section className="flex flex-col-reverse gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <button type="button" disabled={saving || step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-40"><ChevronRight size={18} /> السابق</button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="reset" disabled={saving} onClick={() => { setStep(0); setMessage(null); }} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 disabled:opacity-40">إفراغ الاستمارة</button>
          {step < steps.length - 1 ? (
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-black text-white hover:bg-blue-800"><ChevronLeft size={18} /> التالي</button>
          ) : (
            <button type="submit" disabled={saving || success} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={18} /> : <UserRoundPlus size={18} />}{saving ? "جارٍ الحفظ..." : "حفظ التسجيل القبلي"}</button>
          )}
        </div>
      </section>
    </form>
  );
}
