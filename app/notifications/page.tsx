import { AppShell } from "@/components/AppShell";
import { NotificationsCenter } from "@/components/NotificationsCenter";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold text-blue-600">المتابعة الاستباقية</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">مركز الإشعارات الذكي</h1>
          <p className="mt-2 text-slate-600">تنبيهات مولدة تلقائيًا من بيانات المواظبة وخطط الدعم والمواكبة الاجتماعية والتداريب المهنية.</p>
        </header>
        <NotificationsCenter />
      </div>
    </AppShell>
  );
}
