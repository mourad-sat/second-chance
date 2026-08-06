"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Archive, BarChart3, BellRing, BookOpenCheck, BrainCircuit, BriefcaseBusiness,
  CalendarCheck2, ClipboardCheck, GitBranch, GraduationCap, HeartHandshake,
  LayoutDashboard, PanelRightClose, PanelRightOpen, Settings, Trash2, UserPlus, Users, X
} from "lucide-react";
import { visibleForRole } from "@/lib/permissions";

const COLLAPSED_KEY = "second-chance-sidebar-collapsed";

const sections = [
  { title: "الرئيسية", items: [{ href: "/", label: "لوحة القيادة", icon: LayoutDashboard }, { href: "/notifications", label: "مركز الإشعارات", icon: BellRing }] },
  { title: "إدارة المستفيدين", items: [
    { href: "/beneficiaries", label: "المستفيدون", icon: Users },
    { href: "/beneficiaries/new", label: "تسجيل مستفيد", icon: UserPlus },
    { href: "/admissions", label: "التشخيص والقبول", icon: ClipboardCheck },
    { href: "/workflow", label: "سير الملفات", icon: GitBranch },
    { href: "/archive", label: "الأرشيف", icon: Archive },
    { href: "/trash", label: "سلة المحذوفات", icon: Trash2 }
  ]},
  { title: "التتبع والتكوين", items: [
    { href: "/attendance", label: "الحضور والغياب", icon: CalendarCheck2 },
    { href: "/academic-tracking", label: "التتبع التربوي", icon: BookOpenCheck },
    { href: "/social-support", label: "المواكبة الاجتماعية", icon: HeartHandshake },
    { href: "/vocational-training", label: "التكوين المهني", icon: GraduationCap }
  ]},
  { title: "القيادة والإدارة", items: [
    { href: "/intelligence", label: "مركز الذكاء والتحليل", icon: BrainCircuit },
    { href: "/reports", label: "التقارير والإحصائيات", icon: BarChart3 },
    { href: "/integration", label: "الإدماج المهني", icon: BriefcaseBusiness },
    { href: "/settings", label: "الإعدادات", icon: Settings }
  ]}
];

type SidebarProps = { mobile?: boolean; onClose?: () => void; role?: string; collapsed?: boolean; onToggleCollapsed?: () => void };

export function Sidebar({ mobile = false, onClose, role = "VIEWER", collapsed, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [localCollapsed, setLocalCollapsed] = useState(false);

  useEffect(() => {
    if (mobile || typeof collapsed === "boolean") return;
    setLocalCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
  }, [mobile, collapsed]);

  const compact = !mobile && (typeof collapsed === "boolean" ? collapsed : localCollapsed);
  const visibleSections = sections
    .map((section) => ({ ...section, items: section.items.filter((item) => visibleForRole(role, item.href)) }))
    .filter((section) => section.items.length > 0);

  function toggleCollapsed() {
    if (onToggleCollapsed) return onToggleCollapsed();
    setLocalCollapsed((value) => {
      const next = !value;
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={`${mobile ? "h-full w-[19rem]" : compact ? "sticky top-0 hidden h-screen w-[5.75rem] lg:flex" : "sticky top-0 hidden h-screen w-[18rem] lg:flex"} relative shrink-0 flex-col overflow-hidden border-l border-white/10 bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-900 text-white shadow-[0_0_70px_rgba(2,44,34,.22)] transition-[width] duration-300`}
      aria-label="القائمة الرئيسية"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(52,211,153,.16),transparent_30rem)]" />

      <div className={`relative border-b border-white/10 ${compact ? "px-3 pb-4 pt-4" : "px-5 pb-5 pt-4"}`}>
        {mobile && <button onClick={onClose} className="absolute left-4 top-4 z-10 rounded-xl border border-white/15 bg-white/10 p-2 text-emerald-100 hover:bg-white/15" aria-label="إغلاق القائمة"><X size={19} /></button>}
        {!mobile && (
          <button type="button" onClick={toggleCollapsed}
            className={`absolute top-3 z-20 grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/10 text-emerald-100 shadow-sm hover:bg-white/20 ${compact ? "left-1/2 -translate-x-1/2" : "left-3"}`}
            aria-label={compact ? "توسيع القائمة" : "طي القائمة"} title={compact ? "توسيع القائمة" : "طي القائمة"}>
            {compact ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
          </button>
        )}

        <Link href="/" onClick={onClose}
          className={`group block border border-white/12 bg-white/95 text-center shadow-xl shadow-emerald-950/20 transition hover:bg-white ${compact ? "mt-10 rounded-2xl p-2" : "rounded-[1.45rem] p-3"}`}
          title={compact ? "منصة الفرصة الثانية" : undefined}>
          <Image src="/branding/nour-al-amal-mark.svg" alt="جمعية نور الأمل" width={230} height={185} priority className={`mx-auto h-auto w-full ${compact ? "max-w-[48px]" : "max-w-[190px]"}`} />
          {!compact && <><span className="mt-1 block text-[11px] font-black text-emerald-950">منصة تدبير برنامج الفرصة الثانية</span><span className="mx-auto mt-2 block h-1 w-14 rounded-full bg-gradient-to-l from-emerald-600 to-teal-500" /></>}
        </Link>
      </div>

      <nav className={`relative flex-1 overflow-y-auto py-5 ${compact ? "space-y-4 px-2.5" : "space-y-6 px-4"}`}>
        {visibleSections.map((section) => (
          <section key={section.title}>
            {!compact && <p className="mb-2.5 px-3 text-[10px] font-black tracking-wide text-emerald-200/65">{section.title}</p>}
            {compact && <div className="mx-auto mb-2 h-px w-8 bg-white/15" aria-hidden />}
            <div className="space-y-1.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link key={href} href={href} onClick={onClose} aria-current={active ? "page" : undefined} aria-label={label} title={compact ? label : undefined}
                    className={`group relative flex items-center overflow-hidden rounded-xl text-sm font-black transition-all ${compact ? "justify-center px-2 py-2.5" : "gap-3 px-3.5 py-2.5"} ${active ? "bg-white/15 text-white shadow-sm ring-1 ring-inset ring-white/10" : "text-emerald-100/75 hover:bg-white/10 hover:text-white"}`}>
                    {active && <span className="absolute inset-y-2 right-0 w-1 rounded-l-full bg-emerald-300" />}
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? "bg-white/15 text-white" : "bg-white/5 text-emerald-200 group-hover:bg-white/10 group-hover:text-white"}`}><Icon size={18} /></span>
                    {!compact && <span>{label}</span>}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className={`relative border-t border-white/10 ${compact ? "p-2.5" : "p-4"}`}>
        <div className={`overflow-hidden border border-white/10 bg-white/10 text-white ${compact ? "rounded-2xl p-2" : "rounded-2xl p-4"}`}>
          {compact ? <span className="grid h-10 w-full place-items-center rounded-xl bg-white/10 text-xs font-black" title="Second Chance 3.0">3.0</span> :
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-emerald-100">Second Chance 3.0</p><p className="mt-1 text-[11px] leading-5 text-emerald-200/70">التأهيل · التمكين · الإدماج</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xs font-black">3.0</span></div>}
        </div>
      </div>
    </aside>
  );
}
