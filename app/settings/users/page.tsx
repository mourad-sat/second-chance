import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { UserManagement } from "@/components/UserManagement";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const permissions = [
  ["مدير النظام", "جميع الوحدات والإعدادات والمستخدمين"],
  ["مدير الجمعية", "القيادة والتقارير وإدارة فرق العمل"],
  ["منسق البرنامج", "المستفيدون وسير الملفات والتتبع والتكوين"],
  ["مدير المركز", "بيانات المركز والمجموعات والحضور"],
  ["المنشط التربوي", "الحضور والتتبع التربوي وملفات مجموعته"],
  ["الأخصائي الاجتماعي", "المواكبة الاجتماعية والبيانات الضرورية"],
  ["المكون المهني", "التكوين والكفايات والمشاريع المهنية"],
  ["مسؤول الإدماج", "التداريب والإدماج والشركاء"],
  ["قارئ فقط", "الاطلاع دون تعديل"]
];

export default async function UsersSettingsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/");

  const users = await prisma.user.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "asc" }] });
  const serialized = users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    centerName: user.centerName,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() || null
  }));

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold text-blue-600">الأمن وإدارة الوصول</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">المستخدمون والصلاحيات</h1>
          <p className="mt-2 text-slate-600">إدارة حسابات فريق العمل وتحديد المسؤولية التشغيلية لكل مستخدم.</p>
        </header>
        <section className="mb-6 grid gap-3 md:grid-cols-3">
          {permissions.map(([role, access]) => (
            <article key={role} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold text-slate-900">{role}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">{access}</p>
            </article>
          ))}
        </section>
        <UserManagement users={serialized} />
      </div>
    </AppShell>
  );
}
