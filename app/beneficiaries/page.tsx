import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";

const statusLabels: Record<string, string> = {
  PRE_REGISTERED: "مسجل أوليًا",
  UNDER_REVIEW: "قيد الدراسة",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "مقبول",
  REJECTED: "غير مقبول",
  ENROLLED: "متمدرس",
  WITHDRAWN: "منسحب",
  COMPLETED: "أنهى البرنامج"
};

export const dynamic = "force-dynamic";

export default async function BeneficiariesPage() {
  const beneficiaries = await prisma.beneficiary.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">المستفيدون</h2>
          <p className="mt-2 text-slate-600">إدارة التسجيل والملفات والوضعيات</p>
        </div>
        <Link href="/beneficiaries/new" className="whitespace-nowrap rounded-xl bg-slate-900 px-5 py-3 text-white">تسجيل مستفيد جديد</Link>
      </div>

      {beneficiaries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">لا توجد ملفات مسجلة بعد.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4">المستفيد</th>
                <th className="px-5 py-4">رقم الهوية/مسار</th>
                <th className="px-5 py-4">الهاتف</th>
                <th className="px-5 py-4">المستوى الدراسي</th>
                <th className="px-5 py-4">الوضعية</th>
                <th className="px-5 py-4">تاريخ التسجيل</th>
                <th className="px-5 py-4">الملف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {beneficiaries.map((beneficiary) => (
                <tr key={beneficiary.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium">
                    <Link href={`/beneficiaries/${beneficiary.id}`} className="hover:underline">
                      {beneficiary.firstName} {beneficiary.lastName}
                    </Link>
                  </td>
                  <td className="px-5 py-4">{beneficiary.identityNumber || "—"}</td>
                  <td className="px-5 py-4">{beneficiary.phone || "—"}</td>
                  <td className="px-5 py-4">{beneficiary.lastEducationLevel || "—"}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1">{statusLabels[beneficiary.status] || beneficiary.status}</span></td>
                  <td className="px-5 py-4">{new Intl.DateTimeFormat("ar-MA").format(beneficiary.createdAt)}</td>
                  <td className="px-5 py-4">
                    <Link href={`/beneficiaries/${beneficiary.id}`} className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-100">
                      فتح الملف
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
