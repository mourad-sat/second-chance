"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardPlus, Save, Target, TriangleAlert } from "lucide-react";

type SupportPlan = {
  id: string;
  difficulty: string;
  objective: string;
  intervention: string;
  responsibleName: string | null;
  priority: string;
  status: string;
  startDate: string | Date;
  reviewDate: string | Date | null;
  progressPercent: number;
  successIndicator: string | null;
  observations: string | null;
  outcome: string | null;
};

const statusLabels: Record<string, string> = {
  PLANNED: "مخططة",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتملة",
  SUSPENDED: "معلقة"
};

const priorityLabels: Record<string, string> = {
  LOW: "منخفضة",
  NORMAL: "عادية",
  HIGH: "مرتفعة",
  URGENT: "مستعجلة"
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  NORMAL: "bg-blue-50 text-blue-700",
  HIGH: "bg-amber-50 text-amber-700",
  URGENT: "bg-rose-50 text-rose-700"
};

const dateValue = (value: string | Date | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

export function AcademicSupportPlanManager({
  beneficiaryId,
  plans
}: {
  beneficiaryId: string;
  plans: SupportPlan[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setMessageType("");

    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/support-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر إنشاء خطة الدعم.");
      event.currentTarget.reset();
      setMessage("تم إنشاء خطة الدعم بنجاح.");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function updatePlan(event: FormEvent<HTMLFormElement>, planId: string) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setMessageType("");

    const payload = {
      planId,
      ...Object.fromEntries(new FormData(event.currentTarget).entries())
    };

    try {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/support-plans`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر تحديث خطة الدعم.");
      setMessage("تم تحديث خطة الدعم بنجاح.");
      setMessageType("success");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  const activePlans = plans.filter((plan) => ["PLANNED", "IN_PROGRESS"].includes(plan.status));
  const completedPlans = plans.filter((plan) => plan.status === "COMPLETED");
  const averageProgress = plans.length
    ? Math.round(plans.reduce((sum, plan) => sum + plan.progressPercent, 0) / plans.length)
    : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">الخطط النشيطة</p>
          <p className="mt-2 text-3xl font-bold">{activePlans.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">الخطط المكتملة</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{completedPlans.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">متوسط الإنجاز</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{averageProgress}%</p>
        </article>
      </section>

      <form onSubmit={createPlan} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-slate-100 bg-slate-50/70 p-5">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><ClipboardPlus size={21} /></div>
          <div>
            <h3 className="text-xl font-bold">إنشاء خطة دعم فردية</h3>
            <p className="mt-1 text-sm text-slate-500">حدد الصعوبة والهدف والتدخل ومؤشر النجاح والمسؤول عن التنفيذ.</p>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <label className="block"><span className="mb-2 block text-sm font-semibold">الصعوبة *</span><input required name="difficulty" placeholder="مثال: ضعف في القراءة والفهم" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50" /></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold">الهدف *</span><input required name="objective" placeholder="مثال: رفع الطلاقة القرائية" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50" /></label>
          <label className="block md:col-span-2"><span className="mb-2 block text-sm font-semibold">التدخل المقترح *</span><textarea required name="intervention" rows={3} placeholder="الأنشطة والإجراءات العملية" className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50" /></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold">المسؤول</span><input name="responsibleName" placeholder="اسم المؤطر أو المسؤول" className="w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold">مؤشر النجاح</span><input name="successIndicator" placeholder="مثال: قراءة نص بنسبة دقة 80%" className="w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold">الأولوية</span><select name="priority" defaultValue="NORMAL" className="w-full rounded-xl border border-slate-300 px-4 py-3"><option value="LOW">منخفضة</option><option value="NORMAL">عادية</option><option value="HIGH">مرتفعة</option><option value="URGENT">مستعجلة</option></select></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold">الحالة</span><select name="status" defaultValue="PLANNED" className="w-full rounded-xl border border-slate-300 px-4 py-3"><option value="PLANNED">مخططة</option><option value="IN_PROGRESS">قيد التنفيذ</option><option value="COMPLETED">مكتملة</option><option value="SUSPENDED">معلقة</option></select></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold">تاريخ البداية</span><input type="date" name="startDate" className="w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold">تاريخ المراجعة</span><input type="date" name="reviewDate" className="w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
        </div>
        <div className="border-t border-slate-100 p-5"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"><Save size={17} />{saving ? "جارٍ الحفظ..." : "إنشاء خطة الدعم"}</button></div>
      </form>

      {message && <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${messageType === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{messageType === "success" ? <CheckCircle2 size={18} /> : <TriangleAlert size={18} />}{message}</div>}

      <section className="space-y-4">
        {plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">لا توجد خطة دعم فردية بعد.</div>
        ) : plans.map((plan) => (
          <form key={plan.id} onSubmit={(event) => updatePlan(event, plan.id)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h4 className="text-lg font-bold">{plan.difficulty}</h4><span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles[plan.priority]}`}>{priorityLabels[plan.priority]}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{statusLabels[plan.status]}</span></div>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-2"><p><strong>الهدف:</strong> {plan.objective}</p><p><strong>المسؤول:</strong> {plan.responsibleName || "غير محدد"}</p><p className="md:col-span-2"><strong>التدخل:</strong> {plan.intervention}</p><p><strong>مؤشر النجاح:</strong> {plan.successIndicator || "غير محدد"}</p><p><strong>المراجعة:</strong> {plan.reviewDate ? new Date(plan.reviewDate).toLocaleDateString("ar-MA") : "غير محددة"}</p></div>
              </div>
              <div className="min-w-52"><div className="flex justify-between text-sm"><span>نسبة الإنجاز</span><strong>{plan.progressPercent}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${plan.progressPercent}%` }} /></div></div>
            </div>
            <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2 xl:grid-cols-5">
              <label><span className="mb-2 block text-xs font-semibold text-slate-500">الحالة</span><select name="status" defaultValue={plan.status} className="w-full rounded-xl border border-slate-300 px-3 py-2.5"><option value="PLANNED">مخططة</option><option value="IN_PROGRESS">قيد التنفيذ</option><option value="COMPLETED">مكتملة</option><option value="SUSPENDED">معلقة</option></select></label>
              <label><span className="mb-2 block text-xs font-semibold text-slate-500">الأولوية</span><select name="priority" defaultValue={plan.priority} className="w-full rounded-xl border border-slate-300 px-3 py-2.5"><option value="LOW">منخفضة</option><option value="NORMAL">عادية</option><option value="HIGH">مرتفعة</option><option value="URGENT">مستعجلة</option></select></label>
              <label><span className="mb-2 block text-xs font-semibold text-slate-500">الإنجاز %</span><input name="progressPercent" type="number" min="0" max="100" defaultValue={plan.progressPercent} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label><span className="mb-2 block text-xs font-semibold text-slate-500">تاريخ المراجعة</span><input name="reviewDate" type="date" defaultValue={dateValue(plan.reviewDate)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <div className="flex items-end"><button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} /> تحديث</button></div>
              <label className="md:col-span-2"><span className="mb-2 block text-xs font-semibold text-slate-500">ملاحظات التنفيذ</span><textarea name="observations" rows={2} defaultValue={plan.observations || ""} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
              <label className="md:col-span-2"><span className="mb-2 block text-xs font-semibold text-slate-500">النتيجة المحققة</span><textarea name="outcome" rows={2} defaultValue={plan.outcome || ""} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
            </div>
          </form>
        ))}
      </section>

      {activePlans.some((plan) => plan.priority === "URGENT") && <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900"><TriangleAlert className="mt-0.5" size={20} /><div><p className="font-bold">توجد خطة دعم مستعجلة</p><p className="mt-1 text-sm">ينبغي مراجعة التدخلات المستعجلة وتحديث نسبة الإنجاز بانتظام.</p></div></div>}
    </div>
  );
}
