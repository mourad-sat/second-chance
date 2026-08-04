import { BarChart3, Download, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <p className="mb-2 text-sm font-semibold text-blue-600">القيادة واتخاذ القرار</p>
        <h2 className="text-3xl font-bold text-slate-900">التقارير والإحصائيات</h2>
        <p className="mt-2 text-slate-500">مركز موحد للتقارير الفردية والجماعية والسنوية.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["تقرير المستفيد", "الملف والحضور والنتائج والمواكبة", FileText],
            ["تقرير المجموعة", "المواظبة والنتائج وحالات التعثر", BarChart3],
            ["تقرير الموسم", "مؤشرات التسجيل والنجاح والإدماج", Download]
          ].map(([title, description, Icon]) => (
            <article key={String(title)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={22} /></div>
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
