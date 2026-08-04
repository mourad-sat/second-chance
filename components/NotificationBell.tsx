"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Notification = {
  id: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  beneficiaryName?: string;
};

const storageKey = "second-chance-read-notifications";

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    try { setReadIds(JSON.parse(localStorage.getItem(storageKey) || "[]")); } catch { setReadIds([]); }
    fetch("/api/notifications", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { notifications: [] })
      .then((result) => setItems(result.notifications || []))
      .catch(() => setItems([]));
  }, []);

  const unread = useMemo(() => items.filter((item) => !readIds.includes(item.id)), [items, readIds]);

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50" aria-label="الإشعارات">
        <Bell size={19} />
        {unread.length > 0 && <span className="absolute -left-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">{Math.min(unread.length, 99)}</span>}
      </button>

      {open && (
        <div className="absolute left-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div><p className="font-bold text-slate-900">التنبيهات الذكية</p><p className="text-xs text-slate-500">{unread.length} غير مقروءة</p></div>
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs font-semibold text-blue-600">عرض الكل</Link>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {unread.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">لا توجد تنبيهات جديدة.</p> : unread.slice(0, 6).map((item) => (
              <Link key={item.id} href="/notifications" onClick={() => setOpen(false)} className="mb-1 block rounded-xl p-3 hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.priority === "CRITICAL" ? "bg-red-600" : item.priority === "HIGH" ? "bg-orange-500" : "bg-amber-400"}`} />
                  <div><p className="text-sm font-semibold text-slate-800">{item.title}</p>{item.beneficiaryName && <p className="mt-1 text-xs text-slate-500">{item.beneficiaryName}</p>}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
