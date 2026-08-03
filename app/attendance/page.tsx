"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";

type Beneficiary = { id: string; firstName: string; lastName: string };
type Enrollment = { beneficiary: Beneficiary };
type Group = { id: string; name: string; academicYear: string; enrollments: Enrollment[] };
type Attendance = {
  id: string;
  date: string;
  status: string;
  beneficiary: Beneficiary;
  group: { name: string };
};

const statusLabels: Record<string, string> = {
  PRESENT: "حاضر",
  ABSENT: "غائب",
  LATE: "متأخر",
  EXCUSED: "غياب مبرر"
};

export default function AttendancePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    const response = await fetch("/api/attendance", { cache: "no-store" });
    const data = await response.json();
    setGroups(data.groups || []);
    setBeneficiaries(data.beneficiaries || []);
    setRecords(data.recentAttendance || []);
    if (!selectedGroup && data.groups?.[0]) setSelectedGroup(data.groups[0].id);
  }

  useEffect(() => { loadData(); }, []);

  const currentGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroup),
    [groups, selectedGroup]
  );

  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault();
    setMessage("");
    const payload = { action, ...Object.fromEntries(new FormData(event.currentTarget).entries()) };
    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    setMessage(response.ok ? "تم حفظ العملية بنجاح." : result.message || "تعذر الحفظ.");
    if (response.ok) {
      event.currentTarget.reset();
      await loadData();
    }
  }

  return (
    <AppShell>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">الحضور والغياب</h2>
        <p className="mt-2 text-slate-600">تدبير المجموعات وتسجيل المواظبة اليومية</p>
      </header>

      {message && <p className="mb-5 rounded-xl bg-slate-100 px-4 py-3">{message}</p>}

      <section className="mb-6 grid gap-6 xl:grid-cols-2">
        <form onSubmit={(e) => submit(e, "createGroup")} className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-semibold">إنشاء مجموعة</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="name" required placeholder="اسم المجموعة" className="rounded-xl border px-4 py-3" />
            <input name="academicYear" required placeholder="الموسم الدراسي 2026/2027" className="rounded-xl border px-4 py-3" />
            <input name="track" placeholder="المسار" className="rounded-xl border px-4 py-3" />
            <input name="specialty" placeholder="الشعبة" className="rounded-xl border px-4 py-3" />
            <input name="room" placeholder="القاعة" className="rounded-xl border px-4 py-3" />
            <input name="facilitator" placeholder="المنشط أو المكون" className="rounded-xl border px-4 py-3" />
          </div>
          <button className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-white">حفظ المجموعة</button>
        </form>

        <form onSubmit={(e) => submit(e, "enroll")} className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-semibold">إسناد مستفيد إلى مجموعة</h3>
          <div className="grid gap-4">
            <select name="groupId" required className="rounded-xl border px-4 py-3">
              <option value="">اختر المجموعة</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name} — {g.academicYear}</option>)}
            </select>
            <select name="beneficiaryId" required className="rounded-xl border px-4 py-3">
              <option value="">اختر المستفيد</option>
              {beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.firstName} {b.lastName}</option>)}
            </select>
          </div>
          <button className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-white">إسناد المستفيد</button>
        </form>
      </section>

      <section className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold">تسجيل الحضور اليومي</h3>
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="rounded-xl border px-4 py-3">
            <option value="">اختر المجموعة</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {!currentGroup?.enrollments.length ? (
          <p className="text-slate-500">لا يوجد مستفيدون مسندون إلى هذه المجموعة.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {currentGroup.enrollments.map(({ beneficiary }) => (
              <form key={beneficiary.id} onSubmit={(e) => submit(e, "record")} className="rounded-xl border p-4">
                <input type="hidden" name="groupId" value={currentGroup.id} />
                <input type="hidden" name="beneficiaryId" value={beneficiary.id} />
                <p className="mb-3 font-semibold">{beneficiary.firstName} {beneficiary.lastName}</p>
                <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="mb-3 w-full rounded-lg border px-3 py-2" />
                <select name="status" required className="mb-3 w-full rounded-lg border px-3 py-2">
                  <option value="PRESENT">حاضر</option>
                  <option value="ABSENT">غائب</option>
                  <option value="LATE">متأخر</option>
                  <option value="EXCUSED">غياب مبرر</option>
                </select>
                <input name="arrivalTime" type="time" className="mb-3 w-full rounded-lg border px-3 py-2" />
                <input name="excuse" placeholder="العذر أو الملاحظة" className="mb-3 w-full rounded-lg border px-3 py-2" />
                <button className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white">حفظ</button>
              </form>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xl font-semibold">آخر سجلات الحضور</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50"><tr><th className="p-3">التاريخ</th><th className="p-3">المستفيد</th><th className="p-3">المجموعة</th><th className="p-3">الحالة</th></tr></thead>
            <tbody className="divide-y">
              {records.map((r) => <tr key={r.id}><td className="p-3">{new Date(r.date).toLocaleDateString("ar-MA")}</td><td className="p-3">{r.beneficiary.firstName} {r.beneficiary.lastName}</td><td className="p-3">{r.group.name}</td><td className="p-3">{statusLabels[r.status]}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
