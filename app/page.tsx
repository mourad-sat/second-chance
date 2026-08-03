import { AppShell } from "@/components/AppShell";

const stats = [
  ["المسجلون", "0"],
  ["المقبولون", "0"],
  ["الحاضرون اليوم", "0"],
  ["ملفات تحتاج متابعة", "0"]
];

export default function DashboardPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">لوحة القيادة</h2>
        <p className="text-slate-600 mt-2">نظرة عامة على الموسم الدراسي الجاري</p>
      </header>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <article key={label} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </section>
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold mb-3">مراحل البرنامج</h3>
        <p className="text-slate-600">التسجيل ← التشخيص والقبول ← التمدرس والتكوين ← المواكبة ← التقويم ← الإدماج والتتبع.</p>
      </section>
    </AppShell>
  );
}
