"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  GraduationCap,
  Loader2,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  UserRound
} from "lucide-react";

async function readResponse(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { message: text || "حدث خطأ غير متوقع." }; }
}

const trainingOptions = [
  "التصميم الغرافيكي والهوية البصرية",
  "صناعة المحتوى والتسويق الرقمي",
  "تصميم وتطوير المواقع الإلكترونية",
  "برمجة تطبيقات الهاتف",
  "الذكاء الاصطناعي وتطبيقاته المهنية",
  "الكهرباء المنزلية",
  "الطاقة الشمسية",
  "كاميرات المراقبة والشبكات",
  "الصيانة الإلكترونية للأجهزة الرقمية",
  "المساعد الاجتماعي",
  "التنشيط الثقافي والتربوي",
  "الاستقبال والإرشاد",
  "لم أحدد بعد"
];

const registrationGoals = [
  "العودة إلى التعليم النظامي",
  "الحصول على تكوين مهني",
  "اكتساب مهارات حياتية",
  "تعلم مهارات رقمية",
  "الحصول على فرصة عمل",
  "إنشاء مشروع خاص",
  "تطوير المستوى الدراسي",
  "تطوير الثقة بالنفس"
];

export function PublicRegistrationForm() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [applicationNumber, setApplicationNumber] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const photo = data.get("photo");

    if (!ageIsValid) {
      setError("التسجيل متاح فقط للمترشحين الذين تتراوح أعمارهم بين 14 و20 سنة.");
      return;
    }
    if (!(photo instanceof File) || !photo.size) {
      setError("يرجى إضافة صورة المترشح.");
      return;
    }
    if (photo.size > 2 * 1024 * 1024) {
      setError("حجم الصورة يجب ألا يتجاوز 2 ميغابايت.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/public-registration", { method: "POST", body: data });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.message || "تعذر إرسال الطلب.");
      setApplicationNumber(result.applicationNumber);
      setRegistrationDate(result.registrationDate);
      setCandidateName(result.candidateName);
      form.reset();
      setBirthDate("");
      setPhotoPreview("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إرسال الطلب.");
    } finally {
      setSaving(false);
    }
  }

  if (applicationNumber) {
    return (
      <div className="rounded-[2rem] border border-emerald-200 bg-white p-7 text-center shadow-xl shadow-slate-200/60 sm:p-10">
        <CheckCircle2 className="mx-auto text-emerald-600" size={60} />
        <h2 className="mt-5 text-2xl font-black text-slate-950">تم تسجيل الطلب بنجاح</h2>
        <p className="mt-2 font-bold text-slate-700">{candidateName}</p>
        <div className="mx-auto mt-7 grid max-w-xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-blue-950 p-5 text-white">
            <p className="text-xs text-blue-200">رقم التسجيل</p>
            <p className="mt-2 font-mono text-lg font-black tracking-wider">{applicationNumber}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-950">
            <p className="text-xs text-emerald-700">تاريخ التسجيل</p>
            <p className="mt-2 font-black">{new Date(registrationDate).toLocaleDateString("ar-MA")}</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-slate-500">تم إنشاء ملفك مباشرة داخل منصة تدبير الفرصة الثانية بحالة «مسجل قبليًا». احتفظ برقم التسجيل للمتابعة.</p>
        <button onClick={() => { setApplicationNumber(""); setRegistrationDate(""); setCandidateName(""); }} className="mt-7 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold hover:bg-slate-50">إرسال طلب آخر</button>
      </div>
    );
  }

  const input = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
  const section = "rounded-[1.7rem] border border-blue-100 bg-white p-5 shadow-sm sm:p-7";
  const sectionTitle = "mb-5 flex items-center gap-3 border-b border-slate-100 pb-4";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-[1.7rem] border border-blue-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          {["المعلومات الشخصية", "معلومات الاتصال", "المسار الدراسي", "المشروع والرغبات"].map((label, index) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-700 text-white">{index + 1}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      <section className={section}>
        <div className={sectionTitle}><UserRound className="text-blue-700" /><div><h2 className="text-xl font-black">1. المعلومات الشخصية</h2><p className="text-sm text-slate-500">هوية المترشح وصورته ورقم مسار</p></div></div>
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/50 text-center hover:border-blue-500">
            {photoPreview ? <img src={photoPreview} alt="معاينة صورة المترشح" className="h-64 w-full object-cover" /> : <><Camera size={42} className="text-blue-700" /><span className="mt-3 text-sm font-black">صورة المترشح *</span><span className="mt-1 px-3 text-xs text-slate-500">JPG أو PNG أو WEBP حتى 2MB</span></>}
            <input required name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => {
              const file = event.target.files?.[0];
              if (photoPreview) URL.revokeObjectURL(photoPreview);
              setPhotoPreview(file ? URL.createObjectURL(file) : "");
            }} />
          </label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">رقم مسار *<input required name="masarNumber" maxLength={30} className={input} placeholder="مثال: G123456789" /></label>
            <label className="text-sm font-bold text-slate-700">الجنس *<select required name="gender" className={input} defaultValue=""><option value="">اختر</option><option value="ذكر">ذكر</option><option value="أنثى">أنثى</option></select></label>
            <label className="text-sm font-bold text-slate-700">الاسم الشخصي *<input required name="firstName" maxLength={80} className={input} /></label>
            <label className="text-sm font-bold text-slate-700">الاسم العائلي *<input required name="lastName" maxLength={80} className={input} /></label>
            <label className="text-sm font-bold text-slate-700">تاريخ الازدياد *<input required name="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={input} /></label>
            <label className="text-sm font-bold text-slate-700">مكان الازدياد<input name="birthPlace" maxLength={120} className={input} /></label>
            <div className={`md:col-span-2 rounded-2xl border px-4 py-3 text-sm font-bold ${age === null ? "border-slate-200 bg-slate-50 text-slate-500" : ageIsValid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
              {age === null ? "سيُحسب العمر تلقائيًا بعد اختيار تاريخ الازدياد." : `العمر المحسوب: ${age} سنة — ${ageIsValid ? "مؤهل للتسجيل" : "العمر يجب أن يكون بين 14 و20 سنة"}`}
            </div>
          </div>
        </div>
      </section>

      <section className={section}>
        <div className={sectionTitle}><Phone className="text-blue-700" /><div><h2 className="text-xl font-black">2. معلومات الاتصال</h2><p className="text-sm text-slate-500">بيانات التواصل والإقامة</p></div></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">رقم الهاتف *<input required name="phone" inputMode="tel" maxLength={30} className={input} /></label>
          <label className="text-sm font-bold text-slate-700">هاتف ولي الأمر<input name="guardianPhone" inputMode="tel" maxLength={30} className={input} /></label>
          <label className="text-sm font-bold text-slate-700">البريد الإلكتروني<input name="email" type="email" maxLength={180} className={input} /></label>
          <label className="text-sm font-bold text-slate-700">اسم ولي الأمر<input name="guardianName" maxLength={120} className={input} /></label>
          <label className="text-sm font-bold text-slate-700">صلة القرابة<input name="guardianRelationship" maxLength={100} className={input} /></label>
          <label className="text-sm font-bold text-slate-700">الجماعة<input name="commune" maxLength={120} className={input} /></label>
          <label className="text-sm font-bold text-slate-700">الإقليم<input name="province" maxLength={120} className={input} /></label>
          <label className="text-sm font-bold text-slate-700 md:col-span-2">العنوان الكامل *<textarea required name="address" rows={2} maxLength={300} className={input} /></label>
        </div>
      </section>

      <section className={section}>
        <div className={sectionTitle}><GraduationCap className="text-blue-700" /><div><h2 className="text-xl font-black">3. المسار الدراسي</h2><p className="text-sm text-slate-500">المستوى الدراسي وظروف الانقطاع</p></div></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">آخر مستوى دراسي *<select required name="lastEducationLevel" className={input} defaultValue=""><option value="">اختر المستوى</option><option>ابتدائي</option><option>إعدادي</option><option>ثانوي تأهيلي</option><option>تكوين مهني</option><option>غير متمدرس</option><option>أخرى</option></select></label>
          <label className="text-sm font-bold text-slate-700">آخر مؤسسة دراسية<input name="lastSchoolName" maxLength={180} className={input} /></label>
          <label className="text-sm font-bold text-slate-700">سنة الانقطاع<input name="dropoutYear" type="number" min="1990" max={new Date().getFullYear()} className={input} /></label>
          <label className="text-sm font-bold text-slate-700">هل سبق الاستفادة من برنامج مشابه؟<select name="previousProgram" className={input} defaultValue=""><option value="">اختر</option><option value="لا">لا</option><option value="نعم">نعم</option></select></label>
          <label className="text-sm font-bold text-slate-700 md:col-span-2">سبب الانقطاع عن الدراسة *<textarea required name="dropoutReasons" rows={3} maxLength={800} className={input} /></label>
          <label className="text-sm font-bold text-slate-700 md:col-span-2">الصعوبات الدراسية أو التعلمية<textarea name="learningDifficulties" rows={2} maxLength={600} className={input} /></label>
        </div>
      </section>

      <section className={section}>
        <div className={sectionTitle}><BriefcaseBusiness className="text-blue-700" /><div><h2 className="text-xl font-black">4. المشروع الشخصي والرغبات والتوجهات</h2><p className="text-sm text-slate-500">أهداف الالتحاق، الرغبات المهنية والتطلعات</p></div></div>
        <div className="grid gap-5">
          <label className="text-sm font-bold text-slate-700">المشروع الشخصي للمترشح *<textarea required name="personalProject" rows={4} maxLength={1000} className={input} placeholder="اشرح ما الذي تريد تحقيقه في دراستك أو تكوينك أو حياتك المهنية..." /></label>
          <label className="text-sm font-bold text-slate-700">ماذا تنتظر من برنامج الفرصة الثانية؟<textarea name="programExpectation" rows={3} maxLength={800} className={input} /></label>

          <div>
            <p className="text-sm font-black text-slate-800">أهداف الالتحاق بالبرنامج</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {registrationGoals.map((goal) => <label key={goal} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold"><input type="checkbox" name="registrationGoals" value={goal} className="h-4 w-4 accent-blue-700" />{goal}</label>)}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((index) => <label key={index} className="text-sm font-bold text-slate-700">الرغبة {index === 1 ? "الأولى *" : index === 2 ? "الثانية" : "الثالثة"}<select required={index === 1} name={`careerChoice${index}`} className={input} defaultValue=""><option value="">{index === 1 ? "اختر المجال" : "اختياري"}</option>{trainingOptions.map((option) => <option key={option}>{option}</option>)}</select></label>)}
          </div>
          <label className="text-sm font-bold text-slate-700">لماذا اخترت هذه المجالات؟<textarea name="careerChoiceReason" rows={3} maxLength={800} className={input} /></label>
          <label className="text-sm font-bold text-slate-700">هل لديك خبرة أو هواية في أحد هذه المجالات؟<textarea name="priorExperience" rows={3} maxLength={800} className={input} /></label>
        </div>
      </section>

      <section className={section}>
        <div className={sectionTitle}><ShieldCheck className="text-emerald-700" /><div><h2 className="text-xl font-black">5. الإقرار وإرسال الطلب</h2><p className="text-sm text-slate-500">الموافقة النهائية قبل إنشاء الملف في المنصة</p></div></div>
        <div className="space-y-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950">
          <label className="flex items-start gap-3"><input required name="declaration" type="checkbox" className="mt-1 h-4 w-4 accent-emerald-700" /><span>أقر بأن جميع المعلومات المدخلة صحيحة ودقيقة.</span></label>
          <label className="flex items-start gap-3"><input required name="consent" type="checkbox" className="mt-1 h-4 w-4 accent-emerald-700" /><span>أوافق على معالجة بياناتي الشخصية لأغراض التسجيل والتوجيه داخل برنامج الفرصة الثانية.</span></label>
        </div>
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
        <button disabled={saving || !ageIsValid} className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-700 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? <Loader2 className="animate-spin" /> : <Send />}
          {saving ? "جارٍ إنشاء الملف..." : "إرسال الطلب وإنشاء ملف التسجيل"}
        </button>
      </section>

      <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs text-slate-300"><MapPin size={15} className="text-emerald-400" /> تُحفظ البيانات مباشرة داخل منصة تدبير برنامج الفرصة الثانية.</div>
    </form>
  );
}
