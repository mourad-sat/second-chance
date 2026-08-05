import { AppShell } from "@/components/AppShell";
import { ExecutiveReportExport } from "@/components/ExecutiveReportExport";
import { prisma } from "@/lib/prisma";
import { BarChart3, BriefcaseBusiness, CalendarCheck2, GraduationCap, HeartHandshake, Users } from "lucide-react";

export const dynamic = "force-dynamic";

function percent(value: number, total: number) { return total > 0 ? Math.round((value / total) * 100) : 0; }

export default async function ReportsPage() {
  const [beneficiaries, archived, deleted, enrolled, completed, groups, attendance, present, absent, results, supportPlans, socialCases, programs, skills, projects, internships, completedInternships, statusGroups] = await Promise.all([
    prisma.beneficiary.count({ where: { archivedAt: null, deletedAt: null } }),
    prisma.beneficiary.count({ where: { archivedAt: { not: null }, deletedAt: null } }),
    prisma.beneficiary.count({ where: { deletedAt: { not: null } } }),
    prisma.beneficiary.count({ where: { status: "ENROLLED", archivedAt: null, deletedAt: null } }),
    prisma.beneficiary.count({ where: { status: "COMPLETED", archivedAt: null, deletedAt: null } }),
    prisma.learningGroup.count({ where: { isActive: true } }),
    prisma.attendanceRecord.count(),
    prisma.attendanceRecord.count({ where: { status: { in: ["PRESENT", "LATE"] } } }),
    prisma.attendanceRecord.count({ where: { status: "ABSENT" } }),
    prisma.academicResult.count(),
    prisma.academicSupportPlan.count({ where: { status: { in: ["PLANNED", "IN_PROGRESS"] } } }),
    prisma.socialFollowUp.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.vocationalProgram.count({ where: { isActive: true } }),
    prisma.skillEvaluation.count(),
    prisma.vocationalProject.count(),
    prisma.internship.count(),
    prisma.internship.count({ where: { status: "COMPLETED" } }),
    prisma.beneficiary.groupBy({ by: ["status"], where: { archivedAt: null, deletedAt: null }, _count: { _all: true } })
  ]);

  const labels: Record<string, string> = { PRE_REGISTERED: "مسجل أوليًا", UNDER_REVIEW: "قيد الدراسة", WAITLISTED: "لائحة الانتظار", ACCEPTED: "مقبول", REJECTED: "غير مقبول", ENROLLED: "متمدرس", WITHDRAWN: "منسحب", COMPLETED: "مستكمل" };
  const attendanceRate = percent(present, attendance);
  const integrationRate = percent(completedInternships, internships);
  const exportRows = [
    { section: "المستفيدون", indicator: "الملفات النشطة", value: beneficiaries }, { section: "المستفيدون", indicator: "المؤرشفون", value: archived }, { section: "المستفيدون", indicator: "سلة المحذوفات", value: deleted },
    { section: "البرنامج", indicator: "المتمدرسون", value: enrolled }, { section: "البرنامج", indicator: "المستكملون", value: completed }, { section: "البرنامج", indicator: "المجموعات النشطة", value: groups },
    { section: "الحضور", indicator: "نسبة الحضور", value: `${attendanceRate}%` }, { section: "الحضور", indicator: "الغيابات", value: absent },
    { section: "التتبع", indicator: "النتائج الأكاديمية", value: results }, { section: "التتبع", indicator: "خطط الدعم المفتوحة", value: supportPlans }, { section: "التتبع", indicator: "الحالات الاجتماعية المفتوحة", value: socialCases },
    { section: "التكوين", indicator: "البرامج النشطة", value: programs }, { section: "التكوين", indicator: "تقييمات الكفايات", value: skills }, { section: "التكوين", indicator: "المشاريع المهنية", value: projects }, { section: "الإدماج", indicator: "نسبة إتمام التداريب", value: `${integrationRate}%` }
  ];

  const cards = [
    { label: "المستفيدون النشطون", value: beneficiaries, note: `${enrolled} متمدرسًا`, icon: Users, tone: "bg-blue-50 text-blue-700" },
    { label: "المجموعات النشطة", value: groups, note: "الموسم الجاري", icon: GraduationCap, tone: "bg-violet-50 text-violet-700" },
    { label: "نسبة الحضور", value: `${attendanceRate}%`, note: `${present} حضورًا من ${attendance}`, icon: CalendarCheck2, tone: "bg-emerald-50 text-emerald-700" },
    { label: "إتمام التداريب", value: `${integrationRate}%`, note: `${completedInternships} مكتمل من ${internships}`, icon: BriefcaseBusiness, tone: "bg-amber-50 text-amber-700" }
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 print:max-w-none">
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-black text-cyan-300">Executive Reports 3.0</p><h1 className="mt-2 text-3xl font-black">التقرير التنفيذي للبرنامج</h1><p className="mt-3 text-sm text-slate-300">مؤشرات حية من قاعدة البيانات مع تصدير مباشر إلى Excel/CSV وطباعة محسنة.</p></div><ExecutiveReportExport rows={exportRows} /></div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, note, icon: Icon, tone }) => <article key={label} className="app-card p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></div><span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon size={22} /></span></div></article>)}</section>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <article className="app-card p-6"><div className="mb-5 flex items-center gap-3"><BarChart3 className="text-blue-700" /><div><h2 className="text-xl font-black">توزيع وضعيات الملفات النشطة</h2><p className="text-sm text-slate-500">لا يشمل الأرشيف وسلة المحذوفات.</p></div></div><div className="space-y-4">{statusGroups.map((item) => <div key={item.status}><div className="mb-2 flex justify-between text-sm"><span className="font-bold text-slate-700">{labels[item.status] || item.status}</span><strong>{item._count._all}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-blue-700 to-cyan-400" style={{ width: `${Math.max(3, percent(item._count._all, beneficiaries))}%` }} /></div></div>)}</div></article>
          <article className="app-card p-6"><h2 className="text-xl font-black">حوكمة البيانات</h2><div className="mt-5 space-y-3"><div className="rounded-2xl bg-amber-50 p-4"><p className="text-sm text-amber-700">الأرشيف</p><p className="mt-1 text-3xl font-black text-amber-950">{archived}</p></div><div className="rounded-2xl bg-red-50 p-4"><p className="text-sm text-red-700">سلة المحذوفات</p><p className="mt-1 text-3xl font-black text-red-950">{deleted}</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-sm text-emerald-700">المستكملون</p><p className="mt-1 text-3xl font-black text-emerald-950">{completed}</p></div></div></article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><article className="app-card p-5"><p className="text-sm text-slate-500">النتائج الأكاديمية</p><p className="mt-2 text-3xl font-black">{results}</p></article><article className="app-card p-5"><p className="text-sm text-slate-500">خطط الدعم المفتوحة</p><p className="mt-2 text-3xl font-black">{supportPlans}</p></article><article className="app-card p-5"><HeartHandshake className="text-rose-600" /><p className="mt-3 text-sm text-slate-500">المواكبات المفتوحة</p><p className="mt-2 text-3xl font-black">{socialCases}</p></article><article className="app-card p-5"><p className="text-sm text-slate-500">تقييمات الكفايات</p><p className="mt-2 text-3xl font-black">{skills}</p></article></section>

        <section className="app-card p-6"><h2 className="text-xl font-black">التكوين والإدماج المهني</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl bg-blue-50 p-4"><p className="text-sm text-blue-700">البرامج المهنية</p><p className="mt-2 text-2xl font-black text-blue-950">{programs}</p></div><div className="rounded-2xl bg-violet-50 p-4"><p className="text-sm text-violet-700">تقييمات الكفايات</p><p className="mt-2 text-2xl font-black text-violet-950">{skills}</p></div><div className="rounded-2xl bg-amber-50 p-4"><p className="text-sm text-amber-700">المشاريع المهنية</p><p className="mt-2 text-2xl font-black text-amber-950">{projects}</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-sm text-emerald-700">إتمام التداريب</p><p className="mt-2 text-2xl font-black text-emerald-950">{integrationRate}%</p></div></div></section>
        <footer className="hidden border-t border-slate-200 pt-4 text-xs text-slate-500 print:block">تقرير مولد من منصة تدبير برنامج الفرصة الثانية — {new Date().toLocaleDateString("ar-MA")}</footer>
      </div>
    </AppShell>
  );
}
