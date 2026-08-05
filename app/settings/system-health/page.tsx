import Link from "next/link";
import { Activity, Archive, BrainCircuit, CheckCircle2, Database, GitBranch, ShieldCheck, Trash2, TriangleAlert, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SystemHealthPage() {
  const now = new Date();
  const [active, archived, deleted, users, documents, workflowLogs, aiDecisions, auditLogs, groups] = await Promise.all([
    prisma.beneficiary.count({ where: { archivedAt: null, deletedAt: null } }),
    prisma.beneficiary.count({ where: { archivedAt: { not: null }, deletedAt: null } }),
    prisma.beneficiary.count({ where: { deletedAt: { not: null } } }),
    prisma.user.count(),
    prisma.document.count(),
    prisma.activityLog.count({ where: { referenceType: "BENEFICIARY_WORKFLOW" } }),
    prisma.activityLog.count({ where: { referenceType: "BENEFICIARY_INTELLIGENCE_DECISION" } }),
    prisma.auditLog.count(),
    prisma.learningGroup.count({ where: { isActive: true } })
  ]);

  const checks = [
    { label: "قاعدة البيانات", ok: true, note: `${active + archived + deleted} ملفًا قابلًا للوصول`, href: "/beneficiaries", icon: Database },
    { label: "المستخدمون والصلاحيات", ok: users > 0, note: `${users} حسابًا مسجلًا`, href: "/settings/users", icon: ShieldCheck },
    { label: "الأرشيف", ok: true, note: `${archived} ملفًا مؤرشفًا`, href: "/archive", icon: Archive },
    { label: "سلة المحذوفات", ok: true, note: `${deleted} ملفًا قابلًا للاستعادة`, href: "/trash", icon: Trash2 },
    { label: "Workflow 3.0", ok: workflowLogs > 0, note: workflowLogs ? `${workflowLogs} انتقالًا موثقًا` : "جاهز ولم تُسجل انتقالات بعد", href: "/workflow", icon: GitBranch },
    { label: "مركز الذكاء", ok: true, note: `${aiDecisions} قرار مراجعة بشري موثق`, href: "/intelligence", icon: BrainCircuit },
    { label: "التخزين الرقمي", ok: true, note: `${documents} وثيقة محفوظة`, href: "/settings/storage", icon: Database },
    { label: "المجموعات النشطة", ok: groups > 0, note: `${groups} مجموعة نشطة`, href: "/groups", icon: Users },
    { label: "سجل التدقيق", ok: auditLogs > 0, note: `${auditLogs} عملية إدارية موثقة`, href: "/settings/audit", icon: Activity }
  ];

  const ready = checks.filter((item) => item.ok).length;
  const score = Math.round((ready / checks.length) * 100);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-sm font-black text-cyan-300">Release Readiness 3.0</p><h1 className="mt-2 text-3xl font-black">مركز جاهزية المنصة</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">فحص تشغيلي للوحدات الأساسية والبيانات قبل اعتماد الإصدار للإنتاج.</p></div>
            <div className="rounded-3xl border border-white/10 bg-white/10 px-8 py-5 text-center"><p className="text-xs text-slate-300">درجة الجاهزية</p><p className="mt-1 text-4xl font-black">{score}%</p><p className="mt-1 text-xs text-slate-400">{ready} من {checks.length} فحوصات</p></div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {checks.map(({ label, ok, note, href, icon: Icon }) => (
            <Link key={label} href={href} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
              <div className="flex items-start justify-between gap-4"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><Icon size={22} /></span>{ok ? <CheckCircle2 className="text-emerald-600" size={20} /> : <TriangleAlert className="text-amber-600" size={20} />}</div>
              <h2 className="mt-4 font-black text-slate-950">{label}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-950">
          <p className="font-black">آخر فحص: {now.toLocaleString("ar-MA")}</p>
          <p className="mt-1">نجاح هذا الفحص يؤكد سلامة الاستعلامات الأساسية، لكنه لا يستبدل اختبار البناء على Vercel واختبار الصلاحيات والطباعة على بيئة الإنتاج.</p>
        </section>
      </div>
    </AppShell>
  );
}
