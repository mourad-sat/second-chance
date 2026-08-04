"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HeartHandshake,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  Sparkles
} from "lucide-react";

type TimelineEvent = {
  id: string;
  category: string;
  title: string;
  description: string;
  actorName: string;
  eventDate: string;
  href: string;
};

const categoryLabels: Record<string, string> = {
  REGISTRATION: "التسجيل",
  DIAGNOSIS: "التشخيص",
  ADMISSION: "القبول",
  ATTENDANCE: "الحضور",
  ASSESSMENT: "التقويمات",
  SUPPORT: "الدعم الفردي",
  SOCIAL: "المواكبة الاجتماعية",
  TRAINING: "التكوين",
  INTERNSHIP: "التدريب",
  INTEGRATION: "الإدماج",
  DOCUMENT: "الوثائق",
  NOTE: "الملاحظات"
};

const categoryStyles: Record<string, string> = {
  REGISTRATION: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DIAGNOSIS: "bg-violet-50 text-violet-700 ring-violet-200",
  ADMISSION: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  ATTENDANCE: "bg-sky-50 text-sky-700 ring-sky-200",
  ASSESSMENT: "bg-blue-50 text-blue-700 ring-blue-200",
  SUPPORT: "bg-amber-50 text-amber-700 ring-amber-200",
  SOCIAL: "bg-rose-50 text-rose-700 ring-rose-200",
  TRAINING: "bg-teal-50 text-teal-700 ring-teal-200",
  INTERNSHIP: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  INTEGRATION: "bg-slate-100 text-slate-800 ring-slate-200",
  DOCUMENT: "bg-orange-50 text-orange-700 ring-orange-200",
  NOTE: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200"
};

function CategoryIcon({ category }: { category: string }) {
  const props = { size: 17 };
  if (category === "DIAGNOSIS" || category === "ADMISSION") return <ClipboardCheck {...props} />;
  if (category === "ATTENDANCE") return <CalendarCheck2 {...props} />;
  if (category === "ASSESSMENT") return <BookOpenCheck {...props} />;
  if (category === "SUPPORT") return <ShieldCheck {...props} />;
  if (category === "SOCIAL") return <HeartHandshake {...props} />;
  if (category === "TRAINING") return <GraduationCap {...props} />;
  if (["INTERNSHIP", "INTEGRATION"].includes(category)) return <BriefcaseBusiness {...props} />;
  if (category === "DOCUMENT") return <FileText {...props} />;
  if (category === "NOTE") return <MessageSquareText {...props} />;
  return <Sparkles {...props} />;
}

export function BeneficiaryTimeline({ beneficiaryId, events }: { beneficiaryId: string; events: TimelineEvent[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesCategory = category === "ALL" || event.category === category;
      const matchesQuery = !normalized || [event.title, event.description, event.actorName, categoryLabels[event.category]]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [events, query, category]);

  async function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch(`/api/beneficiaries/${beneficiaryId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر إضافة الحدث.");
      form.reset();
      setMessage("تمت إضافة الحدث إلى السجل الزمني.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addActivity} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Plus size={20} /></div>
          <div><h2 className="font-bold text-slate-950">إضافة حدث أو ملاحظة</h2><p className="text-sm text-slate-500">أضف مقابلة أو اتصالًا أو وثيقة أو ملاحظة غير مسجلة تلقائيًا.</p></div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select required name="category" defaultValue="NOTE" className="rounded-xl border border-slate-300 px-4 py-3">
            {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input required name="title" placeholder="عنوان الحدث" className="rounded-xl border border-slate-300 px-4 py-3" />
          <input name="actorName" placeholder="المسؤول أو المؤطر" className="rounded-xl border border-slate-300 px-4 py-3" />
          <input name="eventDate" type="datetime-local" className="rounded-xl border border-slate-300 px-4 py-3" />
          <textarea name="description" rows={3} placeholder="تفاصيل مختصرة..." className="rounded-xl border border-slate-300 px-4 py-3 md:col-span-2 xl:col-span-4" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {message ? <p className="text-sm font-semibold text-slate-600">{message}</p> : <span />}
          <button disabled={saving} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "جارٍ الحفظ..." : "إضافة إلى السجل"}</button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_260px]">
            <label className="relative block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في الأحداث والملاحظات..." className="w-full rounded-xl border border-slate-300 py-3 pl-4 pr-11 outline-none focus:border-blue-500" />
            </label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-4 py-3">
              <option value="ALL">كل فئات النشاط</option>
              {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">الأحداث المعروضة: {filtered.length} من {events.length}</p>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">لا توجد أحداث مطابقة للبحث أو التصفية.</div>
        ) : (
          <div className="relative p-5 md:p-7">
            <div className="absolute bottom-7 right-[43px] top-7 hidden w-px bg-slate-200 md:block" />
            <div className="space-y-5">
              {filtered.map((event) => (
                <article key={event.id} className="relative md:pr-14">
                  <div className={`absolute right-0 top-1 hidden h-9 w-9 place-items-center rounded-full ring-4 md:grid ${categoryStyles[event.category] || categoryStyles.NOTE}`}>
                    <CategoryIcon category={event.category} />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition hover:bg-white hover:shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ring-1 ${categoryStyles[event.category] || categoryStyles.NOTE}`}><CategoryIcon category={event.category} />{categoryLabels[event.category] || event.category}</span>
                          <h3 className="font-bold text-slate-950">{event.title}</h3>
                        </div>
                        {event.description && <p className="mt-3 text-sm leading-7 text-slate-600">{event.description}</p>}
                        {event.actorName && <p className="mt-2 text-xs text-slate-500">المسؤول: {event.actorName}</p>}
                      </div>
                      <div className="shrink-0 text-xs font-semibold text-slate-500">{new Date(event.eventDate).toLocaleString("ar-MA")}</div>
                    </div>
                    {event.href && <Link href={event.href} className="mt-4 inline-flex text-xs font-bold text-blue-700">فتح التفاصيل ←</Link>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
