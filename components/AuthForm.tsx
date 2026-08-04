"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "setup" }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر إتمام العملية.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-600 p-3 text-white"><LockKeyhole size={24} /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{mode === "login" ? "تسجيل الدخول" : "إنشاء المدير الأول"}</h1>
          <p className="mt-1 text-sm text-slate-500">منصة تدبير برنامج الفرصة الثانية</p>
        </div>
      </div>
      <div className="space-y-4">
        {mode === "setup" && <label><span className="mb-2 block text-sm font-medium">الاسم الكامل</span><input required name="fullName" className={inputClass} /></label>}
        <label><span className="mb-2 block text-sm font-medium">البريد الإلكتروني</span><input required type="email" name="email" className={inputClass} /></label>
        <label><span className="mb-2 block text-sm font-medium">كلمة المرور</span><input required minLength={8} type="password" name="password" className={inputClass} /></label>
      </div>
      {message && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}
      <button disabled={saving} className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
        {saving ? "جارٍ التحقق..." : mode === "login" ? "دخول" : "إنشاء الحساب والدخول"}
      </button>
      <p className="mt-5 text-center text-xs text-slate-500">
        {mode === "login" ? <Link className="font-semibold text-blue-600" href="/setup">إعداد المنصة لأول مرة</Link> : <Link className="font-semibold text-blue-600" href="/login">لدي حساب بالفعل</Link>}
      </p>
    </form>
  );
}
