"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { DashboardAnalytics } from "./DashboardAnalytics";
import { ReportExplorer } from "./ReportExplorer";
import { ROLE_LABELS } from "@/lib/permissions";

type CurrentUser = { fullName: string; email: string; role: string };

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const beneficiaryMatch = pathname.match(/^\/beneficiaries\/([^/]+)$/);
    if (!beneficiaryMatch) return;

    function handleProfileAction(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;
      const label = button.textContent?.replace(/\s+/g, " ").trim() || "";

      if (label.includes("وثيقة")) {
        event.preventDefault();
        router.push(`/beneficiaries/${beneficiaryMatch![1]}/documents`);
        return;
      }

      if (label.includes("طباعة") || label.includes("PDF")) {
        event.preventDefault();
        window.print();
      }
    }

    document.addEventListener("click", handleProfileAction);
    return () => document.removeEventListener("click", handleProfileAction);
  }, [pathname, router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const role = user?.role || "VIEWER";

  return (
    <div dir="rtl" className="relative min-h-screen overflow-x-hidden lg:flex">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-emerald-200/15 blur-3xl" />
      </div>

      <Sidebar role={role} />

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="القائمة الرئيسية">
          <button className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" />
          <div className="relative mr-0 h-full w-fit shadow-2xl">
            <Sidebar role={role} mobile onClose={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 shadow-[0_8px_30px_-24px_rgba(15,35,70,0.65)] backdrop-blur-2xl">
          <div className="mx-auto flex h-[74px] max-w-[1680px] items-center justify-between gap-3 px-4 md:px-7">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button onClick={() => setMenuOpen(true)} className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden" aria-label="فتح القائمة">
                <Menu size={20} />
              </button>

              <div className="relative hidden w-full max-w-xl md:block">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  aria-label="البحث السريع"
                  placeholder="ابحث عن مستفيد، رقم تسجيل، ملف أو وثيقة..."
                  className="h-11 w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 py-2 pl-4 pr-11 text-sm text-slate-800 shadow-inner shadow-slate-100/60 outline-none placeholder:text-slate-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <NotificationBell />
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/90 px-2.5 py-2 shadow-sm sm:px-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 text-sm font-black text-white shadow-lg shadow-blue-200/80">
                  {user?.fullName?.charAt(0) || "م"}
                </div>
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="max-w-36 truncate text-sm font-black text-slate-800">{user?.fullName || "المستخدم"}</p>
                  <p className="max-w-36 truncate text-[11px] font-semibold text-slate-500">{user ? ROLE_LABELS[user.role] || user.role : "جارٍ التحميل"}</p>
                </div>
                <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
              </div>
              <button onClick={logout} className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700" aria-label="تسجيل الخروج">
                <LogOut size={19} />
              </button>
            </div>
          </div>

          <div className="px-4 pb-3 md:hidden">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input aria-label="البحث السريع" placeholder="ابحث داخل المنصة..." className="h-10 w-full rounded-xl border border-slate-200 bg-white/90 py-2 pl-4 pr-10 text-sm shadow-sm outline-none" />
            </div>
          </div>
          <div className="h-px bg-gradient-to-l from-transparent via-blue-400/40 to-transparent" />
        </header>

        <main className="p-4 sm:p-5 md:p-7 xl:p-8">
          <div className="page-enter mx-auto w-full max-w-[1600px]">
            {children}
            {pathname === "/" && <DashboardAnalytics />}
            {pathname === "/reports" && <ReportExplorer />}
          </div>
        </main>
      </div>
    </div>
  );
}
