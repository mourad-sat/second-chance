import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function BeneficiariesPage() {
  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">المستفيدون</h2>
          <p className="text-slate-600 mt-2">إدارة التسجيل والملفات والوضعيات</p>
        </div>
        <Link href="/beneficiaries/new" className="rounded-xl bg-slate-900 px-5 py-3 text-white">تسجيل مستفيد جديد</Link>
      </div>
      <div className="rounded-2xl bg-white p-8 text-center border border-slate-200 shadow-sm">
        <p className="text-slate-600">لا توجد ملفات مسجلة بعد.</p>
      </div>
    </AppShell>
  );
}
