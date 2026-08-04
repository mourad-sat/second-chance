"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";

type WorkflowItem = {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  stageLabel: string;
  progress: number;
  groupName: string | null;
  nextOptions: { value: string; label: string }[];
};

export function WorkflowManager({ items }: { items: WorkflowItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = !normalized || `${item.firstName} ${item.lastName}`.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  async function submit(event: FormEvent<HTMLFormElement>, beneficiaryId: string) {
    event.preventDefault();
    setSavingId(beneficiaryId);
    setMessage("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beneficiaryId, ...payload })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر تحديث المسار.");
      setMessage(result.message);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_240px]">
        <label className="relative block">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم المستفيد..." className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-10 text-sm outline-none focus:border-blue-500" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
          <option value="ALL">جميع الوضعيات</option>
          <option value="PRE_REGISTERED">مسجل أوليًا</option>
          <option value="UNDER_REVIEW">قيد الدراسة</option>
          <option value="WAITLISTED">لائحة الانتظار</option>
          <option value="ACCEPTED">مقبول</option>
          <option value="ENROLLED">متمدرس</option>
          <option value="COMPLETED">أنهى البرنامج</option>
          <option value="REJECTED">مرفوض</option>
          <option value="WITHDRAWN">منسحب</option>
        </select>
      </section>

      {message && <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</p>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4">المستفيد</th>
                <th className="px-5 py-4">المرحلة الحالية</th>
                <th className="px-5 py-4">التقدم</th>
                <th className="px-5 py-4">المجموعة</th>
                <th className="px-5 py-4">الإجراء التالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="align-top hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <Link href={`/beneficiaries/${item.id}`} className="font-semibold text-slate-900 hover:text-blue-700">{item.firstName} {item.lastName}</Link>
                    <p className="mt-1 text-xs text-slate-500">{item.status}</p>
                  </td>
                  <td className="px-5 py-4 font-medium">{item.stageLabel}</td>
                  <td className="px-5 py-4">
                    <div className="w-44">
                      <div className="mb-1 flex justify-between text-xs text-slate-500"><span>المسار</span><span>{item.progress}%</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${item.progress}%` }} /></div>
                    </div>
                  </td>
                  <td className="px-5 py-4">{item.groupName || "غير مسند"}</td>
                  <td className="px-5 py-4">
                    {item.nextOptions.length ? (
                      <form onSubmit={(event) => submit(event, item.id)} className="flex min-w-[360px] gap-2">
                        <select required name="nextStatus" className="min-w-40 rounded-lg border border-slate-200 px-3 py-2 text-xs">
                          <option value="">اختر الانتقال</option>
                          {item.nextOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <input name="note" placeholder="ملاحظة اختيارية" className="min-w-40 rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                        <button disabled={savingId === item.id} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                          {savingId === item.id ? "جارٍ..." : <><ArrowLeft size={13} /> تنفيذ</>}
                        </button>
                      </form>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">لا انتقال متاح</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="p-8 text-center text-slate-500">لا توجد ملفات مطابقة.</p>}
      </section>
    </div>
  );
}
