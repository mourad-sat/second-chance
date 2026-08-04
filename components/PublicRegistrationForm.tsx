"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Send, UserRound, Phone, GraduationCap, Home, HeartHandshake, BriefcaseBusiness } from "lucide-react";

async function readResponse(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { message: text || "حدث خطأ غير متوقع." }; }
}

const sections = [
  ["البيانات الشخصية", UserRound],
  ["معلومات الاتصال", Phone],
  ["المسار الدراسي", GraduationCap],
  ["الوضعية الاجتماعية", Home],
  ["الاحتياجات والدعم", HeartHandshake],
  ["الميول المهنية", BriefcaseBusiness]
] as const;

export function PublicRegistrationForm() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [applicationNumber, setApplicationNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");

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
        <h2 className="mt-5 text-2xl font-bold text-slate-950">تم إرسال طلبك بنجاح</h2>
        <p className="mt-3 text-slate-600">احتفظ برقم الطلب التالي للاستفسار والمتابعة:</p>
        <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-slate-950 px-5 py-4 font-mono text-xl font-bold tracking-wider text-white">{applicationNumber}</div>
        <p className="mt-4 text-sm text-slate-500">ستتواصل معك إدارة البرنامج بعد مراجعة المعلومات.</p>
        <button onClick={() => setApplicationNumber("")} className="mt-6 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50">إرسال طلب آخر</button>
      </div>
    );
  }

  const input = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  const sectionTitle = "mb-5 flex items-center gap-3 border-b border-slate-100 pb-4";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
        {sections.map(([label, Icon], index) => (
          <div key={label} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600 text-white">{index + 1}</span>
            <Icon size={16} className="text-blue-600" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className={sectionTitle}><UserRound className="text-blue-600" /><div><h2 className="text-xl font-bold">1. البيانات الشخصية</h2><p className="text-sm text-slate-500">المعلومات الأساسية لصاحب الطلب</p></div></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">الاسم الشخصي *<input required name="firstName" maxLength={80} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">الاسم العائلي *<input required name="lastName" maxLength={80} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">تاريخ الازدياد *<input required name="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">السن المحسوب<input readOnly value={age === null ? "" : `${age} سنة`} className={`${input} bg-slate-50`} /></label>
          <label className="text-sm font-semibold text-slate-700">رقم البطاقة الوطنية<input name="identityNumber" maxLength={50} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">الحالة العائلية<select name="familySituation" className={input} defaultValue=""><option value="">اختر</option><option>أعزب/عزباء</option><option>متزوج/متزوجة</option><option>مطلق/مطلقة</option><option>أرمل/أرملة</option></select></label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className={sectionTitle}><Phone className="text-blue-600" /><div><h2 className="text-xl font-bold">2. معلومات الاتصال</h2><p className="text-sm text-slate-500">بيانات التواصل والإقامة</p></div></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">رقم الهاتف *<input required name="phone" inputMode="tel" maxLength={30} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">هاتف ولي الأمر<input name="guardianPhone" inputMode="tel" maxLength={30} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">اسم ولي الأمر<input name="guardianName" maxLength={120} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">صلة القرابة<input name="guardianRelationship" maxLength={100} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">العنوان الكامل *<textarea required name="address" rows={2} maxLength={300} className={input} /></label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className={sectionTitle}><GraduationCap className="text-blue-600" /><div><h2 className="text-xl font-bold">3. المسار الدراسي</h2><p className="text-sm text-slate-500">الوضع الدراسي وأسباب الانقطاع</p></div></div>
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
        <div className={sectionTitle}><Home className="text-blue-600" /><div><h2 className="text-xl font-bold">4. الوضعية الاجتماعية</h2><p className="text-sm text-slate-500">معلومات تساعد على تحديد نوع المواكبة</p></div></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">عدد أفراد الأسرة<input name="householdSize" type="number" min="1" max="30" className={input} /></label>
          <label className="text-sm font-semibold text-slate-700">وضعية دخل الأسرة<select name="familyIncomeSituation" className={input} defaultValue=""><option value="">اختر</option><option>بدون دخل قار</option><option>دخل ضعيف</option><option>دخل متوسط</option><option>دخل جيد</option></select></label>
          <label className="text-sm font-semibold text-slate-700">وضعية السكن<select name="housingSituation" className={input} defaultValue=""><option value="">اختر</option><option>ملك</option><option>كراء</option><option>سكن عائلي</option><option>سكن غير لائق</option><option>أخرى</option></select></label>
          <label className="text-sm font-semibold text-slate-700">التغطية الصحية<select name="socialCoverage" className={input} defaultValue=""><option value="">اختر</option><option>لا توجد</option><option>AMO</option><option>CNSS</option><option>تغطية أخرى</option></select></label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className={sectionTitle}><HeartHandshake className="text-blue-600" /><div><h2 className="text-xl font-bold">5. الاحتياجات والدعم</h2><p className="text-sm text-slate-500">احتياجات صحية أو تربوية أو اجتماعية خاصة</p></div></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">احتياجات خاصة أو وضعية إعاقة<textarea name="specialNeeds" rows={2} maxLength={600} className={input} /></label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">الدعم الذي يحتاجه المستفيد<textarea name="priorityNeeds" rows={3} maxLength={800} className={input} placeholder="مثال: دعم تربوي، مواكبة نفسية، نقل، أدوات مدرسية..." /></label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className={sectionTitle}><BriefcaseBusiness className="text-blue-600" /><div><h2 className="text-xl font-bold">6. الميول والمشروع المهني</h2><p className="text-sm text-slate-500">المجالات التي يرغب فيها صاحب الطلب</p></div></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">الرغبة المهنية الأولى *<select required name="careerChoice1" className={input} defaultValue=""><option value="">اختر المجال</option><option>التصميم الغرافيكي والصناعات الرقمية</option><option>صناعة المحتوى وإدارة الصفحات</option><option>التنشيط السوسيوثقافي</option><option>الخدمات الاجتماعية والاستقبال</option><option>صيانة الهواتف والحواسيب</option><option>الكهرباء والصيانة المنزلية</option><option>الفلاحة والاقتصاد الأخضر</option><option>أخرى</option></select></label>
          <label className="text-sm font-semibold text-slate-700">الرغبة المهنية الثانية<select name="careerChoice2" className={input} defaultValue=""><option value="">اختياري</option><option>التصميم الغرافيكي والصناعات الرقمية</option><option>صناعة المحتوى وإدارة الصفحات</option><option>التنشيط السوسيوثقافي</option><option>الخدمات الاجتماعية والاستقبال</option><option>صيانة الهواتف والحواسيب</option><option>الكهرباء والصيانة المنزلية</option><option>الفلاحة والاقتصاد الأخضر</option><option>أخرى</option></select></label>
          <label className="text-sm font-semibold text-slate-700 md:col-span-2">صف مشروعك أو هدفك المهني<textarea name="careerGoal" rows={3} maxLength={600} className={input} /></label>
        </div>
      </section>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
        <label className="flex items-start gap-3 text-sm leading-7 text-slate-700">
          <input required name="consent" type="checkbox" className="mt-1 h-5 w-5" />
          <span>أصرح بأن المعلومات المدخلة صحيحة، وأوافق على استعمالها لدراسة طلبي والتواصل معي في إطار برنامج الفرصة الثانية، وفق قواعد حماية المعطيات الشخصية.</span>
        </label>
      </section>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-60">
        {saving ? <><Loader2 className="animate-spin" size={18} /> جارٍ إرسال الطلب...</> : <><Send size={18} /> إرسال طلب التسجيل القبلي الكامل</>}
      </button>
    </form>
  );
}
