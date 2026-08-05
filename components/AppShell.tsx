"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BellRing,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  Command,
  GitBranch,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  UserPlus,
  Users,
  X
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { DashboardAnalytics } from "./DashboardAnalytics";
import { ReportExplorer } from "./ReportExplorer";
import { ROLE_LABELS } from "@/lib/permissions";

type CurrentUser = { fullName: string; email: string; role: string };

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  keywords: string;
};

const navigationItems: NavigationItem[] = [
  { href: "/", label: "لوحة القيادة", description: "المؤشرات والأنشطة والتنبيهات", icon: LayoutDashboard, keywords: "الرئيسية dashboard احصائيات" },
  { href: "/beneficiaries", label: "المستفيدون", description: "البحث وإدارة الملفات", icon: Users, keywords: "مستفيد ملفات تسجيل" },
  { href: "/beneficiaries/new", label: "تسجيل مستفيد", description: "إنشاء ملف جديد", icon: UserPlus, keywords: "اضافة جديد تسجيل" },
  { href: "/admissions", label: "التشخيص والقبول", description: "المقابلات وقرارات اللجنة", icon: ClipboardCheck, keywords: "تشخيص قبول مقابلة لجنة" },
  { href: "/workflow", label: "سير الملفات", description: "مراحل رحلة المستفيد", icon: GitBranch, keywords: "workflow مراحل انتقال" },
  { href: "/attendance", label: "الحضور والغياب", description: "التسجيل اليومي والمواظبة", icon: CalendarCheck2, keywords: "حضور غياب تأخر" },
  { href: "/academic-tracking", label: "التتبع التربوي", description: "النتائج وخطط الدعم", icon: BookOpenCheck, keywords: "تربوي نتائج دعم" },
  { href: "/social-support", label: "المواكبة الاجتماعية", description: "المتابعات والتدخلات", icon: HeartHandshake, keywords: "اجتماعي مواكبة تدخل" },
  { href: "/vocational-training", label: "التكوين المهني", description: "المسارات والكفايات", icon: GraduationCap, keywords: "تكوين مهني كفايات" },
  { href: "/integration", label: "الإدماج المهني", description: "التدريب والتشغيل والمشاريع", icon: BriefcaseBusiness, keywords: "ادماج تشغيل تدريب مشروع" },
  { href: "/reports", label: "التقارير والإحصائيات", description: "التحليل والتصدير", icon: BarChart3, keywords: "تقرير احصائيات pdf excel" },
  { href: "/notifications", label: "مركز الإشعارات", description: "التنبيهات والمهام", icon: BellRing, keywords: "اشعارات تنبيهات مهام" },
  { href: "/settings", label: "الإعدادات", description: "المستخدمون والصلاحيات", icon: Settings, keywords: "اعدادات مستخدم صلاحيات" }
];

const pageLabels: Record<string, string> = {
  beneficiaries: "المستفيدون",
  new: "تسجيل مستفيد",
  overview: "مركز قيادة المستفيد",
  documents: "الوثائق",
  "smart-orientation": "التوجيه الذكي",
  admissions: "التشخيص والقبول",
  workflow: "سير الملفات",
  attendance: "الحضور والغياب",
  "academic-tracking": "التتبع التربوي",
  "social-support": "المواكبة الاجتماعية",
  "vocational-training": "التكوين المهني",
  integration: "الإدماج المهني",
  reports: "التقارير والإحصائيات",
  notifications: "مركز الإشعارات",
  settings: "الإعدادات"
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setAccountOpen(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
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

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return navigationItems.slice(0, 7);
    return navigationItems.filter((item) => `${item.label} ${item.description} ${item.keywords}`.toLowerCase().includes(normalized));
  }, [query]);

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (!segments.length) return [{ href: "/", label: "لوحة القيادة" }];
    return [
      { href: "/", label: "الرئيسية" },
      ...segments.map((segment, index) => ({
        href: `/${segments.slice(0, index + 1).join("/")}`,
        label: pageLabels[segment] || (segment.length > 18 ? "تفاصيل الملف" : segment)
      }))
    ];
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  function navigate(href: string) {
    setCommandOpen(false);
    setQuery("");
    router.push(href);
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
          <div className="relative mr-0 h-full w-fit shadow-2xl"><Sidebar role={role} mobile onClose={() => setMenuOpen(false)} /></div>
        </div>
      )}

      {commandOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/55 px-4 pt-[10vh] backdrop-blur-md" onClick={() => setCommandOpen(false)}>
          <section dir="rtl" role="dialog" aria-modal="true" aria-label="البحث والتنقل السريع" className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/20 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <Search className="shrink-0 text-blue-600" size={21} />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن وحدة أو إجراء داخل المنصة..." className="h-10 flex-1 border-0 bg-transparent text-base font-semibold shadow-none outline-none focus:shadow-none" />
              <button type="button" onClick={() => setCommandOpen(false)} className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200" aria-label="إغلاق"><X size={17} /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              <p className="px-3 pb-2 pt-1 text-[11px] font-black text-slate-400">الوصول السريع</p>
              {searchResults.length ? searchResults.map(({ href, label, description, icon: Icon }) => (
                <button key={href} type="button" onClick={() => navigate(href)} className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right hover:bg-blue-50">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-700 group-hover:shadow-sm"><Icon size={20} /></span>
                  <span className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{label}</strong><span className="mt-1 block truncate text-xs text-slate-500">{description}</span></span>
                  <ChevronLeft size={17} className="text-slate-300 group-hover:text-blue-600" />
                </button>
              )) : <div className="py-12 text-center"><Search className="mx-auto text-slate-300" size={35} /><p className="mt-3 font-bold text-slate-600">لا توجد نتائج مطابقة</p></div>}
            </div>
            <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold text-slate-500">
              <span>اضغط على النتيجة للانتقال مباشرة</span><span className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono">Ctrl K</span>
            </footer>
          </section>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/82 shadow-[0_8px_30px_-24px_rgba(15,35,70,0.65)] backdrop-blur-2xl">
          <div className="mx-auto flex h-[74px] max-w-[1680px] items-center justify-between gap-3 px-4 md:px-7">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button onClick={() => setMenuOpen(true)} className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden" aria-label="فتح القائمة"><Menu size={20} /></button>

              <button type="button" onClick={() => setCommandOpen(true)} className="group hidden h-11 w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 text-right text-sm text-slate-400 shadow-inner shadow-slate-100/60 hover:border-blue-200 hover:bg-white md:flex">
                <Search size={18} />
                <span className="flex-1">ابحث عن مستفيد، وحدة، تقرير أو إجراء...</span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-[10px] font-bold text-slate-500"><Command size={11} /> K</span>
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <NotificationBell />
              <div className="relative">
                <button type="button" onClick={() => setAccountOpen((value) => !value)} className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/90 px-2.5 py-2 shadow-sm hover:border-blue-200 sm:px-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 text-sm font-black text-white shadow-lg shadow-blue-200/80">{user?.fullName?.charAt(0) || "م"}</div>
                  <div className="hidden min-w-0 text-right sm:block"><p className="max-w-36 truncate text-sm font-black text-slate-800">{user?.fullName || "المستخدم"}</p><p className="max-w-36 truncate text-[11px] font-semibold text-slate-500">{user ? ROLE_LABELS[user.role] || user.role : "جارٍ التحميل"}</p></div>
                  <ChevronDown size={15} className={`hidden text-slate-400 transition sm:block ${accountOpen ? "rotate-180" : ""}`} />
                </button>
                {accountOpen && (
                  <div className="absolute left-0 top-[calc(100%+0.65rem)] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="border-b border-slate-100 p-4"><p className="font-black text-slate-900">{user?.fullName || "المستخدم"}</p><p className="mt-1 truncate text-xs text-slate-500">{user?.email || ""}</p></div>
                    <div className="p-2"><Link href="/settings" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"><Settings size={17} /> إعدادات الحساب والمنصة</Link><button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-red-700 hover:bg-red-50"><LogOut size={17} /> تسجيل الخروج</button></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-3 px-4 pb-3 md:px-7">
            <nav aria-label="مسار الصفحة" className="flex min-w-0 items-center gap-1.5 overflow-hidden text-xs font-semibold text-slate-500">
              {breadcrumbs.map((item, index) => (
                <span key={`${item.href}-${index}`} className="flex min-w-0 items-center gap-1.5">
                  {index > 0 && <ChevronLeft size={13} className="shrink-0 text-slate-300" />}
                  {index === breadcrumbs.length - 1 ? <span className="truncate font-black text-slate-800">{item.label}</span> : <Link href={item.href} className="truncate hover:text-blue-700">{item.label}</Link>}
                </span>
              ))}
            </nav>
            <button type="button" onClick={() => setCommandOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm md:hidden"><Search size={15} /> بحث</button>
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
