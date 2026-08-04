"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

export function VocationalProgramForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setIsError(false);

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/vocational-programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر الحفظ.");

      form.reset();
      setMessage("تمت إضافة الوحدة التكوينية بنجاح.");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><PlusCircle size={21} /></div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">إضافة وحدة تكوينية</h3>
          <p className="mt-1 text-sm text-slate-500">أنشئ وحدة داخل مسلك وشعبة مهنية مع تحديد الحجم الزمني.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-700">المنظومة أو المسلك</span>
          <input required name="track" placeholder="مثال: الصناعات الإبداعية والرقمية" className={inputClass} />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-700">الشعبة</span>
          <input required name="specialty" placeholder="مثال: تصميم وتطوير المواقع" className={inputClass} />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-700">اسم الوحدة</span>
          <input required name="moduleName" placeholder="مثال: أساسيات HTML وCSS" className={inputClass} />
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-700">عدد الساعات</span>
          <input type="number" min="1" step="1" name="totalHours" placeholder="30" className={inputClass} />
        </label>
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-700">وصف الوحدة</span>
          <textarea name="description" rows={3} placeholder="الأهداف والمحتويات الأساسية للوحدة..." className={inputClass} />
        </label>
      </div>

      {message && (
        <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message}
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <button disabled={saving} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "جارٍ الحفظ..." : "حفظ الوحدة التكوينية"}
        </button>
      </div>
    </form>
  );
}
