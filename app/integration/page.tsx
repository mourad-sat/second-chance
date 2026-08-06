import { redirect } from "next/navigation";
import { BriefcaseBusiness, Building2, CheckCircle2, Rocket } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IntegrationManager } from "@/components/IntegrationManager";
import { PageContainer, PageHeader, SectionCard, StatCard } from "@/components/ui/SystemUI";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default async function IntegrationPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  const activeBeneficiaryWhere = { archivedAt: null, deletedAt: null } as const;
  const [internships, projectCount, completedProjects] = await Promise.all([
    prisma.internship.findMany({
      where: { beneficiary: activeBeneficiaryWhere },
      include: { beneficiary: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
      take: 300
    }),
    prisma.vocationalProject.count({ where: { beneficiary: activeBeneficiaryWhere } }),
    prisma.vocationalProject.count({ where: { status: "COMPLETED", beneficiary: activeBeneficiaryWhere } })
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

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          eyebrow="ما بعد التكوين"
          title="الإدماج المهني"
          description="تتبع التداريب المهنية والمؤسسات المستقبلة ونتائج الإدماج والمشاريع المهنية للمستفيدين."
          icon={BriefcaseBusiness}
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="التداريب الجارية" value={active} note={`${internships.length} تدريبًا مسجلًا`} icon={BriefcaseBusiness} tone="emerald" />
          <StatCard title="المؤسسات الشريكة" value={organizations} note="مؤسسات مستقبلة مختلفة" icon={Building2} tone="sky" />
          <StatCard title="التداريب المكتملة" value={completed} note={`${percent(completed, internships.length)}% من مجموع التداريب`} icon={CheckCircle2} tone="violet" />
          <StatCard title="المشاريع المكتملة" value={completedProjects} note={`${projectCount} مشروعًا مهنيًا`} icon={Rocket} tone="amber" />
        </section>

        <SectionCard title="مؤشر استكمال التتبع" description="نسبة التداريب التي تم توثيق نتيجتها النهائية." icon={CheckCircle2}>
          <div className="grid gap-5 md:grid-cols-[0.35fr_1fr] md:items-center">
            <div className="rounded-2xl bg-emerald-950 p-5 text-white">
              <p className="text-sm text-emerald-200">ملفات بنتيجة نهائية</p>
              <p className="mt-2 text-3xl font-black">{positiveResults}</p>
              <p className="mt-2 text-xs text-emerald-200/80">تداريب تم توثيق مآلها المهني</p>
            </div>
            <div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent(positiveResults, internships.length)}%` }} /></div>
              <p className="mt-3 text-sm text-slate-500">تم توثيق النتيجة النهائية لـ {positiveResults} من أصل {internships.length} تدريبًا.</p>
            </div>
          </div>
        </SectionCard>

        <IntegrationManager internships={serializedInternships} />
      </PageContainer>
    </AppShell>
  );
}
