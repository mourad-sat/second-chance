import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VocationalTrainingManager } from "@/components/VocationalTrainingManager";
import { PageContainer, PageHeader } from "@/components/ui/SystemUI";
import { currentSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function VocationalTrainingPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          eyebrow="التأهيل المهني"
          title="التكوين المهني"
          description="إدارة المسارات والكفايات والورشات والمشاريع والتداريب الميدانية ضمن مساحة تشغيل موحدة."
          icon={GraduationCap}
        />
        <VocationalTrainingManager />
      </PageContainer>
    </AppShell>
  );
}
