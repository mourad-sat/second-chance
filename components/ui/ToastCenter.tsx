"use client";

import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

type ToastTone = "success" | "error" | "warning" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };

export function showToast(message: string, tone: ToastTone = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("second-chance:toast", { detail: { message, tone } }));
}

export function ToastCenter() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handle(event: Event) {
      const detail = (event as CustomEvent<{ message: string; tone?: ToastTone }>).detail;
      if (!detail?.message) return;
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const item: ToastItem = { id, message: detail.message, tone: detail.tone || "info" };
      setItems((current) => [...current.slice(-3), item]);
      window.setTimeout(() => setItems((current) => current.filter((toast) => toast.id !== id)), 4500);
    }
    window.addEventListener("second-chance:toast", handle);
    return () => window.removeEventListener("second-chance:toast", handle);
  }, []);

  const styles = {
    success: { box: "border-emerald-200 bg-white text-emerald-900", icon: CheckCircle2, iconClass: "bg-emerald-50 text-emerald-700" },
    error: { box: "border-rose-200 bg-white text-rose-900", icon: CircleAlert, iconClass: "bg-rose-50 text-rose-700" },
    warning: { box: "border-amber-200 bg-white text-amber-900", icon: TriangleAlert, iconClass: "bg-amber-50 text-amber-700" },
    info: { box: "border-sky-200 bg-white text-sky-900", icon: Info, iconClass: "bg-sky-50 text-sky-700" }
  };

  return (
    <div dir="rtl" className="pointer-events-none fixed left-4 top-4 z-[100] flex w-[min(92vw,25rem)] flex-col gap-3" aria-live="polite">
      {items.map((item) => {
        const style = styles[item.tone];
        const Icon = style.icon;
        return (
          <div key={item.id} className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl shadow-slate-900/10 ${style.box}`}>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${style.iconClass}`}><Icon size={19} /></span>
            <p className="min-w-0 flex-1 pt-2 text-sm font-bold leading-6">{item.message}</p>
            <button type="button" onClick={() => setItems((current) => current.filter((toast) => toast.id !== item.id))} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="إغلاق التنبيه"><X size={16} /></button>
          </div>
        );
      })}
    </div>
  );
}
