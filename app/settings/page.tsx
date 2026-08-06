import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Database, Gauge, Settings, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageContainer, PageHeader, SectionCard } from "@/components/ui/SystemUI";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await currentSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect("/");

  const [users, activeUsers, auditLogs, documents] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.auditLog.count(),
    prisma.document.count()
  ]);

  const cards = [
    { title: "المستخدمون والصلاحيات", description: `${activeUsers} حسابًا نشطًا من أصل ${users}`, icon: Users, href: "/settings/users", tone: "bg-sky-50 text-sky-700" },
    { title: "تخزين الوثائق", description: `${documents} وثيقة محفوظة داخل المنصة`, icon: Database, href: "/settings/storage", tone: "bg-emerald-50 text-emerald-700" },
    { title: "سجل التدقيق", description: `${auditLogs} عملية إدارية موثقة`, icon: Activity, href: "/settings/audit", tone: "bg-violet-50 text-violet-700" },
    { title: "جاهزية النظام", description: "فحص الوحدات والبيانات قبل النشر", icon: Gauge, href: "/settings/system-health", tone: "bg-amber-50 text-amber-700" }
  ];

  return (
    <AppShell>
      <PageContainer className="max-w-7xl">
        <PageHeader
          eyebrow="Administration Center 3.0"
          title="إدارة المنصة والحوكمة"
          description="مركز موحد للحسابات، التخزين، التدقيق وفحص جاهزية الإصدار."
          icon={Settings}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ title, description, icon: Icon, href, tone }) => (
            <Link key={title} href={href} className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon size={22} /></span>
              <h2 className="mt-5 font-black text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              <span className="mt-5 inline-flex text-sm font-black text-emerald-700">فتح الإدارة ←</span>
            </Link>
          ))}
        </section>

        <SectionCard title="قاعدة الحوكمة" icon={ShieldCheck} className="border-emerald-200 bg-emerald-50/50">
          <p className="text-sm leading-7 text-emerald-900">تُسجل العمليات الحساسة في سجل التدقيق، وتبقى التوصيات الذكية خاضعة للمراجعة البشرية، ولا يتم الحذف النهائي إلا من سلة المحذوفات.</p>
        </SectionCard>
      </PageContainer>
    </AppShell>
  );
}
