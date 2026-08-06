import { redirect } from "next/navigation";
import { BellRing } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { NotificationsCenter } from "@/components/NotificationsCenter";
import { PageContainer, PageHeader } from "@/components/ui/SystemUI";
import { currentSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  return (
    <AppShell>
      <PageContainer className="max-w-7xl">
        <PageHeader
          eyebrow="المتابعة الاستباقية"
          title="مركز الإشعارات الذكي"
          description="تنبيهات مولدة تلقائيًا من بيانات المواظبة وخطط الدعم والمواكبة الاجتماعية والتداريب المهنية."
          icon={BellRing}
        />
        <NotificationsCenter />
      </PageContainer>
    </AppShell>
  );
}
