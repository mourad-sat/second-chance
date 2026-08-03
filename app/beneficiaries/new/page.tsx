import { AppShell } from "@/components/AppShell";
import { BeneficiaryForm } from "@/components/BeneficiaryForm";

export default function NewBeneficiaryPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">تسجيل مستفيد جديد</h2>
        <p className="text-slate-600 mt-2">المرحلة الأولى: المعلومات الأساسية وبيانات الاتصال</p>
      </header>
      <BeneficiaryForm />
    </AppShell>
  );
}
