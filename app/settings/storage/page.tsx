import { AppShell } from "@/components/AppShell";
import { StorageMigrationManager } from "@/components/StorageMigrationManager";

export const dynamic = "force-dynamic";

export default function StorageSettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold text-blue-600">إدارة التخزين</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">تخزين الوثائق الخارجي</h1>
          <p className="mt-2 text-slate-600">متابعة نقل الوثائق من PostgreSQL إلى مخزن Vercel Blob الخاص دون فقدان الملفات القديمة.</p>
        </header>
        <StorageMigrationManager />
      </div>
    </AppShell>
  );
}
