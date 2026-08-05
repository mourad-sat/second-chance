import Link from "next/link";
import { Activity, Database, Gauge, Settings, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [users, activeUsers, auditLogs, documents] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.auditLog.count(),
    prisma.document.count()
  ]);

  const cards = [
    { title: "المستخدمون والصلاحيات", description: `${activeUsers} حسابًا نشطًا من أصل ${users}`, icon: Users, href: "/settings/users", tone: "bg-blue-50 text-blue-700" },
    { title: "تخزين الوثائق", description: `${documents} وثيقة محفوظة داخل المنصة`, icon: Database, href: "/settings/storage", tone: "bg-emerald-50 text-emerald-700" },
    { title: "سجل التدقيق", description: `${auditLogs} عملية إدارية موثقة`, icon: Activity, href: "/settings/audit", tone: "bg-violet-50 text-violet-700" },
    { title: "جاهزية النظام", description: "فحص الوحدات والبيانات قبل النشر", icon: Gauge, href: "/settings/system-health", tone: "bg-amber-50 text-amber-700" }
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10"><Settings size={27} /></span><div><p className="text-sm font-black text-blue-300">Administration Center 3.0</p><h1 className="mt-1 text-3xl font-black">إدارة المنصة والحوكمة</h1><p className="mt-2 text-sm text-slate-300">مركز موحد للحسابات، التخزين، التدقيق، وفحص جاهزية الإصدار.</p></div></div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ title, description, icon: Icon, href, tone }) => (
            <Link key={title} href={href} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon size={22} /></span>
              <h2 className="mt-5 font-black text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><span className="mt-5 inline-flex text-sm font-black text-blue-700">فتح الإدارة ←</span>
            </Link>
          ))}
        </section>

        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 shrink-0 text-blue-700" /><div><h2 className="font-black text-blue-950">قاعدة الحوكمة</h2><p className="mt-2 text-sm leading-7 text-blue-900">تُسجل العمليات الحساسة في سجل التدقيق، وتبقى توصيات الذكاء الاصطناعي خاضعة للمراجعة البشرية، ولا يتم الحذف النهائي إلا من سلة المحذوفات.</p></div></div></section>
      </div>
    </AppShell>
  );
}
