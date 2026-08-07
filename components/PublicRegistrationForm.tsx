"use client";

import Link from "next/link";
import Script from "next/script";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Camera, CheckCircle2, Clock3, FileText, GraduationCap, Loader2, Phone, Printer, Save, Send, ShieldCheck, UploadCloud, UserRound } from "lucide-react";

const DRAFT_KEY = "second-chance-public-registration-draft-v1";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const trainingOptions = [
  "التصميم الغرافيكي والهوية البصرية", "صناعة المحتوى والتسويق الرقمي", "تصميم وتطوير المواقع الإلكترونية",
  "برمجة تطبيقات الهاتف", "الذكاء الاصطناعي وتطبيقاته المهنية", "الكهرباء المنزلية", "الطاقة الشمسية",
  "كاميرات المراقبة والشبكات", "الصيانة الإلكترونية للأجهزة الرقمية", "المساعد الاجتماعي",
  "التنشيط الثقافي والتربوي", "الاستقبال والإرشاد", "لم أحدد بعد"
];

const registrationGoals = ["العودة إلى التعليم", "الحصول على تكوين مهني", "تعلم مهارات رقمية", "الحصول على فرصة عمل", "إنشاء مشروع خاص", "تطوير الثقة بالنفس"];

const educationLevels = [
  "الأول ابتدائي", "الثاني ابتدائي", "الثالث ابتدائي", "الرابع ابتدائي", "الخامس ابتدائي", "السادس ابتدائي",
  "الأولى إعدادي", "الثانية إعدادي", "الثالثة إعدادي", "الجذع المشترك", "الأولى بكالوريا", "الثانية بكالوريا"
];

const dropoutReasonOptions = [
  "ظروف عائلية", "ظروف اجتماعية", "ظروف اقتصادية", "صعوبات التعلم", "صعوبات نفسية", "مشاكل صحية",
  "بُعد المؤسسة أو صعوبات النقل", "العمل", "التعثر أو التكرار الدراسي", "عدم الرغبة في متابعة الدراسة", "أسباب أخرى"
];

const steps = [
  { title: "المعلومات الشخصية", icon: UserRound },
  { title: "الاتصال والإقامة", icon: Phone },
  { title: "المسار الدراسي", icon: GraduationCap },
  { title: "الرغبات والأهداف", icon: BriefcaseBusiness },
  { title: "الوثائق", icon: UploadCloud },
  { title: "المراجعة والإرسال", icon: ShieldCheck }
];

async function readResponse(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { message: text || "حدث خطأ غير متوقع." }; }
}

export function PublicRegistrationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [applicationNumber, setApplicationNumber] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as Record<string, string> | null;
      if (!draft) return;
      for (const [name, value] of Object.entries(draft)) {
        const field = form.elements.namedItem(name);
        if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
          if (field.type !== "file" && field.type !== "checkbox") field.value = value;
        }
      }
      if (draft.birthDate) setBirthDate(draft.birthDate);
      setDraftLoaded(true);
    } catch { localStorage.removeItem(DRAFT_KEY); }
  }, []);

  const age = useMemo(() => {
    if (!birthDate) return null;
    const date = new Date(birthDate);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date();
    let value = today.getFullYear() - date.getFullYear();
    const month = today.getMonth() - date.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < date.getDate())) value--;
    return value >= 0 ? value : null;
  }, [birthDate]);

  const ageIsValid = age !== null && age >= 14 && age <= 20;
  const progress = ((step + 1) / steps.length) * 100;
  const input = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
  const section = "rounded-[1.8rem] border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/50 sm:p-8";

  function saveDraft() {
    const form = formRef.current;
    if (!form) return;
    let draft: Record<string, string> = {};
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}") as Record<string, string>; } catch { draft = {}; }
    new FormData(form).forEach((value, key) => {
      if (typeof value === "string" && key !== "website" && key !== "cf-turnstile-response") draft[key] = value;
    });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setDraftLoaded(true);
  }

  function validateStep() {
    const form = formRef.current;
    if (!form) return false;
    const selectors = [
      '[name="photo"],[name="masarNumber"],[name="gender"],[name="firstName"],[name="lastName"],[name="birthDate"]',
      '[name="phone"],[name="address"]',
      '[name="lastEducationLevel"],[name="dropoutReasons"]',
      '[name="careerChoice1"]',
      '',
      '[name="declaration"],[name="consent"]'
    ];
    if (selectors[step]) {
      const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(selectors[step]));
      for (const field of fields) {
        if (!field.checkValidity()) { field.reportValidity(); setError("يرجى استكمال الحقول الإلزامية."); return false; }
      }
    }
    if (step === 0 && !ageIsValid) { setError("التسجيل متاح للأعمار بين 14 و20 سنة."); return false; }
    if (step === 3 && !form.querySelector<HTMLInputElement>('input[name="registrationGoals"]:checked')) {
      setError("يرجى اختيار الهدف الرئيسي من الالتحاق بالبرنامج.");
      return false;
    }
    setError("");
    return true;
  }

  function nextStep() {
    if (!validateStep()) return;
    saveDraft();
    setStep((value) => Math.min(value + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep()) return;
    const data = new FormData(event.currentTarget);
    const photo = data.get("photo");
    if (!(photo instanceof File) || !photo.size) return setError("يرجى إضافة صورة المترشح.");
    if (TURNSTILE_SITE_KEY && !String(data.get("cf-turnstile-response") || "")) return setError("يرجى إتمام التحقق الأمني قبل الإرسال.");
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/public-registration", { method: "POST", body: data });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.message || "تعذر إرسال الطلب.");
      setApplicationNumber(result.applicationNumber);
      setRegistrationDate(result.registrationDate);
      setCandidateName(result.candidateName);
      localStorage.removeItem(DRAFT_KEY);
      event.currentTarget.reset();
      setBirthDate(""); setPhotoPreview(""); setStep(0);
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر إرسال الطلب."); }
    finally { setSaving(false); }
  }

  if (applicationNumber) {
    const encoded = encodeURIComponent(applicationNumber);
    return <div className="rounded-[2rem] border border-emerald-200 bg-white p-7 text-center shadow-xl sm:p-10">
      <CheckCircle2 className="mx-auto text-emerald-600" size={64} />
      <h2 className="mt-5 text-3xl font-black text-slate-950">تم استلام طلبكم بنجاح</h2>
      <p className="mt-2 font-bold text-slate-700">{candidateName}</p>
      <div className="mx-auto mt-7 grid max-w-xl gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-blue-950 p-5 text-white"><p className="text-xs text-blue-200">رقم الطلب</p><p className="mt-2 font-mono text-lg font-black tracking-wider">{applicationNumber}</p></div>
        <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-950"><p className="text-xs text-emerald-700">تاريخ التسجيل</p><p className="mt-2 font-black">{new Date(registrationDate).toLocaleDateString("ar-MA")}</p></div>
      </div>
      <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600">احتفظ برقم الطلب. ستحتاج إليه مع رقم مسار لطباعة الوصل أو تتبع حالة الملف.</p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href={`/registration-receipt?registrationNumber=${encoded}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 font-black text-white"><Printer size={18} /> طباعة الوصل</Link>
        <Link href={`/application-status?registrationNumber=${encoded}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-5 py-3 font-black text-blue-900"><Clock3 size={18} /> تتبع الطلب</Link>
        <button onClick={() => { setApplicationNumber(""); setRegistrationDate(""); setCandidateName(""); }} className="rounded-xl border border-slate-200 px-5 py-3 font-bold">طلب جديد</button>
      </div>
    </div>;
  }

  return <form ref={formRef} onSubmit={submit} className="space-y-5" onChange={() => { if (draftLoaded) saveDraft(); }}>
    {TURNSTILE_SITE_KEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />}
    <input name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden="true" />
    <input type="hidden" name="personalProject" value="غير محدد في استمارة التسجيل القبلي" />
    <input type="hidden" name="previousProgram" value="غير محدد" />

    <div className="rounded-[1.8rem] border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between text-xs font-bold text-slate-500"><span>المرحلة {step + 1} من {steps.length}</span><span>{Math.round(progress)}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-blue-700 transition-all" style={{ width: `${progress}%` }} /></div>
      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">{steps.map((item, index) => { const Icon = item.icon; const active = index === step; const done = index < step; return <button type="button" key={item.title} onClick={() => index < step && setStep(index)} className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-[10px] font-bold ${active ? "bg-blue-700 text-white" : done ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-400"}`}><Icon size={18} /><span>{item.title}</span></button>; })}</div>
      {draftLoaded && <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"><Save size={15} /> يتم حفظ المسودة تلقائيًا على هذا الجهاز.</div>}
    </div>

    {step === 0 && <section className={section}><h2 className="mb-2 text-xl font-black">المعلومات الشخصية</h2><p className="mb-6 text-sm text-slate-500">أدخل البيانات كما تظهر في الوثائق الرسمية.</p><div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/50 text-center">{photoPreview ? <img src={photoPreview} alt="معاينة" className="h-64 w-full object-cover" /> : <><Camera size={42} className="text-blue-700" /><span className="mt-3 font-black">صورة المترشح *</span><span className="text-xs text-slate-500">حتى 2MB</span></>}<input required name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; setPhotoPreview(file ? URL.createObjectURL(file) : ""); }} /></label>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-bold">رقم مسار *<input required name="masarNumber" minLength={6} maxLength={30} pattern="[A-Za-z0-9-]{6,30}" autoCapitalize="characters" placeholder="مثال: G123456789" className={`${input} uppercase`} /></label>
        <label className="text-sm font-bold">الجنس *<select required name="gender" className={input} defaultValue=""><option value="">اختر</option><option>ذكر</option><option>أنثى</option></select></label>
        <label className="text-sm font-bold">الاسم الشخصي *<input required name="firstName" maxLength={80} autoComplete="given-name" className={input} /></label>
        <label className="text-sm font-bold">الاسم العائلي *<input required name="lastName" maxLength={80} autoComplete="family-name" className={input} /></label>
        <label className="text-sm font-bold">تاريخ الازدياد *<input required name="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={input} /></label>
        <label className="text-sm font-bold">مكان الازدياد<input name="birthPlace" maxLength={120} className={input} /></label>
        <div className={`md:col-span-2 rounded-xl p-3 text-sm font-bold ${ageIsValid ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-500"}`}>{age === null ? "سيتم حساب العمر تلقائيًا." : `العمر: ${age} سنة ${ageIsValid ? "— مؤهل" : "— غير مؤهل"}`}</div>
      </div></div></section>}

    {step === 1 && <section className={section}><h2 className="mb-6 text-xl font-black">الاتصال والإقامة</h2><div className="grid gap-5 md:grid-cols-2">
      <label className="text-sm font-bold">رقم الهاتف *<input required name="phone" inputMode="tel" pattern="0[5-7][0-9]{8}" placeholder="06XXXXXXXX" className={input} /></label>
      <label className="text-sm font-bold">هاتف ولي الأمر<input name="guardianPhone" inputMode="tel" className={input} /></label>
      <label className="text-sm font-bold">البريد الإلكتروني<input name="email" type="email" className={input} /></label>
      <label className="text-sm font-bold">اسم ولي الأمر<input name="guardianName" className={input} /></label>
      <label className="text-sm font-bold">صلة القرابة<input name="guardianRelationship" className={input} /></label>
      <label className="text-sm font-bold">الجماعة<input name="commune" className={input} /></label>
      <label className="text-sm font-bold">الإقليم<input name="province" className={input} /></label>
      <label className="text-sm font-bold md:col-span-2">العنوان الكامل *<textarea required name="address" rows={3} className={input} /></label>
    </div></section>}

    {step === 2 && <section className={section}><h2 className="mb-2 text-xl font-black">المسار الدراسي</h2><p className="mb-6 text-sm text-slate-500">حدد آخر قسم درست فيه وسبب الانقطاع عن الدراسة.</p><div className="grid gap-5 md:grid-cols-2">
      <label className="text-sm font-bold">آخر قسم متمدرس *<select required name="lastEducationLevel" className={input} defaultValue=""><option value="">اختر آخر قسم</option>{educationLevels.map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
      <label className="text-sm font-bold">آخر مؤسسة<input name="lastSchoolName" className={input} /></label>
      <label className="text-sm font-bold">سنة الانقطاع<input name="dropoutYear" type="number" min="1990" max={new Date().getFullYear()} className={input} /></label>
      <label className="text-sm font-bold">سبب الانقطاع عن الدراسة *<select required name="dropoutReasons" className={input} defaultValue=""><option value="">اختر السبب</option>{dropoutReasonOptions.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></label>
    </div></section>}

    {step === 3 && <section className={section}><h2 className="mb-6 text-xl font-black">الرغبات والأهداف</h2><div className="grid gap-5">
      <div><h3 className="text-sm font-black text-slate-900">الهدف الرئيسي من الالتحاق بالبرنامج *</h3><p className="mt-1 text-xs text-slate-500">اختر هدفًا واحدًا على الأقل.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{registrationGoals.map((goal) => <label key={goal} className="flex items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" name="registrationGoals" value={goal} />{goal}</label>)}</div>
      <label className="text-sm font-bold">ماذا تنتظر من البرنامج؟<textarea name="programExpectation" rows={3} className={input} /></label>
      <div className="grid gap-5 md:grid-cols-3">{[1,2,3].map((index) => <label key={index} className="text-sm font-bold">الرغبة {index} {index === 1 ? "*" : ""}<select required={index === 1} name={`careerChoice${index}`} className={input} defaultValue=""><option value="">اختر</option>{trainingOptions.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div>
      <label className="text-sm font-bold">سبب الاختيار<textarea name="careerChoiceReason" rows={3} className={input} /></label>
      <label className="text-sm font-bold">خبرة أو هواية سابقة<textarea name="priorExperience" rows={3} className={input} /></label>
    </div></section>}

    {step === 4 && <section className={section}><h2 className="mb-2 text-xl font-black">الوثائق</h2><p className="mb-6 text-sm text-slate-500">يمكن إرفاق PDF أو صورة، بحد أقصى 5MB لكل وثيقة.</p><div className="grid gap-4 md:grid-cols-3">
      {[["identityDocument","نسخة من بطاقة التعريف لولي الأمر"],["educationDocument","آخر وثيقة دراسية"],["otherDocument","آخر بيان النقط"]].map(([name,label]) => <label key={name} className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center hover:border-blue-400"><FileText className="text-blue-700" /><span className="mt-3 text-sm font-black">{label}</span><span className="mt-1 text-xs text-slate-500">PDF / JPG / PNG / WEBP</span><input name={name} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="mt-3 block w-full text-xs" /></label>)}
    </div></section>}

    {step === 5 && <section className={section}><div className="text-center"><ShieldCheck className="mx-auto text-emerald-700" size={42} /><h2 className="mt-3 text-2xl font-black">المراجعة والإرسال</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-slate-600">تأكد من صحة جميع المعطيات قبل إرسال الملف. يمكن العودة لأي مرحلة للتعديل.</p></div><div className="mt-6 rounded-2xl bg-blue-50 p-5 text-sm leading-7 text-blue-950">إرسال الطلب يعني التسجيل القبلي فقط ولا يضمن القبول النهائي. استخدم أزرار المراحل أعلاه أو زر «السابق» للعودة وتعديل البيانات قبل الإرسال.</div><div className="mt-5 space-y-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950"><label className="flex gap-3"><input required name="declaration" type="checkbox" /><span>أقر بصحة المعلومات المدخلة.</span></label><label className="flex gap-3"><input required name="consent" type="checkbox" /><span>أوافق على معالجة البيانات لأغراض التسجيل والتوجيه.</span></label></div>{TURNSTILE_SITE_KEY ? <div className="mt-5 flex justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-language="ar" data-theme="light" /></div> : <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><ShieldCheck className="mt-0.5 shrink-0" size={20} /><p>الحماية الأساسية مفعلة. لتفعيل Cloudflare Turnstile أضف مفاتيح البيئة في Vercel.</p></div>}</section>}

    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      <button type="button" onClick={() => setStep((value) => Math.max(value - 1, 0))} disabled={step === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 font-bold disabled:opacity-40"><ArrowRight size={18} /> السابق</button>
      <div className="flex gap-3"><button type="button" onClick={saveDraft} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold"><Save size={17} /> حفظ المسودة</button>{step < steps.length - 1 ? <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-black text-white">التالي <ArrowLeft size={18} /></button> : <button disabled={saving || !ageIsValid} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 font-black text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" /> : <Send size={18} />}{saving ? "جارٍ الإرسال..." : "إرسال الطلب"}</button>}</div>
    </div>
  </form>;
}
