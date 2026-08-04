import { Database, Settings, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <p className="mb-2 text-sm font-semibold text-blue-600">إدارة المنصة</p>
        <h2 className="text-3xl font-bold text-slate-900">الإعدادات</h2>
        <p className="mt-2 text-slate-500">إعدادات الموسم والمستخدمين والبيانات الأساسية.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["الإعدادات العامة", "اسم المؤسسة والموسم الدراسي والهوية", Settings],
            ["المستخدمون والصلاحيات", "إدارة الحسابات والأدوار", ShieldCheck],
            ["البيانات والنسخ الاحتياطي", "سلامة البيانات وإدارة النسخ", Database]
          ].map(([title, description, Icon]) => (
            <article key={String(title)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-3 text-slate-700"><Icon size={22} /></div>
              <h3 className="font-bold text-slate-900">{String(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{String(description)}</p>
              <button className="mt-5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">قريبًا</button>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
