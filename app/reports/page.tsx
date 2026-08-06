import { redirect } from "next/navigation";
import { BarChart3, BriefcaseBusiness, CalendarCheck2, GraduationCap, HeartHandshake, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExecutiveReportExport } from "@/components/ExecutiveReportExport";
import { PageContainer, PageHeader, SectionCard, StatCard } from "@/components/ui/SystemUI";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function percent(value: number, total: number) { return total > 0 ? Math.round((value / total) * 100) : 0; }

export default async function ReportsPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

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

  return (
    <AppShell>
      <PageContainer className="max-w-7xl print:max-w-none">
        <PageHeader eyebrow="Executive Reports 3.0" title="التقرير التنفيذي للبرنامج" description="مؤشرات حية من قاعدة البيانات مع تصدير مباشر وطباعة محسنة." icon={BarChart3} actions={<ExecutiveReportExport rows={exportRows} />} />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="المستفيدون النشطون" value={beneficiaries} note={`${enrolled} متمدرسًا`} icon={Users} />
          <StatCard title="المجموعات النشطة" value={groups} note="الموسم الجاري" icon={GraduationCap} tone="violet" />
          <StatCard title="نسبة الحضور" value={`${attendanceRate}%`} note={`${present} حضورًا من ${attendance}`} icon={CalendarCheck2} />
          <StatCard title="إتمام التداريب" value={`${integrationRate}%`} note={`${completedInternships} مكتمل من ${internships}`} icon={BriefcaseBusiness} tone="amber" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <SectionCard title="توزيع وضعيات الملفات النشطة" description="لا يشمل الأرشيف وسلة المحذوفات." icon={BarChart3}>
            <div className="space-y-4">{statusGroups.map((item) => <div key={item.status}><div className="mb-2 flex justify-between text-sm"><span className="font-bold text-slate-700">{labels[item.status] || item.status}</span><strong>{item._count._all}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-emerald-700 to-teal-400" style={{ width: `${Math.max(3, percent(item._count._all, beneficiaries))}%` }} /></div></div>)}</div>
          </SectionCard>
          <SectionCard title="حوكمة البيانات">
            <div className="grid gap-3"><div className="rounded-2xl bg-amber-50 p-4"><p className="text-sm text-amber-700">الأرشيف</p><p className="mt-1 text-3xl font-black text-amber-950">{archived}</p></div><div className="rounded-2xl bg-rose-50 p-4"><p className="text-sm text-rose-700">سلة المحذوفات</p><p className="mt-1 text-3xl font-black text-rose-950">{deleted}</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-sm text-emerald-700">المستكملون</p><p className="mt-1 text-3xl font-black text-emerald-950">{completed}</p></div></div>
          </SectionCard>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="النتائج الأكاديمية" value={results} icon={GraduationCap} tone="sky" />
          <StatCard title="خطط الدعم المفتوحة" value={supportPlans} icon={CalendarCheck2} tone="amber" />
          <StatCard title="المواكبات المفتوحة" value={socialCases} icon={HeartHandshake} tone="rose" />
          <StatCard title="تقييمات الكفايات" value={skills} icon={BriefcaseBusiness} tone="violet" />
        </section>

        <SectionCard title="التكوين والإدماج المهني">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl bg-sky-50 p-4"><p className="text-sm text-sky-700">البرامج المهنية</p><p className="mt-2 text-2xl font-black text-sky-950">{programs}</p></div><div className="rounded-2xl bg-violet-50 p-4"><p className="text-sm text-violet-700">تقييمات الكفايات</p><p className="mt-2 text-2xl font-black text-violet-950">{skills}</p></div><div className="rounded-2xl bg-amber-50 p-4"><p className="text-sm text-amber-700">المشاريع المهنية</p><p className="mt-2 text-2xl font-black text-amber-950">{projects}</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-sm text-emerald-700">إتمام التداريب</p><p className="mt-2 text-2xl font-black text-emerald-950">{integrationRate}%</p></div></div>
        </SectionCard>
        <footer className="hidden border-t border-slate-200 pt-4 text-xs text-slate-500 print:block">تقرير مولد من منصة تدبير برنامج الفرصة الثانية — {new Date().toLocaleDateString("ar-MA")}</footer>
      </PageContainer>
    </AppShell>
  );
}
