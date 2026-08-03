"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Data = {
  programs: any[];
  beneficiaries: any[];
  evaluations: any[];
  projects: any[];
  internships: any[];
};

const initial: Data = { programs: [], beneficiaries: [], evaluations: [], projects: [], internships: [] };

export function VocationalTrainingManager() {
  const router = useRouter();
  const [data, setData] = useState<Data>(initial);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/vocational-training", { cache: "no-store" });
    setData(await response.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault();
    setMessage("");
    const form = event.currentTarget;
    const payload = { action, ...Object.fromEntries(new FormData(form).entries()) };
    const response = await fetch("/api/vocational-training", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) return setMessage(result.message || "تعذر الحفظ.");
    form.reset();
    setMessage("تم الحفظ بنجاح.");
    await load();
    router.refresh();
  }

  const competencies = data.programs.flatMap((p) => p.competencies.map((c: any) => ({ ...c, program: p })));

  return (
    <div className="space-y-8">
      {message && <p className="rounded-xl bg-slate-100 px-4 py-3">{message}</p>}

      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={(e) => submit(e, "program")} className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold">إضافة وحدة تكوين مهني</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="track" required placeholder="المسار" className="rounded-xl border px-4 py-3" />
            <input name="specialty" required placeholder="الشعبة" className="rounded-xl border px-4 py-3" />
            <input name="moduleName" required placeholder="اسم الوحدة" className="rounded-xl border px-4 py-3" />
            <input name="totalHours" type="number" min="0" placeholder="الغلاف الزمني" className="rounded-xl border px-4 py-3" />
            <textarea name="description" placeholder="وصف الوحدة" className="rounded-xl border px-4 py-3 md:col-span-2" />
          </div>
          <button className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-white">حفظ الوحدة</button>
        </form>

        <form onSubmit={(e) => submit(e, "competency")} className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold">إضافة كفاية مهنية</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <select name="programId" required className="rounded-xl border px-4 py-3 md:col-span-2">
              <option value="">اختر الوحدة</option>
              {data.programs.map((p) => <option key={p.id} value={p.id}>{p.track} — {p.specialty} — {p.moduleName}</option>)}
            </select>
            <input name="code" placeholder="رمز الكفاية" className="rounded-xl border px-4 py-3" />
            <input name="title" required placeholder="عنوان الكفاية" className="rounded-xl border px-4 py-3" />
            <select name="targetLevel" className="rounded-xl border px-4 py-3">
              <option value="COMPETENT">متقن</option><option value="ADVANCED">متقدم</option><option value="DEVELOPING">في طور التطور</option>
            </select>
            <textarea name="description" placeholder="الوصف ومعايير الإنجاز" className="rounded-xl border px-4 py-3 md:col-span-2" />
          </div>
          <button className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-white">حفظ الكفاية</button>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={(e) => submit(e, "workshop")} className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold">تسجيل ورشة تطبيقية</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <select name="programId" required className="rounded-xl border px-4 py-3 md:col-span-2"><option value="">اختر الوحدة</option>{data.programs.map((p) => <option key={p.id} value={p.id}>{p.moduleName}</option>)}</select>
            <input name="title" required placeholder="عنوان الورشة" className="rounded-xl border px-4 py-3" />
            <input name="sessionDate" required type="date" className="rounded-xl border px-4 py-3" />
            <input name="trainerName" placeholder="المكون" className="rounded-xl border px-4 py-3" />
            <input name="durationHours" type="number" step="0.5" placeholder="عدد الساعات" className="rounded-xl border px-4 py-3" />
            <input name="location" placeholder="المكان" className="rounded-xl border px-4 py-3" />
            <textarea name="activities" placeholder="الأنشطة المنجزة" className="rounded-xl border px-4 py-3 md:col-span-2" />
          </div>
          <button className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-white">حفظ الورشة</button>
        </form>

        <form onSubmit={(e) => submit(e, "evaluation")} className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold">تقييم مهارة مستفيد</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <select name="beneficiaryId" required className="rounded-xl border px-4 py-3"><option value="">المستفيد</option>{data.beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.firstName} {b.lastName}</option>)}</select>
            <select name="competencyId" required className="rounded-xl border px-4 py-3"><option value="">الكفاية</option>{competencies.map((c) => <option key={c.id} value={c.id}>{c.program.moduleName} — {c.title}</option>)}</select>
            <input name="evaluationDate" required type="date" className="rounded-xl border px-4 py-3" />
            <select name="level" className="rounded-xl border px-4 py-3"><option value="BEGINNER">مبتدئ</option><option value="DEVELOPING">في طور التطور</option><option value="COMPETENT">متقن</option><option value="ADVANCED">متقدم</option></select>
            <input name="score" type="number" step="0.1" placeholder="النقطة" className="rounded-xl border px-4 py-3" />
            <input name="evaluatorName" placeholder="المقيّم" className="rounded-xl border px-4 py-3" />
            <textarea name="evidence" placeholder="دليل الإنجاز" className="rounded-xl border px-4 py-3 md:col-span-2" />
          </div>
          <button className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-white">حفظ التقييم</button>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={(e) => submit(e, "project")} className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold">مشروع مهني</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <select name="beneficiaryId" required className="rounded-xl border px-4 py-3"><option value="">المستفيد</option>{data.beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.firstName} {b.lastName}</option>)}</select>
            <input name="title" required placeholder="عنوان المشروع" className="rounded-xl border px-4 py-3" />
            <select name="status" className="rounded-xl border px-4 py-3"><option value="IDEA">فكرة</option><option value="PLANNING">تخطيط</option><option value="IN_PROGRESS">قيد الإنجاز</option><option value="COMPLETED">مكتمل</option></select>
            <input name="progressPercent" type="number" min="0" max="100" placeholder="نسبة التقدم" className="rounded-xl border px-4 py-3" />
            <input name="mentorName" placeholder="المؤطر" className="rounded-xl border px-4 py-3" />
            <input name="startDate" type="date" className="rounded-xl border px-4 py-3" />
            <textarea name="description" placeholder="وصف المشروع" className="rounded-xl border px-4 py-3 md:col-span-2" />
          </div>
          <button className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-white">حفظ المشروع</button>
        </form>

        <form onSubmit={(e) => submit(e, "internship")} className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold">تدريب ميداني</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <select name="beneficiaryId" required className="rounded-xl border px-4 py-3"><option value="">المستفيد</option>{data.beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.firstName} {b.lastName}</option>)}</select>
            <input name="organizationName" required placeholder="المؤسسة المستقبلة" className="rounded-xl border px-4 py-3" />
            <input name="field" placeholder="مجال التدريب" className="rounded-xl border px-4 py-3" />
            <input name="supervisorName" placeholder="المشرف" className="rounded-xl border px-4 py-3" />
            <input name="startDate" required type="date" className="rounded-xl border px-4 py-3" />
            <input name="endDate" type="date" className="rounded-xl border px-4 py-3" />
            <select name="status" className="rounded-xl border px-4 py-3"><option value="PLANNED">مبرمج</option><option value="ACTIVE">جارٍ</option><option value="COMPLETED">مكتمل</option><option value="CANCELLED">ملغى</option></select>
            <textarea name="objectives" placeholder="أهداف التدريب" className="rounded-xl border px-4 py-3 md:col-span-2" />
          </div>
          <button className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-white">حفظ التدريب</button>
        </form>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xl font-bold">ملخص التكوين المهني</h3>
        {loading ? <p>جارٍ التحميل...</p> : <div className="grid gap-4 md:grid-cols-4">
          <article className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">الوحدات</p><p className="text-2xl font-bold">{data.programs.length}</p></article>
          <article className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">تقييمات المهارات</p><p className="text-2xl font-bold">{data.evaluations.length}</p></article>
          <article className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">المشاريع المهنية</p><p className="text-2xl font-bold">{data.projects.length}</p></article>
          <article className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">التداريب</p><p className="text-2xl font-bold">{data.internships.length}</p></article>
        </div>}
      </section>
    </div>
  );
}
