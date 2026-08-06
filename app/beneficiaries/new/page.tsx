import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BeneficiaryForm } from "@/components/BeneficiaryForm";
import { PageContainer, PageHeader } from "@/components/ui/SystemUI";
import { currentSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function NewBeneficiaryPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  return (
    <AppShell>
      <PageContainer className="max-w-6xl">
        <PageHeader
          eyebrow="التسجيل الداخلي"
          title="فتح ملف مستفيد جديد"
          description="اجمع المعلومات الأساسية والاجتماعية والدراسية وميولات المستفيد. سيُحفظ الملف بحالة «مسجل أوليًا» إلى حين استكمال التشخيص والقبول."
          icon={UserPlus}
        />
        <BeneficiaryForm />
      </PageContainer>
    </AppShell>
  );
}
