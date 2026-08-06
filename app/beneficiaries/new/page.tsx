import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BeneficiaryForm } from "@/components/BeneficiaryForm";
import { currentSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function NewBeneficiaryPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">التسجيل القبلي</p>
          <h1 className="mt-3 text-3xl font-black md:text-5xl">فتح ملف مستفيد جديد</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-blue-50 md:text-base">
            اجمع المعلومات الأساسية والاجتماعية والدراسية وميولات المستفيد. سيُحفظ الملف تلقائيًا بحالة «مسجل أوليًا» إلى حين استكمال التشخيص والقبول.
          </p>
        </header>

        <BeneficiaryForm />
      </div>
    </AppShell>
  );
}
