import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { Activity, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({ include: { user: { select: { fullName: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header><p className="text-sm font-black text-blue-700">الحوكمة والأمن</p><h1 className="mt-1 text-3xl font-black text-slate-950">سجل التدقيق الإداري</h1><p className="mt-2 text-sm text-slate-600">آخر 200 عملية حساسة منفذة داخل المنصة.</p></header>
        <section className="grid gap-4 sm:grid-cols-2"><article className="app-card p-5"><Activity className="text-blue-700" /><p className="mt-3 text-sm font-bold text-slate-500">العمليات المعروضة</p><p className="mt-1 text-3xl font-black">{logs.length}</p></article><article className="app-card p-5"><ShieldCheck className="text-emerald-700" /><p className="mt-3 text-sm font-bold text-slate-500">حالة التوثيق</p><p className="mt-1 text-xl font-black text-emerald-700">مفعّل</p></article></section>
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto"><table className="data-table min-w-[1000px]"><thead><tr><th>التاريخ</th><th>العملية</th><th>الكيان</th><th>المستخدم</th><th>الوصف</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td className="whitespace-nowrap">{log.createdAt.toLocaleString("ar-MA")}</td><td><span className="status-badge status-info">{log.action}</span></td><td>{log.entityType || "—"}<p className="mt-1 font-mono text-[10px] text-slate-400">{log.entityId || ""}</p></td><td>{log.user?.fullName || "النظام"}<p className="mt-1 text-xs text-slate-400">{log.user?.email || ""}</p></td><td className="max-w-xl text-sm leading-6 text-slate-600">{log.description || "—"}</td></tr>)}</tbody></table></div>
          {!logs.length && <div className="empty-state m-5"><Activity className="mx-auto text-slate-300" size={36} /><p className="mt-3 font-black">لا توجد عمليات مسجلة بعد.</p></div>}
        </section>
      </div>
    </AppShell>
  );
}
