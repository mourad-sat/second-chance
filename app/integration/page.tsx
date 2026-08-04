import { BriefcaseBusiness, Building2, CheckCircle2, Rocket } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IntegrationManager } from "@/components/IntegrationManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default async function IntegrationPage() {
  const [internships, projectCount, completedProjects] = await Promise.all([
    prisma.internship.findMany({
      include: { beneficiary: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ status: "asc" }, { startDate: "desc" }]
    }),
    prisma.vocationalProject.count(),
    prisma.vocationalProject.count({ where: { status: "COMPLETED" } })
  ]);

  const active = internships.filter((item) => item.status === "ACTIVE").length;
  const completed = internships.filter((item) => item.status === "COMPLETED").length;
  const organizations = new Set(internships.map((item) => item.organizationName.trim().toLowerCase())).size;
  const positiveResults = internships.filter((item) => item.finalResult && item.finalResult.trim().length > 0).length;

  const serializedInternships = internships.map((item) => ({
    ...item,
    startDate: item.startDate.toISOString(),
    endDate: item.endDate?.toISOString() || null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  }));

  const cards = [
    { label: "التداريب الجارية", value: active, note: `${internships.length} تدريبًا مسجلًا`, icon: BriefcaseBusiness },
    { label: "المؤسسات الشريكة", value: organizations, note: "مؤسسات مستقبلة مختلفة", icon: Building2 },
    { label: "التداريب المكتملة", value: completed, note: `${percent(completed, internships.length)}% من مجموع التداريب`, icon: CheckCircle2 },
    { label: "المشاريع المكتملة", value: completedProjects, note: `${projectCount} مشروعًا مهنيًا`, icon: Rocket }
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <p className="mb-2 text-sm font-semibold text-emerald-600">ما بعد التكوين</p>
        <h2 className="text-3xl font-bold text-slate-900">الإدماج المهني</h2>
        <p className="mt-2 text-slate-500">تتبع التداريب المهنية، المؤسسات المستقبلة، نتائج الإدماج، والمشاريع المهنية للمستفيدين.</p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, note, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-start justify-between">
                <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><Icon size={22} /></div>
              </div>
              <p className="text-xs text-slate-500">{note}</p>
            </article>
          ))}
        </section>

        <section className="my-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl bg-slate-900 p-5 text-white">
            <p className="text-sm text-slate-300">ملفات بنتيجة نهائية</p>
            <p className="mt-2 text-3xl font-bold">{positiveResults}</p>
            <p className="mt-2 text-xs text-slate-400">تداريب تم توثيق مآلها المهني</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
            <h3 className="font-bold text-slate-900">مؤشر استكمال التتبع</h3>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent(positiveResults, internships.length)}%` }} /></div>
            <p className="mt-3 text-sm text-slate-500">تم توثيق النتيجة النهائية لـ {positiveResults} من أصل {internships.length} تدريبًا.</p>
          </article>
        </section>

        <IntegrationManager internships={serializedInternships} />
      </div>
    </AppShell>
  );
}
