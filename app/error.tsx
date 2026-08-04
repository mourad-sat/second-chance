"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-red-600">تعذر إتمام العملية</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">حدث خطأ غير متوقع</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">أعد المحاولة. إذا استمر الخطأ، سجّل الصفحة والخطوة التي سبقت ظهوره ضمن ملاحظات الاختبار.</p>
        <button onClick={reset} className="mt-6 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white">
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
