import { AppShell } from "@/components/AppShell";
import { PrintReportButton } from "@/components/PrintReportButton";
import { prisma } from "@/lib/prisma";
import { BarChart3, BriefcaseBusiness, CalendarCheck2, GraduationCap, HeartHandshake, Users } from "lucide-react";

export const dynamic = "force-dynamic";

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default async function ReportsPage() {
  const [
    beneficiaries,
    enrolled,
    completed,
    groups,
    attendance,
    present,
    absent,
    academicResults,
    supportPlans,
    openSocialCases,
    vocationalPrograms,
    skillEvaluations,
    projects,
    internships,
    completedInternships,
    statusGroups,
    attendanceGroups
  ] = await Promise.all([
    prisma.beneficiary.count(),
    prisma.beneficiary.count({ where: { status: "ENROLLED" } }),
    prisma.beneficiary.count({ where: { status: "COMPLETED" } }),
    prisma.learningGroup.count({ where: { isActive: true } }),
    prisma.attendanceRecord.count(),
    prisma.attendanceRecord.count({ where: { status: "PRESENT" } }),
    prisma.attendanceRecord.count({ where: { status: "ABSENT" } }),
    prisma.academicResult.count(),
    prisma.academicSupportPlan.count({ where: { status: { in: ["PLANNED", "IN_PROGRESS"] } } }),
    prisma.socialFollowUp.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.vocationalProgram.count({ where: { isActive: true } }),
    prisma.skillEvaluation.count(),
    prisma.vocationalProject.count(),
    prisma.internship.count(),
    prisma.internship.count({ where: { status: "COMPLETED" } }),
    prisma.beneficiary.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.attendanceRecord.groupBy({ by: ["status"], _count: { _all: true } })
  ]);

  const statusLabels: Record<string, string> = {
    PRE_REGISTERED: "مسجل أوليًا",
    UNDER_REVIEW: "قيد الدراسة",
    WAITLISTED: "لائحة الانتظار",
    ACCEPTED: "مقبول",
    REJECTED: "غير مقبول",
    ENROLLED: "متمدرس",
    WITHDRAWN: "منسحب",
    COMPLETED: "مستكمل"
  };

  const attendanceLabels: Record<string, string> = {
    PRESENT: "حاضر",
    ABSENT: "غائب",
    LATE: "متأخر",
    EXCUSED: "غياب مبرر"
  };

  const mainCards = [
    { label: "إجمالي المستفيدين", value: beneficiaries, note: `${enrolled} متمدرسًا حاليًا`, icon: Users },
    { label: "المجموعات النشيطة", value: groups, note: "مجموعات الموسم الجاري", icon: GraduationCap },
    { label: "نسبة الحضور العامة", value: `${percent(present, attendance)}%`, note: `${present} حضور من أصل ${attendance}`, icon: CalendarCheck2 },
    { label: "التداريب المكتملة", value: completedInternships, note: `${internships} تدريبًا مسجلًا`, icon: BriefcaseBusiness }
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl print:max-w-none">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-blue-600">القيادة واتخاذ القرار</p>
            <h2 className="text-3xl font-bold text-slate-900">التقرير التنفيذي للبرنامج</h2>
            <p className="mt-2 text-slate-500">مؤشرات حية مستخرجة مباشرة من قاعدة بيانات منصة الفرصة الثانية.</p>
          </div>
          <PrintReportButton />
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {mainCards.map(({ label, value, note, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                  <p className="mt-2 text-xs text-slate-500">{note}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={22} /></div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3 text-slate-700"><BarChart3 size={21} /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">توزيع وضعيات المستفيدين</h3>
                <p className="text-sm text-slate-500">الوضعية الحالية لكل الملفات المسجلة</p>
              </div>
            </div>
            <div className="space-y-3">
              {statusGroups.map((item) => {
                const value = item._count._all;
                return (
                  <div key={item.status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{statusLabels[item.status]}</span>
                      <span className="font-bold text-slate-900">{value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent(value, beneficiaries)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><CalendarCheck2 size={21} /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">مؤشرات المواظبة</h3>
                <p className="text-sm text-slate-500">توزيع جميع سجلات الحضور والغياب</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {attendanceGroups.map((item) => (
                <div key={item.status} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{attendanceLabels[item.status]}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{item._count._all}</p>
                  <p className="mt-1 text-xs text-slate-500">{percent(item._count._all, attendance)}% من السجلات</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">إجمالي الغياب غير المبرر: <strong>{absent}</strong></div>
          </article>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">النتائج الأكاديمية</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{academicResults}</p>
            <p className="mt-2 text-xs text-slate-500">نتيجة تقويم مسجلة</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">خطط الدعم المفتوحة</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{supportPlans}</p>
            <p className="mt-2 text-xs text-slate-500">خطط مبرمجة أو قيد الإنجاز</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><p className="text-sm text-slate-500">المواكبة الاجتماعية</p><HeartHandshake size={19} className="text-rose-500" /></div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{openSocialCases}</p>
            <p className="mt-2 text-xs text-slate-500">حالات مفتوحة أو قيد المتابعة</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">المستكملون</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{completed}</p>
            <p className="mt-2 text-xs text-slate-500">{percent(completed, beneficiaries)}% من مجموع المستفيدين</p>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">مؤشرات التكوين والإدماج المهني</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-blue-50 p-4"><p className="text-sm text-blue-700">الوحدات المهنية النشيطة</p><p className="mt-2 text-2xl font-bold text-blue-950">{vocationalPrograms}</p></div>
            <div className="rounded-xl bg-violet-50 p-4"><p className="text-sm text-violet-700">تقييمات الكفايات</p><p className="mt-2 text-2xl font-bold text-violet-950">{skillEvaluations}</p></div>
            <div className="rounded-xl bg-amber-50 p-4"><p className="text-sm text-amber-700">المشاريع المهنية</p><p className="mt-2 text-2xl font-bold text-amber-950">{projects}</p></div>
            <div className="rounded-xl bg-emerald-50 p-4"><p className="text-sm text-emerald-700">نسبة إتمام التداريب</p><p className="mt-2 text-2xl font-bold text-emerald-950">{percent(completedInternships, internships)}%</p></div>
          </div>
        </section>

        <footer className="mt-8 hidden border-t border-slate-200 pt-4 text-xs text-slate-500 print:block">
          تقرير مولد آليًا من منصة تدبير برنامج الفرصة الثانية.
        </footer>
      </div>
    </AppShell>
  );
}
