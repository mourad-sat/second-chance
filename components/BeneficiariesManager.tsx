"use client";

import Link from "next/link";
import {
  BrainCircuit,
  CalendarDays,
  FileDown,
  FileText,
  Filter,
  Grid2X2,
  List,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  Users,
  X
} from "lucide-react";
import { useMemo, useState } from "react";

type BeneficiaryRow = {
  id: string;
  fileNumber: string;
  masarNumber: string | null;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  gender: string | null;
  birthDate: string | null;
  phone: string | null;
  commune: string | null;
  province: string | null;
  lastEducationLevel: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  groupName: string | null;
  specialty: string | null;
  attendanceRate: number | null;
  absences: number;
  documentCount: number;
  followUpCount: number;
  resultCount: number;
  completionRate: number;
  lastActivityTitle: string | null;
  lastActivityDate: string | null;
};

const statusLabels: Record<string, string> = {
  PRE_REGISTERED: "مسجل أوليًا",
  UNDER_REVIEW: "قيد الدراسة",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "مقبول",
  REJECTED: "غير مقبول",
  ENROLLED: "متمدرس",
  WITHDRAWN: "منسحب",
  COMPLETED: "أنهى البرنامج"
};

const statusClasses: Record<string, string> = {
  PRE_REGISTERED: "border-slate-200 bg-slate-50 text-slate-700",
  UNDER_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  WAITLISTED: "border-orange-200 bg-orange-50 text-orange-700",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  ENROLLED: "border-blue-200 bg-blue-50 text-blue-700",
  WITHDRAWN: "border-rose-200 bg-rose-50 text-rose-700",
  COMPLETED: "border-violet-200 bg-violet-50 text-violet-700"
};

function calculateAge(value: string | null) {
  if (!value) return null;
  const birth = new Date(value);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function riskFor(item: BeneficiaryRow) {
  let points = 0;
  if (item.absences >= 8) points += 3;
  else if (item.absences >= 3) points += 2;
  if (item.completionRate < 55) points += 2;
  if (item.documentCount === 0) points += 1;
  if (["WITHDRAWN", "REJECTED"].includes(item.status)) points += 2;
  if (points >= 4) return { label: "مرتفع", className: "bg-red-50 text-red-700 ring-red-200" };
  if (points >= 2) return { label: "متوسط", className: "bg-amber-50 text-amber-700 ring-amber-200" };
  return { label: "منخفض", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
}

export function BeneficiariesManager({ beneficiaries }: { beneficiaries: BeneficiaryRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [gender, setGender] = useState("ALL");
  const [risk, setRisk] = useState("ALL");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return beneficiaries.filter((item) => {
      const itemRisk = riskFor(item).label;
      const searchable = [
        item.firstName,
        item.lastName,
        item.fileNumber,
        item.masarNumber || "",
        item.phone || "",
        item.groupName || "",
        item.specialty || "",
        item.commune || "",
        item.province || "",
        statusLabels[item.status] || item.status
      ].join(" ").toLowerCase();
      return (status === "ALL" || item.status === status)
        && (gender === "ALL" || item.gender === gender)
        && (risk === "ALL" || itemRisk === risk)
        && (!normalized || searchable.includes(normalized));
    });
  }, [beneficiaries, query, status, gender, risk]);

  const newThisMonth = beneficiaries.filter((item) => Date.now() - new Date(item.createdAt).getTime() <= 30 * 86400000).length;
  const incomplete = beneficiaries.filter((item) => item.completionRate < 70).length;
  const highRisk = beneficiaries.filter((item) => riskFor(item).label === "مرتفع").length;
  const active = beneficiaries.filter((item) => ["ACCEPTED", "ENROLLED"].includes(item.status)).length;

  const metrics = [
    { label: "إجمالي المستفيدين", value: beneficiaries.length, note: "جميع الملفات المسجلة", icon: Users, tone: "bg-blue-50 text-blue-700" },
    { label: "جدد خلال 30 يومًا", value: newThisMonth, note: "طلبات وملفات حديثة", icon: UserPlus, tone: "bg-violet-50 text-violet-700" },
    { label: "ملفات غير مكتملة", value: incomplete, note: "أقل من 70% اكتمالًا", icon: FileText, tone: "bg-amber-50 text-amber-700" },
    { label: "تدخل ذو أولوية", value: highRisk, note: `${active} مستفيدًا نشطًا`, icon: ShieldAlert, tone: "bg-red-50 text-red-700" }
  ];

  function clearFilters() {
    setQuery("");
    setStatus("ALL");
    setGender("ALL");
    setRisk("ALL");
  }

  const hasFilters = Boolean(query || status !== "ALL" || gender !== "ALL" || risk !== "ALL");

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <header className="overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-l from-blue-800 via-blue-700 to-indigo-700 p-6 text-white shadow-xl shadow-blue-900/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-white/15"><Users size={14} /> Beneficiary Management 2.0</div>
            <h1 className="text-3xl font-black md:text-4xl">إدارة المستفيدين</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 md:text-base">مركز موحد للبحث في الملفات، تقييم اكتمالها، رصد حالات الخطر، والوصول السريع إلى الوثائق والتشخيص والتوجيه الذكي.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black hover:bg-white/20"><FileDown size={17} /> تصدير / طباعة</button>
            <Link href="/beneficiaries/new" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-800 shadow-lg hover:bg-blue-50"><UserPlus size={18} /> مستفيد جديد</Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-4xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-3 text-xs text-slate-500">{note}</p></div>
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon size={22} /></span>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 md:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم، رقم التسجيل، رقم مسار، الهاتف، الجماعة أو المسار..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setFiltersOpen((value) => !value)} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-black ${filtersOpen || hasFilters ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}><SlidersHorizontal size={17} /> الفلاتر</button>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button type="button" onClick={() => setView("cards")} className={`rounded-lg p-2.5 ${view === "cards" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`} aria-label="عرض البطاقات"><Grid2X2 size={18} /></button>
                <button type="button" onClick={() => setView("table")} className={`rounded-lg p-2.5 ${view === "table" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`} aria-label="عرض الجدول"><List size={18} /></button>
              </div>
            </div>
          </div>

          {filtersOpen && (
            <div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 md:grid-cols-3 xl:grid-cols-4">
              <label className="text-xs font-black text-slate-600">الوضعية<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"><option value="ALL">كل الوضعيات</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-xs font-black text-slate-600">الجنس<select value={gender} onChange={(event) => setGender(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"><option value="ALL">الكل</option><option value="ذكر">ذكر</option><option value="أنثى">أنثى</option></select></label>
              <label className="text-xs font-black text-slate-600">مستوى الخطر<select value={risk} onChange={(event) => setRisk(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"><option value="ALL">كل المستويات</option><option>منخفض</option><option>متوسط</option><option>مرتفع</option></select></label>
              <button type="button" onClick={clearFilters} className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"><X size={16} /> مسح الفلاتر</button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm text-slate-500"><span><strong className="text-slate-900">{filtered.length}</strong> نتيجة مطابقة</span><span>إجمالي الملفات: {beneficiaries.length}</span></div>

        {filtered.length === 0 ? (
          <div className="p-14 text-center"><Filter className="mx-auto text-slate-300" size={42} /><p className="mt-4 font-black text-slate-700">لا توجد نتائج مطابقة</p><p className="mt-1 text-sm text-slate-500">غيّر كلمات البحث أو امسح بعض الفلاتر.</p></div>
        ) : view === "cards" ? (
          <div className="grid gap-4 p-4 md:grid-cols-2 2xl:grid-cols-3 md:p-5">
            {filtered.map((item) => {
              const age = calculateAge(item.birthDate);
              const itemRisk = riskFor(item);
              return (
                <article key={item.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
                  <div className="border-b border-slate-100 bg-gradient-to-l from-slate-50 to-white p-5">
                    <div className="flex items-start gap-4">
                      {item.profilePhotoUrl ? <img src={item.profilePhotoUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-4 ring-white shadow" /> : <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-black text-white shadow">{item.firstName[0]}{item.lastName[0]}</div>}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2"><div><Link href={`/beneficiaries/${item.id}`} className="text-lg font-black text-slate-950 hover:text-blue-700">{item.firstName} {item.lastName}</Link><p className="mt-1 font-mono text-xs font-bold text-slate-500">{item.fileNumber}</p></div><span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClasses[item.status] || statusClasses.PRE_REGISTERED}`}>{statusLabels[item.status] || item.status}</span></div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500"><span>مسار: {item.masarNumber || "—"}</span>{age !== null && <span>• {age} سنة</span>}<span>• {item.gender || "غير محدد"}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">المجموعة</p><p className="mt-1 truncate font-black text-slate-800">{item.groupName || "غير مسند"}</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">المسار / الشعبة</p><p className="mt-1 truncate font-black text-slate-800">{item.specialty || "غير محدد"}</p></div></div>
                    <div><div className="mb-2 flex items-center justify-between text-xs"><span className="font-black text-slate-600">اكتمال الملف</span><strong className={item.completionRate >= 70 ? "text-emerald-700" : "text-amber-700"}>{item.completionRate}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.completionRate >= 70 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${item.completionRate}%` }} /></div></div>
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${itemRisk.className}`}>الخطر: {itemRisk.label}</span><div className="flex gap-3 text-xs text-slate-500"><span>{item.documentCount} وثائق</span><span>{item.absences} غيابات</span><span>{item.followUpCount} متابعات</span></div></div>
                    <div className="rounded-2xl border border-slate-100 p-3 text-xs text-slate-500"><p className="font-bold text-slate-700">آخر نشاط</p><p className="mt-1 truncate">{item.lastActivityTitle || "لا يوجد نشاط مسجل"}</p></div>
                  </div>

                  <div className="grid grid-cols-3 border-t border-slate-100 bg-slate-50/70 p-2">
                    <Link href={`/beneficiaries/${item.id}`} className="rounded-xl px-2 py-2.5 text-center text-xs font-black text-blue-700 hover:bg-blue-50">فتح الملف</Link>
                    <Link href={`/beneficiaries/${item.id}/documents`} className="rounded-xl px-2 py-2.5 text-center text-xs font-black text-slate-700 hover:bg-white">الوثائق</Link>
                    <Link href={`/beneficiaries/${item.id}/smart-orientation`} className="inline-flex items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center text-xs font-black text-violet-700 hover:bg-violet-50"><BrainCircuit size={14} /> التوجيه</Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-right text-sm">
              <thead className="bg-slate-50 text-xs font-black text-slate-500"><tr><th className="px-5 py-4">المستفيد</th><th className="px-5 py-4">التسجيل ومسار</th><th className="px-5 py-4">المجموعة والمسار</th><th className="px-5 py-4">اكتمال الملف</th><th className="px-5 py-4">الحضور</th><th className="px-5 py-4">الخطر</th><th className="px-5 py-4">الوضعية</th><th className="px-5 py-4">الإجراء</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => { const itemRisk = riskFor(item); return <tr key={item.id} className="hover:bg-blue-50/30"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 font-black text-blue-700">{item.firstName[0]}{item.lastName[0]}</span><div><Link href={`/beneficiaries/${item.id}`} className="font-black text-slate-900 hover:text-blue-700">{item.firstName} {item.lastName}</Link><p className="mt-1 text-xs text-slate-500">{item.phone || "بدون هاتف"}</p></div></div></td><td className="px-5 py-4"><p className="font-mono text-xs font-bold">{item.fileNumber}</p><p className="mt-1 text-xs text-slate-500">{item.masarNumber || "—"}</p></td><td className="px-5 py-4"><p className="font-bold">{item.groupName || "غير مسند"}</p><p className="mt-1 text-xs text-slate-500">{item.specialty || "غير محدد"}</p></td><td className="px-5 py-4"><div className="w-28"><div className="mb-1 flex justify-between text-xs"><span>{item.completionRate}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${item.completionRate}%` }} /></div></div></td><td className="px-5 py-4">{item.attendanceRate === null ? "—" : `${item.attendanceRate}%`}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${itemRisk.className}`}>{itemRisk.label}</span></td><td className="px-5 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses[item.status] || statusClasses.PRE_REGISTERED}`}>{statusLabels[item.status] || item.status}</span></td><td className="px-5 py-4"><div className="flex gap-2"><Link href={`/beneficiaries/${item.id}`} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white">فتح</Link><Link href={`/beneficiaries/${item.id}/documents`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black">وثائق</Link></div></td></tr>; })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs text-slate-300"><CalendarDays size={15} className="text-blue-400" /> تُحدّث المؤشرات تلقائيًا وفق البيانات المسجلة في ملفات المستفيدين.</div>
    </div>
  );
}
