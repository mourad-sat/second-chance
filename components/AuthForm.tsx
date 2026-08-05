"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound
} from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "setup" }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

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
        body: JSON.stringify({ ...payload, remember })
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

  const fieldClass = "h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-4 pr-12 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/80";

  return (
    <form onSubmit={submit} className="w-full max-w-[30rem]" noValidate>
      <div className="mb-8">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-black text-blue-800">
          <ShieldCheck size={15} /> فضاء آمن لإدارة البرنامج
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          {mode === "login" ? "مرحبًا بعودتك" : "إعداد المنصة لأول مرة"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
          {mode === "login"
            ? "سجّل دخولك للوصول إلى ملفات المستفيدين والتتبع والتكوين والإدماج."
            : "أنشئ حساب المدير الأول لبدء استعمال منصة تدبير برنامج الفرصة الثانية."}
        </p>
      </div>

      <div className="space-y-5">
        {mode === "setup" && (
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">الاسم الكامل</span>
            <span className="relative block">
              <UserRound className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
              <input required name="fullName" autoComplete="name" placeholder="الاسم الكامل للمدير" className={fieldClass} />
            </span>
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-black text-slate-700">البريد الإلكتروني</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input required type="email" name="email" autoComplete="email" inputMode="email" placeholder="name@example.com" className={fieldClass} dir="ltr" />
          </span>
        </label>

        <label className="block">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-black text-slate-700">كلمة المرور</span>
            {mode === "login" && <span className="text-xs font-semibold text-slate-400">8 أحرف على الأقل</span>}
          </div>
          <span className="relative block">
            <LockKeyhole className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input
              required
              minLength={8}
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="أدخل كلمة المرور"
              className={`${fieldClass} pl-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-blue-700"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
      </div>

      {mode === "login" && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
            />
            تذكرني على هذا الجهاز
          </label>
          <span className="font-bold text-blue-700">نسيت كلمة المرور؟ تواصل مع مدير المنصة</span>
        </div>
      )}

      {message && (
        <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold leading-6 text-red-800">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>{message}</span>
        </div>
      )}

      <button
        disabled={saving}
        className="group mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-blue-800 to-blue-600 px-5 text-base font-black text-white shadow-xl shadow-blue-200/70 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {saving ? (
          <><Loader2 className="animate-spin" size={20} /> جارٍ التحقق من البيانات...</>
        ) : (
          <>{mode === "login" ? "دخول إلى المنصة" : "إنشاء الحساب والدخول"}<ArrowLeft className="transition group-hover:-translate-x-1" size={19} /></>
        )}
      </button>

      <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
        <CheckCircle2 size={16} /> اتصال محمي وبياناتك مخصصة لتدبير البرنامج فقط
      </div>

      <p className="mt-6 text-center text-xs font-semibold text-slate-500">
        {mode === "login" ? (
          <>إعداد جديد للمنصة؟ <Link className="font-black text-blue-700 hover:underline" href="/setup">إنشاء المدير الأول</Link></>
        ) : (
          <>لديك حساب بالفعل؟ <Link className="font-black text-blue-700 hover:underline" href="/login">العودة إلى تسجيل الدخول</Link></>
        )}
      </p>
    </form>
  );
}
