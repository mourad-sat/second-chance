import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SocialFollowUpForm } from "@/components/SocialFollowUpForm";
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
  const [beneficiaries, records, openCount, urgentCount] = await Promise.all([
    prisma.beneficiary.findMany({
      where: { status: { in: ["ACCEPTED", "ENROLLED"] } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    }),
    prisma.socialFollowUp.findMany({
      include: { beneficiary: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { eventDate: "desc" },
      take: 100
    }),
    prisma.socialFollowUp.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.socialFollowUp.count({ where: { priority: "URGENT", status: { in: ["OPEN", "IN_PROGRESS"] } } })
  ]);

  const upcomingCount = records.filter((record) =>
    record.nextFollowUpDate && record.nextFollowUpDate >= new Date()
  ).length;

  return (
    <AppShell>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">المواكبة الاجتماعية</h2>
        <p className="mt-2 text-slate-600">تتبع المقابلات والزيارات والتدخلات والإحالات والحالات ذات الأولوية.</p>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">الحالات المفتوحة</p><p className="mt-2 text-3xl font-bold">{openCount}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">الحالات المستعجلة</p><p className="mt-2 text-3xl font-bold">{urgentCount}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">مواعيد متابعة مقبلة</p><p className="mt-2 text-3xl font-bold">{upcomingCount}</p></article>
      </section>

      <div className="mb-8"><SocialFollowUpForm beneficiaries={beneficiaries} /></div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5"><h3 className="text-xl font-bold">سجل عمليات المواكبة</h3></div>
        {records.length === 0 ? (
          <p className="p-8 text-center text-slate-500">لا توجد عمليات مسجلة بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-4">المستفيد</th><th className="px-5 py-4">النوع</th><th className="px-5 py-4">الموضوع</th><th className="px-5 py-4">الأولوية</th><th className="px-5 py-4">التاريخ</th><th className="px-5 py-4">المتابعة المقبلة</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium"><Link className="hover:underline" href={`/beneficiaries/${record.beneficiary.id}`}>{record.beneficiary.firstName} {record.beneficiary.lastName}</Link></td>
                    <td className="px-5 py-4">{typeLabels[record.type]}</td>
                    <td className="px-5 py-4">{record.subject}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1">{priorityLabels[record.priority]}</span></td>
                    <td className="px-5 py-4">{record.eventDate.toLocaleDateString("ar-MA")}</td>
                    <td className="px-5 py-4">{record.nextFollowUpDate ? record.nextFollowUpDate.toLocaleDateString("ar-MA") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}