"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div dir="rtl" className="grid min-h-[70vh] place-items-center p-5">
      <section className="w-full max-w-xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl shadow-rose-950/5 md:p-12">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-rose-50 text-rose-700"><AlertTriangle size={36} /></span>
        <p className="mt-6 text-sm font-black text-rose-700">تعذر إكمال العملية</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">حدث خطأ غير متوقع</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">لم يتم فقدان بياناتك. أعد المحاولة، وإذا استمر الخطأ فارجع إلى الصفحة السابقة أو تواصل مع مسؤول المنصة.</p>
        {error.digest && <p className="mt-3 text-xs font-mono text-slate-400">المرجع: {error.digest}</p>}
        <button type="button" onClick={reset} className="btn-primary mt-7"><RefreshCw size={17} /> إعادة المحاولة</button>
      </section>
    </div>
  );
}
