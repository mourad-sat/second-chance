"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ROLE_LABELS } from "@/lib/permissions";

type CurrentUser = { fullName: string; email: string; role: string };

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const role = user?.role || "VIEWER";

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <Sidebar role={role} />
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="القائمة الرئيسية">
          <button className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" />
          <div className="relative h-full w-fit shadow-2xl"><Sidebar role={role} mobile onClose={() => setMenuOpen(false)} /></div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden" aria-label="فتح القائمة"><Menu size={20} /></button>
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input aria-label="البحث السريع" placeholder="ابحث عن مستفيد أو ملف..." className="w-80 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm outline-none transition focus:border-blue-400 focus:bg-white" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600" aria-label="الإشعارات"><Bell size={19} /><span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" /></button>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">{user?.fullName?.charAt(0) || "م"}</div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">{user?.fullName || "المستخدم"}</p>
                <p className="text-xs text-slate-500">{user ? ROLE_LABELS[user.role] || user.role : "جارٍ التحميل"}</p>
              </div>
            </div>
            <button onClick={logout} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-red-50 hover:text-red-700" aria-label="تسجيل الخروج"><LogOut size={19} /></button>
          </div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
