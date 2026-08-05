"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  FolderOpen,
  Grid2X2,
  List,
  Search,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  X
} from "lucide-react";

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

const PAGE_SIZE_OPTIONS = [12, 24, 48];

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

function calculateAge(value: string | null) {
  if (!value) return null;
  const birth = new Date(value);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

export function BeneficiariesManagerV3({ beneficiaries }: { beneficiaries: BeneficiaryRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [gender, setGender] = useState("ALL");
  const [risk, setRisk] = useState("ALL");
  const [group, setGroup] = useState("ALL");
  const [completion, setCompletion] = useState("ALL");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [bulkAction, setBulkAction] = useState<"archive" | "trash" | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const groups = useMemo(() => Array.from(new Set(beneficiaries.map((item) => item.groupName).filter(Boolean) as string[])).sort(), [beneficiaries]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return beneficiaries.filter((item) => {
      const itemRisk = riskFor(item).label;
      const searchable = [item.firstName, item.lastName, item.fileNumber, item.masarNumber || "", item.phone || "", item.groupName || "", item.specialty || "", item.commune || "", item.province || "", statusLabels[item.status] || item.status].join(" ").toLowerCase();
      const completionMatch = completion === "ALL" || (completion === "COMPLETE" ? item.completionRate >= 70 : item.completionRate < 70);
      return (status === "ALL" || item.status === status)
        && (gender === "ALL" || item.gender === gender)
        && (risk === "ALL" || itemRisk === risk)
        && (group === "ALL" || item.groupName === group)
        && completionMatch
        && (!normalized || searchable.includes(normalized));
    });
  }, [beneficiaries, query, status, gender, risk, group, completion]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const allVisibleSelected = paginated.length > 0 && paginated.every((item) => selected.has(item.id));

  const metrics = [
    { label: "إجمالي الملفات النشطة", value: beneficiaries.length, note: "باستثناء الأرشيف والسلة", icon: Users, tone: "bg-blue-50 text-blue-700" },
    { label: "ملفات غير مكتملة", value: beneficiaries.filter((item) => item.completionRate < 70).length, note: "أقل من 70% اكتمالًا", icon: FileText, tone: "bg-amber-50 text-amber-700" },
    { label: "خطر مرتفع", value: beneficiaries.filter((item) => riskFor(item).label === "مرتفع").length, note: "تحتاج تدخلًا ذا أولوية", icon: ShieldAlert, tone: "bg-red-50 text-red-700" },
    { label: "مستفيدون نشطون", value: beneficiaries.filter((item) => ["ACCEPTED", "ENROLLED"].includes(item.status)).length, note: "مقبولون أو متمدرسون", icon: UserPlus, tone: "bg-emerald-50 text-emerald-700" }
  ];

  function resetPage() { setPage(1); }
  function clearFilters() { setQuery(""); setStatus("ALL"); setGender("ALL"); setRisk("ALL"); setGroup("ALL"); setCompletion("ALL"); setPage(1); }
  function toggleOne(id: string) { setSelected((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; }); }
  function toggleVisible() { setSelected((current) => { const next = new Set(current); paginated.forEach((item) => allVisibleSelected ? next.delete(item.id) : next.add(item.id)); return next; }); }

  function exportCsv() {
    const rows = filtered.map((item) => [item.fileNumber, `${item.firstName} ${item.lastName}`, item.masarNumber, item.phone, statusLabels[item.status] || item.status, item.groupName, item.specialty, item.completionRate, item.attendanceRate ?? "", riskFor(item).label]);
    const headers = ["رقم التسجيل", "الاسم الكامل", "رقم مسار", "الهاتف", "الوضعية", "المجموعة", "المسار", "اكتمال الملف", "نسبة الحضور", "مستوى الخطر"];
    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `beneficiaries-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  async function executeBulkAction() {
    if (!bulkAction || selected.size === 0) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/beneficiaries/bulk-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: bulkAction, ids: Array.from(selected), reason }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر تنفيذ العملية الجماعية.");
      setMessage(result.message); setSelected(new Set()); setBulkAction(null); setReason(""); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع."); }
    finally { setSaving(false); }
  }

  const hasFilters = Boolean(query || status !== "ALL" || gender !== "ALL" || risk !== "ALL" || group !== "ALL" || completion !== "ALL");

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <header className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-white/15"><Users size={14} /> Beneficiary Management 3.0</div><h1 className="text-3xl font-black md:text-4xl">إدارة المستفيدين</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100">بحث وفلاتر وإجراءات جماعية وتصدير آمن للملفات النشطة ضمن مركز تشغيل واحد.</p></div>
          <div className="flex flex-wrap gap-3"><Link href="/archive" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black hover:bg-white/20"><Archive size={17} className="inline ms-2" /> الأرشيف</Link><Link href="/trash" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black hover:bg-white/20"><Trash2 size={17} className="inline ms-2" /> السلة</Link><Link href="/beneficiaries/new" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-900"><UserPlus size={18} /> مستفيد جديد</Link></div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, note, icon: Icon, tone }) => <article key={label} className="app-card p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-4xl font-black text-slate-950">{value}</p><p className="mt-3 text-xs text-slate-500">{note}</p></div><span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon size={22} /></span></div></article>)}</section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 md:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1"><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} /><input value={query} onChange={(e) => { setQuery(e.target.value); resetPage(); }} placeholder="ابحث بالاسم، رقم التسجيل، رقم مسار، الهاتف، الجماعة أو المسار..." className="field-control w-full py-3.5 pr-12" /></div>
            <button type="button" onClick={() => setFiltersOpen((value) => !value)} className={`btn-secondary inline-flex items-center gap-2 ${hasFilters ? "border-blue-200 bg-blue-50 text-blue-800" : ""}`}><Filter size={17} /> الفلاتر</button>
            <button type="button" onClick={exportCsv} className="btn-secondary inline-flex items-center gap-2"><Download size={17} /> تصدير CSV</button>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1"><button onClick={() => setView("cards")} className={`rounded-lg p-2.5 ${view === "cards" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}><Grid2X2 size={18} /></button><button onClick={() => setView("table")} className={`rounded-lg p-2.5 ${view === "table" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}><List size={18} /></button></div>
          </div>
          {filtersOpen && <div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 md:grid-cols-3 xl:grid-cols-6">
            <label className="field-label">الوضعية<select value={status} onChange={(e) => { setStatus(e.target.value); resetPage(); }} className="field-control mt-2"><option value="ALL">الكل</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="field-label">الجنس<select value={gender} onChange={(e) => { setGender(e.target.value); resetPage(); }} className="field-control mt-2"><option value="ALL">الكل</option><option value="ذكر">ذكر</option><option value="أنثى">أنثى</option></select></label>
            <label className="field-label">الخطر<select value={risk} onChange={(e) => { setRisk(e.target.value); resetPage(); }} className="field-control mt-2"><option value="ALL">الكل</option><option>منخفض</option><option>متوسط</option><option>مرتفع</option></select></label>
            <label className="field-label">المجموعة<select value={group} onChange={(e) => { setGroup(e.target.value); resetPage(); }} className="field-control mt-2"><option value="ALL">كل المجموعات</option>{groups.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="field-label">اكتمال الملف<select value={completion} onChange={(e) => { setCompletion(e.target.value); resetPage(); }} className="field-control mt-2"><option value="ALL">الكل</option><option value="COMPLETE">70% فأكثر</option><option value="INCOMPLETE">أقل من 70%</option></select></label>
            <button onClick={clearFilters} className="btn-secondary mt-auto inline-flex items-center justify-center gap-2"><X size={16} /> مسح</button>
          </div>}
        </div>

        {selected.size > 0 && <div className="flex flex-col gap-3 border-b border-blue-100 bg-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-black text-blue-900">تم تحديد {selected.size} ملف</p><div className="flex flex-wrap gap-2"><button onClick={() => setBulkAction("archive")} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white"><Archive size={16} /> أرشفة المحدد</button><button onClick={() => setBulkAction("trash")} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-black text-white"><Trash2 size={16} /> إرسال إلى السلة</button><button onClick={() => setSelected(new Set())} className="btn-secondary">إلغاء التحديد</button></div></div>}

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm text-slate-500"><div className="flex items-center gap-3"><label className="inline-flex items-center gap-2 font-bold"><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} /> تحديد الصفحة</label><span><strong className="text-slate-900">{filtered.length}</strong> نتيجة</span></div><label className="flex items-center gap-2">عرض<select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-slate-200 px-2 py-1">{PAGE_SIZE_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select></label></div>

        {paginated.length === 0 ? <div className="empty-state m-5"><Filter className="mx-auto text-slate-300" size={42} /><p className="mt-4 font-black text-slate-700">لا توجد نتائج مطابقة</p></div> : view === "cards" ? <div className="grid gap-4 p-4 md:grid-cols-2 2xl:grid-cols-3 md:p-5">{paginated.map((item) => { const itemRisk = riskFor(item); const age = calculateAge(item.birthDate); return <article key={item.id} className={`app-card overflow-hidden ${selected.has(item.id) ? "ring-2 ring-blue-500" : ""}`}><div className="flex items-start gap-3 border-b border-slate-100 p-5"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleOne(item.id)} className="mt-2" />{item.profilePhotoUrl ? <img src={item.profilePhotoUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-700 font-black text-white">{item.firstName[0]}{item.lastName[0]}</span>}<div className="min-w-0 flex-1"><Link href={`/beneficiaries/${item.id}`} className="font-black text-slate-950 hover:text-blue-700">{item.firstName} {item.lastName}</Link><p className="mt-1 font-mono text-xs text-slate-500">{item.fileNumber}</p><div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500"><span>{item.masarNumber || "بدون مسار"}</span>{age !== null && <span>· {age} سنة</span>}</div></div><span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClasses[item.status]}`}>{statusLabels[item.status]}</span></div><div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">المجموعة</p><p className="mt-1 truncate font-black">{item.groupName || "غير مسند"}</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-500">المسار</p><p className="mt-1 truncate font-black">{item.specialty || "غير محدد"}</p></div></div><div><div className="mb-2 flex justify-between text-xs"><span>اكتمال الملف</span><strong>{item.completionRate}%</strong></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${item.completionRate}%` }} /></div></div><div className="flex justify-between gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${itemRisk.className}`}>الخطر: {itemRisk.label}</span><span className="text-xs text-slate-500">{item.documentCount} وثائق · {item.absences} غيابات</span></div></div><div className="grid grid-cols-3 border-t border-slate-100 bg-slate-50 p-2"><Link href={`/beneficiaries/${item.id}`} className="rounded-xl p-2 text-center text-xs font-black text-blue-700">فتح</Link><Link href={`/beneficiaries/${item.id}/documents`} className="inline-flex items-center justify-center gap-1 rounded-xl p-2 text-xs font-black"><FolderOpen size={14} /> وثائق</Link><Link href={`/beneficiaries/${item.id}/smart-orientation`} className="inline-flex items-center justify-center gap-1 rounded-xl p-2 text-xs font-black text-violet-700"><BrainCircuit size={14} /> توجيه</Link></div></article>; })}</div> : <div className="overflow-x-auto"><table className="data-table min-w-[1200px]"><thead><tr><th><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} /></th><th>المستفيد</th><th>التسجيل ومسار</th><th>المجموعة والمسار</th><th>الاكتمال</th><th>الحضور</th><th>الخطر</th><th>الوضعية</th><th>الإجراء</th></tr></thead><tbody>{paginated.map((item) => { const itemRisk = riskFor(item); return <tr key={item.id} className={selected.has(item.id) ? "bg-blue-50" : ""}><td><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleOne(item.id)} /></td><td><Link href={`/beneficiaries/${item.id}`} className="font-black text-slate-900">{item.firstName} {item.lastName}</Link><p className="text-xs text-slate-500">{item.phone || "بدون هاتف"}</p></td><td><p className="font-mono text-xs">{item.fileNumber}</p><p className="text-xs text-slate-500">{item.masarNumber || "—"}</p></td><td><p className="font-bold">{item.groupName || "غير مسند"}</p><p className="text-xs text-slate-500">{item.specialty || "غير محدد"}</p></td><td>{item.completionRate}%</td><td>{item.attendanceRate === null ? "—" : `${item.attendanceRate}%`}</td><td><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${itemRisk.className}`}>{itemRisk.label}</span></td><td><span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses[item.status]}`}>{statusLabels[item.status]}</span></td><td><Link href={`/beneficiaries/${item.id}`} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white">فتح</Link></td></tr>; })}</tbody></table></div>}

        <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">الصفحة {safePage} من {totalPages}</p><div className="flex gap-2"><button disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="btn-secondary inline-flex items-center gap-2 disabled:opacity-40"><ChevronRight size={16} /> السابق</button><button disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="btn-secondary inline-flex items-center gap-2 disabled:opacity-40">التالي <ChevronLeft size={16} /></button></div></footer>
      </section>

      {message && <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-black text-blue-800">{message}</div>}

      {bulkAction && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm" onClick={() => !saving && setBulkAction(null)}><section className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}><header className={`p-6 text-white ${bulkAction === "trash" ? "bg-red-700" : "bg-amber-600"}`}><h2 className="text-xl font-black">{bulkAction === "trash" ? "إرسال الملفات إلى السلة" : "أرشفة الملفات المحددة"}</h2><p className="mt-2 text-sm text-white/80">سيتم تطبيق العملية على {selected.size} ملف.</p></header><div className="space-y-4 p-6"><label className="field-label">سبب العملية (اختياري)<textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="field-control mt-2 resize-none" /></label><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button disabled={saving} onClick={() => setBulkAction(null)} className="btn-secondary">إلغاء</button><button disabled={saving} onClick={executeBulkAction} className={`rounded-xl px-5 py-3 text-sm font-black text-white ${bulkAction === "trash" ? "bg-red-700" : "bg-amber-600"}`}>{saving ? "جارٍ التنفيذ..." : "تأكيد العملية"}</button></div></div></section></div>}
    </div>
  );
}
