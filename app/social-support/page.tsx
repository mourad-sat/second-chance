import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, HeartHandshake, Siren, UsersRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SocialFollowUpForm } from "@/components/SocialFollowUpForm";
import { EmptyState, PageContainer, PageHeader, SectionCard, StatCard, StatusBadge, TableShell } from "@/components/ui/SystemUI";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const typeLabels: Record<string, string> = {
  INDIVIDUAL_INTERVIEW: "مقابلة فردية",
  FAMILY_VISIT: "زيارة أسرية",
  PHONE_CALL: "اتصال هاتفي",
  MEDIATION: "وساطة",
  REFERRAL: "إحالة",
  MATERIAL_SUPPORT: "دعم مادي",
  PSYCHOLOGICAL_SUPPORT: "دعم نفسي",
  OTHER: "أخرى"
};

const priorityLabels: Record<string, string> = {
  LOW: "منخفضة",
  NORMAL: "عادية",
  HIGH: "مرتفعة",
  URGENT: "مستعجلة"
};

export const dynamic = "force-dynamic";

export default async function SocialSupportPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  const activeBeneficiaryWhere = { archivedAt: null, deletedAt: null } as const;
  const [beneficiaries, records, openCount, urgentCount] = await Promise.all([
    prisma.beneficiary.findMany({
      where: { ...activeBeneficiaryWhere, status: { in: ["ACCEPTED", "ENROLLED"] } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 300
    }),
    prisma.socialFollowUp.findMany({
      where: { beneficiary: activeBeneficiaryWhere },
      include: { beneficiary: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { eventDate: "desc" },
      take: 100
    }),
    prisma.socialFollowUp.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, beneficiary: activeBeneficiaryWhere } }),
    prisma.socialFollowUp.count({ where: { priority: "URGENT", status: { in: ["OPEN", "IN_PROGRESS"] }, beneficiary: activeBeneficiaryWhere } })
  ]);

  const upcomingCount = records.filter((record) => record.nextFollowUpDate && record.nextFollowUpDate >= new Date()).length;

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          eyebrow="الدعم والتدخل"
          title="المواكبة الاجتماعية"
          description="تتبع المقابلات والزيارات والتدخلات والإحالات والحالات ذات الأولوية داخل سجل موحد."
          icon={HeartHandshake}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="الحالات المفتوحة" value={openCount} note="تحتاج متابعة أو تدخلًا" icon={UsersRound} tone="sky" />
          <StatCard title="الحالات المستعجلة" value={urgentCount} note="أولوية تدخل فورية" icon={Siren} tone="rose" />
          <StatCard title="مواعيد متابعة مقبلة" value={upcomingCount} note="ضمن السجلات المعروضة" icon={CalendarClock} tone="amber" />
        </section>

        <SectionCard title="تسجيل عملية مواكبة" description="أضف مقابلة أو زيارة أو إحالة جديدة." icon={HeartHandshake}>
          <SocialFollowUpForm beneficiaries={beneficiaries} />
        </SectionCard>

        <SectionCard title="سجل عمليات المواكبة" description="آخر 100 عملية مرتبطة بملفات نشطة." icon={UsersRound} contentClassName="p-0">
          {records.length === 0 ? (
            <div className="p-5"><EmptyState icon={HeartHandshake} title="لا توجد عمليات مسجلة بعد" description="ستظهر عمليات المواكبة هنا بعد تسجيل أول تدخل." /></div>
          ) : (
            <TableShell className="rounded-none border-0 shadow-none">
              <table className="data-table min-w-[900px]">
                <thead><tr><th>المستفيد</th><th>النوع</th><th>الموضوع</th><th>الأولوية</th><th>التاريخ</th><th>المتابعة المقبلة</th></tr></thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td><Link className="font-black text-slate-900 hover:text-emerald-700" href={`/beneficiaries/${record.beneficiary.id}`}>{record.beneficiary.firstName} {record.beneficiary.lastName}</Link></td>
                      <td>{typeLabels[record.type]}</td>
                      <td>{record.subject}</td>
                      <td><StatusBadge tone={record.priority === "URGENT" ? "danger" : record.priority === "HIGH" ? "warning" : "neutral"}>{priorityLabels[record.priority]}</StatusBadge></td>
                      <td>{record.eventDate.toLocaleDateString("ar-MA")}</td>
                      <td>{record.nextFollowUpDate ? record.nextFollowUpDate.toLocaleDateString("ar-MA") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          )}
        </SectionCard>
      </PageContainer>
    </AppShell>
  );
}
