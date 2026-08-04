"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type UserItem = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  centerName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "مدير النظام",
  ASSOCIATION_MANAGER: "مدير الجمعية",
  PROGRAM_COORDINATOR: "منسق البرنامج",
  CENTER_MANAGER: "مدير المركز",
  FACILITATOR: "منشط تربوي",
  SOCIAL_WORKER: "أخصائي اجتماعي",
  VOCATIONAL_TRAINER: "مكون مهني",
  INTEGRATION_OFFICER: "مسؤول الإدماج",
  VIEWER: "قارئ فقط"
};

const editableRoles = Object.entries(roleLabels).filter(([value]) => value !== "SUPER_ADMIN");

export function UserManagement({ users }: { users: UserItem[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = event.currentTarget;
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(result.message || "تعذر إنشاء الحساب.");
    form.reset();
    setMessage("تم إنشاء الحساب بنجاح.");
    router.refresh();
  }

  async function updateUser(id: string, data: Record<string, unknown>) {
    setMessage("");
    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data })
    });
    const result = await response.json();
    if (!response.ok) return setMessage(result.message || "تعذر تحديث الحساب.");
    setMessage("تم تحديث الحساب.");
    router.refresh();
  }

  const input = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm";

  return (
    <div className="space-y-6">
      <form onSubmit={createUser} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold">إضافة مستخدم</h3>
        <p className="mt-1 text-sm text-slate-500">أول حساب يُنشأ يصبح مدير النظام تلقائيًا.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input required name="fullName" placeholder="الاسم الكامل" className={input} />
          <input required type="email" name="email" placeholder="البريد الإلكتروني" className={input} />
          <input required minLength={8} type="password" name="password" placeholder="كلمة المرور" className={input} />
          <select name="role" className={input}>{editableRoles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <input name="centerName" placeholder="المركز أو المؤسسة" className={input} />
        </div>
        {message && <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm">{message}</p>}
        <button disabled={saving} className="mt-5 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "جارٍ الحفظ..." : "إنشاء الحساب"}</button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5"><h3 className="text-xl font-bold">الحسابات المسجلة</h3></div>
        {users.length === 0 ? <p className="p-8 text-center text-slate-500">لا توجد حسابات بعد. أنشئ حساب المدير الأول.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-4">المستخدم</th><th className="px-5 py-4">الدور</th><th className="px-5 py-4">المركز</th><th className="px-5 py-4">الحالة</th><th className="px-5 py-4">آخر دخول</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4"><p className="font-semibold">{user.fullName}</p><p className="text-xs text-slate-500">{user.email}</p></td>
                  <td className="px-5 py-4">{user.role === "SUPER_ADMIN" ? <span className="font-semibold">{roleLabels[user.role]}</span> : <select value={user.role} onChange={(e) => updateUser(user.id, { role: e.target.value })} className="rounded-lg border px-3 py-2">{editableRoles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}</td>
                  <td className="px-5 py-4">{user.centerName || "—"}</td>
                  <td className="px-5 py-4"><button onClick={() => updateUser(user.id, { isActive: !user.isActive })} className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{user.isActive ? "نشط" : "موقوف"}</button></td>
                  <td className="px-5 py-4 text-slate-500">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("ar-MA") : "لم يدخل بعد"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
