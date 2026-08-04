"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type InternshipItem = {
  id: string;
  organizationName: string;
  field: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  supervisorEvaluation: string | null;
  finalResult: string | null;
  attendanceNotes: string | null;
  beneficiary: { id: string; firstName: string; lastName: string };
};

const statusLabels: Record<string, string> = {
  PLANNED: "مبرمج",
  ACTIVE: "جارٍ",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى"
};

export function IntegrationManager({ internships }: { internships: InternshipItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<InternshipItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setMessage("");

    const payload = { id: selected.id, ...Object.fromEntries(new FormData(event.currentTarget).entries()) };
    const response = await fetch("/api/integration", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message || "تعذر الحفظ.");
      setSaving(false);
      return;
    }

    setMessage("تم تحديث ملف الإدماج بنجاح.");
    setSelected(null);
    setSaving(false);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h3 className="text-xl font-bold text-slate-900">تتبع التداريب والنتائج المهنية</h3>
        <p className="mt-1 text-sm text-slate-500">تحديث الوضعية، تقييم المؤسسة، والنتيجة النهائية لكل مستفيد.</p>
      </div>

      {message && <p className="m-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

      {internships.length === 0 ? (
        <p className="p-10 text-center text-slate-500">لا توجد تداريب مهنية مسجلة بعد.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4">المستفيد</th>
                <th className="px-5 py-4">المؤسسة</th>
                <th className="px-5 py-4">المجال</th>
                <th className="px-5 py-4">الوضعية</th>
                <th className="px-5 py-4">تاريخ البداية</th>
                <th className="px-5 py-4">النتيجة</th>
                <th className="px-5 py-4">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {internships.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-slate-800">{item.beneficiary.firstName} {item.beneficiary.lastName}</td>
                  <td className="px-5 py-4">{item.organizationName}</td>
                  <td className="px-5 py-4">{item.field || "—"}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{statusLabels[item.status] || item.status}</span></td>
                  <td className="px-5 py-4">{new Date(item.startDate).toLocaleDateString("ar-MA")}</td>
                  <td className="max-w-64 px-5 py-4 text-slate-600">{item.finalResult || "لم تسجل بعد"}</td>
                  <td className="px-5 py-4"><button onClick={() => setSelected(item)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">تحديث</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="border-t border-slate-200 bg-slate-50 p-5">
          <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div><h4 className="font-bold text-slate-900">تحديث تدريب {selected.beneficiary.firstName} {selected.beneficiary.lastName}</h4><p className="mt-1 text-sm text-slate-500">{selected.organizationName}</p></div>
              <button type="button" onClick={() => setSelected(null)} className="text-sm font-semibold text-slate-500">إغلاق</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label><span className="mb-2 block text-sm font-medium">الوضعية</span><select name="status" defaultValue={selected.status} className="w-full rounded-xl border px-4 py-3"><option value="PLANNED">مبرمج</option><option value="ACTIVE">جارٍ</option><option value="COMPLETED">مكتمل</option><option value="CANCELLED">ملغى</option></select></label>
              <label><span className="mb-2 block text-sm font-medium">تاريخ النهاية</span><input name="endDate" type="date" defaultValue={selected.endDate ? selected.endDate.slice(0, 10) : ""} className="w-full rounded-xl border px-4 py-3" /></label>
              <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium">تقييم المؤسسة</span><textarea name="supervisorEvaluation" defaultValue={selected.supervisorEvaluation || ""} rows={2} className="w-full rounded-xl border px-4 py-3" /></label>
              <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium">ملاحظات المواظبة</span><textarea name="attendanceNotes" defaultValue={selected.attendanceNotes || ""} rows={2} className="w-full rounded-xl border px-4 py-3" /></label>
              <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium">النتيجة النهائية</span><textarea name="finalResult" defaultValue={selected.finalResult || ""} rows={2} placeholder="مثال: عرض عمل، تمديد التدريب، توجيه إلى فرصة أخرى..." className="w-full rounded-xl border px-4 py-3" /></label>
            </div>
            <div className="mt-5 flex justify-end"><button disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white disabled:opacity-60">{saving ? "جارٍ الحفظ..." : "حفظ التحديث"}</button></div>
          </form>
        </div>
      )}
    </section>
  );
}
