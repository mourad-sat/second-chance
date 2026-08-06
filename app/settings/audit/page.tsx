import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/session";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type PageProps = {
  searchParams?: { page?: string };
};

export default async function AuditLogPage({ searchParams }: PageProps) {
  const session = await currentSession();
  if (!session) redirect("/login");
  if (!isAdminRole(session.role)) redirect("/");

  const requestedPage = Number.parseInt(searchParams?.page || "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      select: {
        id: true,
        createdAt: true,
        action: true,
        entityType: true,
        entityId: true,
        description: true,
        user: { select: { fullName: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages && total > 0) redirect(`/settings/audit?page=${totalPages}`);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-black text-blue-700">الحوكمة والأمن</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">سجل التدقيق الإداري</h1>
          <p className="mt-2 text-sm text-slate-600">عرض آمن ومقسم لجميع العمليات الحساسة المنفذة داخل المنصة.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="app-card p-5"><Activity className="text-blue-700" /><p className="mt-3 text-sm font-bold text-slate-500">إجمالي العمليات</p><p className="mt-1 text-3xl font-black">{total}</p></article>
          <article className="app-card p-5"><ShieldCheck className="text-emerald-700" /><p className="mt-3 text-sm font-bold text-slate-500">حالة التوثيق</p><p className="mt-1 text-xl font-black text-emerald-700">مفعّل</p></article>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[1000px]">
              <thead><tr><th>التاريخ</th><th>العملية</th><th>الكيان</th><th>المستخدم</th><th>الوصف</th></tr></thead>
              <tbody>{logs.map((log) => <tr key={log.id}><td className="whitespace-nowrap">{log.createdAt.toLocaleString("ar-MA")}</td><td><span className="status-badge status-info">{log.action}</span></td><td>{log.entityType || "—"}<p className="mt-1 font-mono text-[10px] text-slate-400">{log.entityId || ""}</p></td><td>{log.user?.fullName || "النظام"}<p className="mt-1 text-xs text-slate-400">{log.user?.email || ""}</p></td><td className="max-w-xl text-sm leading-6 text-slate-600">{log.description || "—"}</td></tr>)}</tbody>
            </table>
          </div>
          {!logs.length && <div className="empty-state m-5"><Activity className="mx-auto text-slate-300" size={36} /><p className="mt-3 font-black">لا توجد عمليات مسجلة بعد.</p></div>}
        </section>

        {totalPages > 1 && (
          <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold">
            <Link aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none text-slate-300" : "text-blue-700"} href={`/settings/audit?page=${page - 1}`}>الصفحة السابقة</Link>
            <span className="text-slate-600">الصفحة {page} من {totalPages}</span>
            <Link aria-disabled={page >= totalPages} className={page >= totalPages ? "pointer-events-none text-slate-300" : "text-blue-700"} href={`/settings/audit?page=${page + 1}`}>الصفحة التالية</Link>
          </nav>
        )}
      </div>
    </AppShell>
  );
}
