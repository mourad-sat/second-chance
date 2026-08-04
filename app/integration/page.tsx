import { BriefcaseBusiness, Building2, Rocket } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function IntegrationPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <p className="mb-2 text-sm font-semibold text-blue-600">ما بعد التكوين</p>
        <h2 className="text-3xl font-bold text-slate-900">الإدماج المهني</h2>
        <p className="mt-2 text-slate-500">تتبع فرص العمل والتداريب والعمل الحر بعد نهاية المسار.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["فرص الشغل", "تسجيل العروض والترشيحات والمقابلات", BriefcaseBusiness],
            ["الشركاء", "المؤسسات والشركات المستقبلة", Building2],
            ["العمل الحر", "تتبع المشاريع والمقاولة الذاتية", Rocket]
          ].map(([title, description, Icon]) => (
            <article key={String(title)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-600"><Icon size={22} /></div>
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
