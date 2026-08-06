"use client";

import { CalendarClock, Loader2, MapPin, UserRoundCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Appointment = {
  interviewDate: string;
  interviewerName: string;
  summary: string;
} | null;

function datetimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AdmissionAppointmentScheduler({ beneficiaryId, appointment }: {
  beneficiaryId: string;
  appointment: Appointment;
}) {
  const router = useRouter();
  const [interviewDate, setInterviewDate] = useState(datetimeLocal(appointment?.interviewDate));
  const [interviewerName, setInterviewerName] = useState(appointment?.interviewerName || "");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState(appointment?.summary || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function save() {
    if (!interviewDate) {
      setSuccess(false);
      setMessage("حدد تاريخ ووقت المقابلة.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admission-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beneficiaryId, interviewDate, interviewerName, location, note })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "تعذر حفظ الموعد.");
      setSuccess(true);
      setMessage(result.message);
      router.refresh();
    } catch (error) {
      setSuccess(false);
      setMessage(error instanceof Error ? error.message : "تعذر حفظ الموعد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="app-card p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><CalendarClock size={24} /></div>
          <div>
            <h2 className="text-xl font-black text-slate-950">موعد المقابلة أو الاختبار</h2>
            <p className="mt-1 text-sm text-slate-500">يظهر الموعد المحفوظ تلقائيًا للمترشح في صفحة تتبع الطلب.</p>
          </div>
        </div>
        {appointment?.interviewDate && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-black">الموعد الحالي</p>
            <p className="mt-1">{new Date(appointment.interviewDate).toLocaleString("ar-MA")}</p>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="field-label">التاريخ والوقت *
          <input type="datetime-local" value={interviewDate} onChange={(event) => setInterviewDate(event.target.value)} className="field-control mt-2" />
        </label>
        <label className="field-label">المسؤول
          <div className="relative mt-2"><UserRoundCog className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={interviewerName} onChange={(event) => setInterviewerName(event.target.value)} className="field-control pr-10" placeholder="اسم المكلف بالمقابلة" /></div>
        </label>
        <label className="field-label">المكان
          <div className="relative mt-2"><MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={location} onChange={(event) => setLocation(event.target.value)} className="field-control pr-10" placeholder="المركز أو القاعة" /></div>
        </label>
        <label className="field-label">ملاحظة
          <input value={note} onChange={(event) => setNote(event.target.value)} className="field-control mt-2" placeholder="تعليمات أو وثائق مطلوبة" />
        </label>
      </div>

      {message && <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message}</p>}
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={save} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="animate-spin" size={17} /> : <CalendarClock size={17} />}
          {saving ? "جارٍ الحفظ..." : appointment ? "تحديث الموعد" : "حفظ الموعد"}
        </button>
      </div>
    </section>
  );
}
