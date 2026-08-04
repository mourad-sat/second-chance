"use client";

import Link from "next/link";
import { Search, UserPlus, Eye, Phone, GraduationCap, Users, UserCheck, UserX } from "lucide-react";
import { useMemo, useState } from "react";

type BeneficiaryRow = {
  id: string;
  fileNumber: string;
  firstName: string;
  lastName: string;
  identityNumber: string | null;
  phone: string | null;
  lastEducationLevel: string | null;
  status: string;
  createdAt: string;
  groupName: string | null;
  specialty: string | null;
  attendanceRate: number | null;
};

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

const statusClasses: Record<string, string> = {
  PRE_REGISTERED: "bg-slate-100 text-slate-700",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  WAITLISTED: "bg-orange-50 text-orange-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  ENROLLED: "bg-blue-50 text-blue-700",
  WITHDRAWN: "bg-rose-50 text-rose-700",
  COMPLETED: "bg-violet-50 text-violet-700"
};

export function BeneficiariesManager({ beneficiaries }: { beneficiaries: BeneficiaryRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return beneficiaries.filter((item) => {
      const matchesStatus = status === "ALL" || item.status === status;
      const searchable = [
        item.firstName,
        item.lastName,
        item.fileNumber,
        item.identityNumber || "",
        item.phone || "",
        item.groupName || "",
        item.specialty || ""
      ].join(" ").toLowerCase();
      return matchesStatus && (!normalized || searchable.includes(normalized));
    });
  }, [beneficiaries, query, status]);

  const enrolled = beneficiaries.filter((item) => item.status === "ENROLLED").length;
  const accepted = beneficiaries.filter((item) => item.status === "ACCEPTED").length;
  const inactive = beneficiaries.filter((item) => ["WITHDRAWN", "REJECTED"].includes(item.status)).length;

  const cards = [
    { label: "إجمالي الملفات", value: beneficiaries.length, icon: Users },
    { label: "المتمدرسون", value: enrolled, icon: GraduationCap },
    { label: "المقبولون", value: accepted, icon: UserCheck },
    { label: "غير النشطين", value: inactive, icon: UserX }
  ];

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
              </div>
              <span className="rounded-xl bg-slate-100 p-3 text-slate-700"><Icon size={22} /></span>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث بالاسم، رقم الملف، الهاتف أو المجموعة..."
                className="w-full rounded-xl border border-slate-200 py-3 pr-11 pl-4 outline-none focus:border-blue-500"
              />
            </label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500">
              <option value="ALL">كل الوضعيات</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <Link href="/beneficiaries/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700">
            <UserPlus size={18} /> مستفيد جديد
          </Link>
        </div>

        <div className="flex items-center justify-between px-5 py-3 text-sm text-slate-500">
          <span>النتائج المعروضة: {filtered.length}</span>
          <span>إجمالي الملفات: {beneficiaries.length}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">لا توجد نتائج مطابقة لمعايير البحث.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-right text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4">المستفيد</th>
                  <th className="px-5 py-4">رقم الملف</th>
                  <th className="px-5 py-4">المجموعة والشعبة</th>
                  <th className="px-5 py-4">التواصل</th>
                  <th className="px-5 py-4">الحضور</th>
                  <th className="px-5 py-4">الوضعية</th>
                  <th className="px-5 py-4">التسجيل</th>
                  <th className="px-5 py-4">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                          {item.firstName.slice(0, 1)}{item.lastName.slice(0, 1)}
                        </span>
                        <div>
                          <Link href={`/beneficiaries/${item.id}`} className="font-semibold text-slate-900 hover:text-blue-600">{item.firstName} {item.lastName}</Link>
                          <p className="mt-1 text-xs text-slate-500">{item.lastEducationLevel || "المستوى غير محدد"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{item.fileNumber}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{item.groupName || "غير مسند"}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.specialty || "الشعبة غير محددة"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-2 text-slate-700"><Phone size={14} /> {item.phone || "—"}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.identityNumber || "لا يوجد رقم هوية"}</p>
                    </td>
                    <td className="px-5 py-4">
                      {item.attendanceRate === null ? "—" : (
                        <div className="w-24">
                          <div className="mb-1 flex justify-between text-xs"><span>{item.attendanceRate}%</span></div>
                          <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${item.attendanceRate}%` }} /></div>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses[item.status] || "bg-slate-100"}`}>{statusLabels[item.status] || item.status}</span></td>
                    <td className="px-5 py-4 text-slate-600">{new Intl.DateTimeFormat("ar-MA").format(new Date(item.createdAt))}</td>
                    <td className="px-5 py-4">
                      <Link href={`/beneficiaries/${item.id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                        <Eye size={16} /> فتح الملف
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
