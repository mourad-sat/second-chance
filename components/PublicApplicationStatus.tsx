"use client";

import { FormEvent, useState } from "react";
import { CalendarClock, CheckCircle2, Circle, Clock3, FileText, Loader2, MapPin, Search, ShieldCheck } from "lucide-react";

type Result = {
  fullName: string;
  registrationNumber: string;
  registrationDate: string;
  status: string;
  updatedAt: string;
  appointment: { interviewDate: string; interviewerName: string | null; summary: string | null } | null;
  orientation: string | null;
  documentCount: number;
};

const statusMeta: Record<string, { label: string; message: string; tone: string; step: number }> = {
  PRE_REGISTERED: { label: "تم التسجيل القبلي", message: "تم استلام طلبكم بنجاح، وهو في انتظار المراجعة الأولية.", tone: "bg-blue-100 text-blue-800", step: 1 },
  UNDER_REVIEW: { label: "قيد دراسة الملف", message: "تعمل إدارة البرنامج حاليًا على مراجعة بياناتكم وملفكم.", tone: "bg-amber-100 text-amber-800", step: 2 },
  WAITLISTED: { label: "لائحة الانتظار", message: "تم إدراج طلبكم مؤقتًا في لائحة الانتظار، وسيتم التواصل معكم عند توفر مقعد.", tone: "bg-orange-100 text-orange-800", step: 3 },
  ACCEPTED: { label: "تم القبول", message: "تهانينا، تم قبول طلبكم مبدئيًا. ستتواصل الإدارة معكم لاستكمال الإجراءات.", tone: "bg-emerald-100 text-emerald-800", step: 4 },
  REJECTED: { label: "لم يتم القبول", message: "لم تتم الموافقة على الطلب في هذه المرحلة. يمكن التواصل مع إدارة البرنامج للاستفسار.", tone: "bg-red-100 text-red-800", step: 3 },
  ENROLLED: { label: "مسجل نهائيًا", message: "تم استكمال التسجيل النهائي وإدماجكم في البرنامج.", tone: "bg-emerald-100 text-emerald-800", step: 5 },
  WITHDRAWN: { label: "منسحب", message: "تم تسجيل انسحابكم من البرنامج.", tone: "bg-slate-200 text-slate-700", step: 5 },
  COMPLETED: { label: "أتم البرنامج", message: "تم تسجيل إتمامكم لمسار البرنامج بنجاح.", tone: "bg-violet-100 text-violet-800", step: 5 }
};

const steps = ["استلام الطلب", "مراجعة الملف", "قرار القبول", "استكمال التسجيل", "الالتحاق بالبرنامج"];

async function readResponse(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { message: text || "حدث خطأ غير متوقع." }; }
}

export function PublicApplicationStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/public-registration/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: form.get("registrationNumber"), masarNumber: form.get("masarNumber") })
      });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.message || "تعذر تحميل حالة الطلب.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل حالة الطلب.");
    } finally {
      setLoading(false);
    }
  }

  const meta = result ? (statusMeta[result.status] || statusMeta.PRE_REGISTERED) : null;

  return <div className="space-y-6">
    <form onSubmit={lookup} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-black text-slate-950">تتبع حالة الطلب</h2>
      <p className="mt-2 text-sm leading-7 text-slate-500">أدخل رقم التسجيل ورقم مسار كما وردا في استمارة التسجيل.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold text-slate-700">رقم التسجيل *<input required name="registrationNumber" placeholder="SC-2026-XXXXXXXX" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" /></label>
        <label className="text-sm font-bold text-slate-700">رقم مسار *<input required name="masarNumber" placeholder="G123456789" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" /></label>
      </div>
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
      <button disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 font-black text-white hover:bg-blue-900 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={19} /> : <Search size={19} />}{loading ? "جارٍ التحقق..." : "عرض حالة الطلب"}</button>
    </form>

    {result && meta && <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-slate-200/50">
      <div className="bg-slate-950 px-6 py-6 text-white sm:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-slate-300">المترشح</p><h2 className="mt-1 text-2xl font-black">{result.fullName}</h2><p className="mt-2 font-mono text-sm text-slate-300">{result.registrationNumber}</p></div><div className={`rounded-full px-5 py-3 text-sm font-black ${meta.tone}`}>{meta.label}</div></div></div>
      <div className="p-6 sm:p-8">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-7 text-blue-950">{meta.message}</div>

        {result.appointment && <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
          <div className="flex items-start gap-3"><CalendarClock className="mt-1 shrink-0 text-emerald-700" /><div><h3 className="font-black">موعد المقابلة أو الاختبار</h3><p className="mt-2 text-lg font-black">{new Date(result.appointment.interviewDate).toLocaleString("ar-MA")}</p>{result.appointment.interviewerName && <p className="mt-2 text-sm">المسؤول: {result.appointment.interviewerName}</p>}{result.appointment.summary && <p className="mt-2 flex items-start gap-2 text-sm leading-7"><MapPin className="mt-1 shrink-0" size={16} />{result.appointment.summary}</p>}</div></div>
        </div>}

        <div className="mt-8 grid gap-4 sm:grid-cols-5">{steps.map((step, index) => { const complete = index + 1 <= meta.step; return <div key={step} className="flex items-center gap-3 sm:flex-col sm:text-center">{complete ? <CheckCircle2 className="shrink-0 text-emerald-600" size={26} /> : <Circle className="shrink-0 text-slate-300" size={26} />}<span className={`text-sm font-bold ${complete ? "text-slate-900" : "text-slate-400"}`}>{step}</span></div>; })}</div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">تاريخ التسجيل</p><p className="mt-1 font-black text-slate-900">{new Date(result.registrationDate).toLocaleDateString("ar-MA")}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">آخر تحديث</p><p className="mt-1 font-black text-slate-900">{new Date(result.updatedAt).toLocaleDateString("ar-MA")}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">الوثائق المرفوعة</p><p className="mt-1 flex items-center gap-2 font-black text-slate-900"><FileText size={16} />{result.documentCount}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">التوجيه المقترح</p><p className="mt-1 font-black text-slate-900">{result.orientation || "لم يحدد بعد"}</p></div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-950"><ShieldCheck className="mt-1 shrink-0 text-emerald-700" size={20} /><p>هذه الصفحة مخصصة للاستعلام فقط. ستتواصل إدارة البرنامج معكم عبر رقم الهاتف المسجل عند الحاجة إلى إجراء إضافي.</p></div>
      </div>
    </section>}
  </div>;
}
