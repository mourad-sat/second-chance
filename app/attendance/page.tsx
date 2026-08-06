"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarCheck2, ClipboardList, FolderPlus, UserRoundPlus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, PageContainer, PageHeader, SectionCard, StatusBadge, TableShell } from "@/components/ui/SystemUI";

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

const statusTones: Record<string, "success" | "danger" | "warning" | "info"> = {
  PRESENT: "success",
  ABSENT: "danger",
  LATE: "warning",
  EXCUSED: "info"
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
      <PageContainer>
        <PageHeader
          eyebrow="المواظبة اليومية"
          title="الحضور والغياب"
          description="تدبير المجموعات، إسناد المستفيدين، وتسجيل الحضور اليومي من واجهة واحدة موحدة."
          icon={CalendarCheck2}
        />

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-800">
            {message}
          </div>
        )}

        <section className="grid gap-5 xl:grid-cols-2">
          <SectionCard title="إنشاء مجموعة" description="إضافة مجموعة جديدة للموسم الدراسي" icon={FolderPlus}>
            <form onSubmit={(e) => submit(e, "createGroup")}>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="name" required placeholder="اسم المجموعة" className="field-control" />
                <input name="academicYear" required placeholder="الموسم الدراسي 2026/2027" className="field-control" />
                <input name="track" placeholder="المسار" className="field-control" />
                <input name="specialty" placeholder="الشعبة" className="field-control" />
                <input name="room" placeholder="القاعة" className="field-control" />
                <input name="facilitator" placeholder="المنشط أو المكون" className="field-control" />
              </div>
              <button className="btn-primary mt-4">حفظ المجموعة</button>
            </form>
          </SectionCard>

          <SectionCard title="إسناد مستفيد" description="ربط مستفيد بمجموعة نشطة" icon={UserRoundPlus}>
            <form onSubmit={(e) => submit(e, "enroll")}>
              <div className="grid gap-4">
                <select name="groupId" required className="field-control">
                  <option value="">اختر المجموعة</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name} — {g.academicYear}</option>)}
                </select>
                <select name="beneficiaryId" required className="field-control">
                  <option value="">اختر المستفيد</option>
                  {beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.firstName} {b.lastName}</option>)}
                </select>
              </div>
              <button className="btn-primary mt-4">إسناد المستفيد</button>
            </form>
          </SectionCard>
        </section>

        <SectionCard
          title="تسجيل الحضور اليومي"
          description="اختر المجموعة ثم سجّل وضعية كل مستفيد"
          icon={ClipboardList}
          action={
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="field-control min-w-56">
              <option value="">اختر المجموعة</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          }
        >
          {!currentGroup?.enrollments.length ? (
            <EmptyState icon={Users} title="لا يوجد مستفيدون في هذه المجموعة" description="قم بإسناد مستفيد واحد على الأقل قبل تسجيل الحضور." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {currentGroup.enrollments.map(({ beneficiary }) => (
                <form key={beneficiary.id} onSubmit={(e) => submit(e, "record")} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40">
                  <input type="hidden" name="groupId" value={currentGroup.id} />
                  <input type="hidden" name="beneficiaryId" value={beneficiary.id} />
                  <p className="mb-3 font-black text-slate-900">{beneficiary.firstName} {beneficiary.lastName}</p>
                  <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="field-control mb-3" />
                  <select name="status" required className="field-control mb-3">
                    <option value="PRESENT">حاضر</option>
                    <option value="ABSENT">غائب</option>
                    <option value="LATE">متأخر</option>
                    <option value="EXCUSED">غياب مبرر</option>
                  </select>
                  <input name="arrivalTime" type="time" className="field-control mb-3" />
                  <input name="excuse" placeholder="العذر أو الملاحظة" className="field-control mb-3" />
                  <button className="btn-primary w-full">حفظ</button>
                </form>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="آخر سجلات الحضور" description="أحدث العمليات المسجلة في المنصة" icon={CalendarCheck2} contentClassName="p-0">
          {records.length ? (
            <TableShell className="rounded-none border-0">
              <table className="data-table min-w-[720px]">
                <thead><tr><th>التاريخ</th><th>المستفيد</th><th>المجموعة</th><th>الحالة</th></tr></thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.date).toLocaleDateString("ar-MA")}</td>
                      <td className="font-black text-slate-900">{r.beneficiary.firstName} {r.beneficiary.lastName}</td>
                      <td>{r.group.name}</td>
                      <td><StatusBadge tone={statusTones[r.status]}>{statusLabels[r.status]}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          ) : (
            <div className="p-5"><EmptyState icon={CalendarCheck2} title="لا توجد سجلات حضور بعد" description="ستظهر السجلات هنا بعد حفظ أول عملية حضور." /></div>
          )}
        </SectionCard>
      </PageContainer>
    </AppShell>
  );
}
