import Link from "next/link";
import { Database, Settings, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";

const cards = [
  { title: "الإعدادات العامة", description: "اسم المؤسسة والموسم الدراسي والهوية", icon: Settings, href: null },
  { title: "المستخدمون والصلاحيات", description: "إدارة الحسابات والأدوار ومسؤوليات فريق العمل", icon: ShieldCheck, href: "/settings/users" },
  { title: "تخزين الوثائق", description: "متابعة Vercel Blob وترحيل الملفات القديمة بأمان", icon: Database, href: "/settings/storage" }
];

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <p className="mb-2 text-sm font-semibold text-blue-600">إدارة المنصة</p>
        <h2 className="text-3xl font-bold text-slate-900">الإعدادات</h2>
        <p className="mt-2 text-slate-500">إعدادات الموسم والمستخدمين والبيانات الأساسية.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {cards.map(({ title, description, icon: Icon, href }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-3 text-slate-700"><Icon size={22} /></div>
              <h3 className="font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              {href ? <Link href={href} className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">فتح الإدارة</Link> : <span className="mt-5 inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">قريبًا</span>}
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
