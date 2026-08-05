"use client";

import { FormEvent, useMemo, useState } from "react";
import { BriefcaseBusiness, Camera, CheckCircle2, GraduationCap, Loader2, Phone, Send, UserRound } from "lucide-react";

async function readResponse(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { message: text || "حدث خطأ غير متوقع." }; }
}

const sections = [
  ["البيانات الشخصية", UserRound],
  ["معلومات الاتصال", Phone],
  ["المسار الدراسي", GraduationCap],
  ["المشروع والرغبات", BriefcaseBusiness]
] as const;

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const photo = data.get("photo");

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
        <h2 className="mt-5 text-2xl font-bold text-slate-950">تم تسجيل الطلب بنجاح</h2>
        <p className="mt-2 font-semibold text-slate-700">{candidateName}</p>
        <div className="mx-auto mt-6 grid max-w-lg gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs text-slate-300">رقم التسجيل</p>
            <p className="mt-2 font-mono text-lg font-bold tracking-wider">{applicationNumber}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4 text-slate-900">
            <p className="text-xs text-slate-500">تاريخ التسجيل</p>
            <p className="mt-2 font-bold">{new Date(registrationDate).toLocaleDateString("ar-MA")}</p>
          </div>
        </div>
        <p className="mt-5 text-sm text-slate-500">احتفظ برقم التسجيل. ستتواصل معك إدارة البرنامج بعد مراجعة الطلب.</p>
        <button onClick={() => { setApplicationNumber(""); setRegistrationDate(""); setCandidateName(""); setPhotoPreview(""); }} className="mt-6 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50">إرسال طلب آخر</button>
      </div>
    );
  }

  const input = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  const sectionTitle = "mb-5 flex items-center gap-3 border-b border-slate-100 pb-4";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {sections.map(([label, Icon], index) => (
          <div key={label} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600 text-white">{index + 1}</span>
            <Icon size={16} className="text-blue-600" /><span>{label}</span>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className={sectionTitle}><UserRound className="text-blue-600" /><div><h2 className="text-xl font-bold">1. البيانات الشخصية</h2><p className="text-sm text-slate-500">هوية المترشح وصورته</p></div></div>
        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          <label className="group flex min-h-56 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-blue-400 hover:bg-blue-50">
            {photoPreview ? <img src={photoPreview} alt="معاينة صورة المترشح" className="h-56 w-full object-cover" /> : <><Camera size={38} className="text-blue-600" /><span className="mt-3 text-sm font-bold text-slate-700">صورة المترشح *</span><span className="mt-1 px-3 text-xs text-slate-500">JPG أو PNG أو WEBP، حتى 2MB</span></>}
            <input required name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => {
              const file = event.target.files?.[0];
              if (photoPreview) URL.revokeObjectURL(photoPreview);
              setPhotoPreview(file ? URL.createObjectURL(file) : "");
            }} />
          </label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">الاسم الشخصي *<input required name="firstName" maxLength={80} className={input} /></label>
            <label className="text-sm font-semibold text-slate-700">الاسم العائلي *<input required name="lastName" maxLength={80} className={input} /></label>
            <label className="text-sm font-semibold text-slate-700">تاريخ الازدياد *<input required name="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={input} /></label>
            <label className="text-sm font-semibold text-slate-700">السن المحسوب<input readOnly value={age === null ? "" : `${age} سنة`} className={`${input} bg-slate-50`} /></label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">رقم مسار<input name="masarNumber" maxLength={30} className={input} placeholder="مثال: G123456789" /></label>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className={sectionTitle}><Phone className="text-blue-600" /><div><h2 className="text-xl font-bold">2. معلومات الاتصال</h2><p className="text-sm text-slate-500">بيانات التواصل وولي الأمر</p></div></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">رقم الهاتف *<input required name="phone" inputMode="tel" maxLength={30} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">هاتف ولي الأمر<input name="guardianPhone" inputMode="tel" maxLength={30} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">اسم ولي الأمر<input name="guardianName" maxLength={120} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">صلة القرابة<input name="guardianRelationship" maxLength={100} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">العنوان الكامل *<textarea required name="address" rows={2} maxLength={300} className={input} /></label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className={sectionTitle}><GraduationCap className="text-blue-600" /><div><h2 className="text-xl font-bold">3. المسار الدراسي</h2><p className="text-sm text-slate-500">المستوى الدراسي وظروف الانقطاع</p></div></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">آخر مستوى دراسي *<select required name="lastEducationLevel" className={input} defaultValue=""><option value="">اختر المستوى</option><option>لم يلتحق بالمدرسة</option><option>ابتدائي</option><option>إعدادي</option><option>ثانوي تأهيلي</option><option>تكوين مهني</option><option>أخرى</option></select></label>
          <label className="text-sm font-semibold text-slate-700">آخر مؤسسة دراسية<input name="lastSchoolName" maxLength={180} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">سنة الانقطاع<input name="dropoutYear" type="number" min="1990" max={new Date().getFullYear()} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">هل سبق الاستفادة من برنامج مشابه؟<select name="previousProgram" className={input} defaultValue=""><option value="">اختر</option><option value="لا">لا</option><option value="نعم">نعم</option></select></label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">أسباب الانقطاع عن الدراسة *<textarea required name="dropoutReasons" rows={3} maxLength={800} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">الصعوبات الدراسية أو التعلمية<textarea name="learningDifficulties" rows={2} maxLength={600} className={input} /></label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className={sectionTitle}><BriefcaseBusiness className="text-blue-600" /><div><h2 className="text-xl font-bold">4. المشروع الشخصي ورغبة المترشح</h2><p className="text-sm text-slate-500">ما الذي يطمح إليه المترشح من البرنامج؟</p></div></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">الرغبة المهنية الأولى *<select required name="careerChoice1" className={input} defaultValue=""><option value="">اختر المجال</option><option>التصميم الغرافيكي والصناعات الرقمية</option><option>صناعة المحتوى وإدارة الصفحات</option><option>التنشيط السوسيوثقافي</option><option>الخدمات الاجتماعية والاستقبال</option><option>صيانة الهواتف والحواسيب</option><option>الكهرباء والصيانة المنزلية</option><option>الفلاحة والاقتصاد الأخضر</option><option>أخرى</option></select></label>
          <label className="text-sm font-semibold text-slate-700">الرغبة المهنية الثانية<select name="careerChoice2" className={input} defaultValue=""><option value="">اختياري</option><option>التصميم الغرافيكي والصناعات الرقمية</option><option>صناعة المحتوى وإدارة الصفحات</option><option>التنشيط السوسيوثقافي</option><option>الخدمات الاجتماعية والاستقبال</option><option>صيانة الهواتف والحواسيب</option><option>الكهرباء والصيانة المنزلية</option><option>الفلاحة والاقتصاد الأخضر</option><option>أخرى</option></select></label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">المشروع الشخصي للمترشح *<textarea required name="personalProject" rows={4} maxLength={1000} className={input} placeholder="اشرح ما الذي تريد تحقيقه في دراستك أو تكوينك أو حياتك المهنية..." /></label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">ما الذي تنتظره من برنامج الفرصة الثانية؟<textarea name="programExpectation" rows={3} maxLength={800} className={input} placeholder="مثال: العودة إلى الدراسة، تعلم مهنة، الحصول على تدريب، تطوير المهارات..." /></label>
        </div>
      </section>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700 shadow-sm">
        <input required name="consent" type="checkbox" className="mt-1 h-4 w-4" />
        أوافق على استعمال هذه المعلومات والصورة لدراسة طلب الاستفادة من برنامج الفرصة الثانية والتواصل معي بخصوصه.
      </label>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {saving ? <><Loader2 className="animate-spin" size={18} /> جارٍ تسجيل الطلب...</> : <><Send size={18} /> إرسال طلب التسجيل القبلي</>}
      </button>
    </form>
  );
}
