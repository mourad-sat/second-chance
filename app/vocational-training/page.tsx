import { AppShell } from "@/components/AppShell";
import { VocationalTrainingManager } from "@/components/VocationalTrainingManager";

export const dynamic = "force-dynamic";

export default function VocationalTrainingPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">التكوين المهني</h2>
        <p className="mt-2 text-slate-600">إدارة المسارات والكفايات والورشات والمشاريع والتداريب الميدانية</p>
      </header>
      <VocationalTrainingManager />
    </AppShell>
  );
}
