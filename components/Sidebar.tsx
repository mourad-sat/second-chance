"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart3,
  BellRing,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarCheck2,
  ClipboardCheck,
  GitBranch,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Settings,
  Trash2,
  UserPlus,
  Users,
  X
} from "lucide-react";
import { visibleForRole } from "@/lib/permissions";

const sections = [
  { title: "الرئيسية", items: [{ href: "/", label: "لوحة القيادة", icon: LayoutDashboard }, { href: "/notifications", label: "مركز الإشعارات", icon: BellRing }] },
  {
    title: "إدارة المستفيدين",
    items: [
      { href: "/beneficiaries", label: "المستفيدون", icon: Users },
      { href: "/beneficiaries/new", label: "تسجيل مستفيد", icon: UserPlus },
      { href: "/admissions", label: "التشخيص والقبول", icon: ClipboardCheck },
      { href: "/workflow", label: "سير الملفات", icon: GitBranch },
      { href: "/archive", label: "الأرشيف", icon: Archive },
      { href: "/trash", label: "سلة المحذوفات", icon: Trash2 }
    ]
  },
  { title: "التتبع والتكوين", items: [{ href: "/attendance", label: "الحضور والغياب", icon: CalendarCheck2 }, { href: "/academic-tracking", label: "التتبع التربوي", icon: BookOpenCheck }, { href: "/social-support", label: "المواكبة الاجتماعية", icon: HeartHandshake }, { href: "/vocational-training", label: "التكوين المهني", icon: GraduationCap }] },
  { title: "القيادة والإدارة", items: [{ href: "/intelligence", label: "مركز الذكاء والتحليل", icon: BrainCircuit }, { href: "/reports", label: "التقارير والإحصائيات", icon: BarChart3 }, { href: "/integration", label: "الإدماج المهني", icon: BriefcaseBusiness }, { href: "/settings", label: "الإعدادات", icon: Settings }] }
];

type SidebarProps = { mobile?: boolean; onClose?: () => void; role?: string };

export function Sidebar({ mobile = false, onClose, role = "VIEWER" }: SidebarProps) {
  const pathname = usePathname();
  const visibleSections = sections.map((section) => ({ ...section, items: section.items.filter((item) => visibleForRole(role, item.href)) })).filter((section) => section.items.length > 0);

  return (
    <aside className={`${mobile ? "h-full w-[19rem]" : "sticky top-0 hidden h-screen w-[18.5rem] lg:flex"} relative shrink-0 flex-col overflow-hidden border-l border-slate-200/80 bg-white/92 text-slate-800 shadow-[0_0_60px_rgba(15,35,70,0.06)] backdrop-blur-xl`} aria-label="القائمة الرئيسية">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-blue-50 via-blue-50/35 to-transparent" />
      <div className="relative border-b border-slate-100/90 px-5 pb-5 pt-4">
        {mobile && <button onClick={onClose} className="absolute left-4 top-4 z-10 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:bg-slate-50" aria-label="إغلاق القائمة"><X size={19} /></button>}
        <Link href="/" onClick={onClose} className="group block rounded-[1.65rem] border border-blue-100/80 bg-white/85 p-3 text-center shadow-[0_18px_45px_-32px_rgba(29,107,227,0.55)] backdrop-blur transition hover:border-blue-200">
          <Image src="/branding/nour-al-amal-mark.svg" alt="جمعية نور الأمل" width={230} height={185} priority className="mx-auto h-auto w-full max-w-[205px]" />
          <span className="mt-1 block text-[11px] font-black text-slate-500">منصة تدبير برنامج الفرصة الثانية</span><span className="mx-auto mt-2 block h-1 w-14 rounded-full bg-gradient-to-l from-blue-600 to-emerald-500" />
        </Link>
      </div>
      <nav className="relative flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {visibleSections.map((section) => <section key={section.title}><p className="mb-2.5 px-3 text-[10px] font-black tracking-wide text-slate-400">{section.title}</p><div className="space-y-1.5">{section.items.map(({ href, label, icon: Icon }) => { const active = href === "/" ? pathname === "/" : pathname.startsWith(href); return <Link key={href} href={href} onClick={onClose} aria-current={active ? "page" : undefined} className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 text-sm font-black transition-all ${active ? "bg-gradient-to-l from-blue-700 to-blue-600 text-white shadow-lg shadow-blue-200/80" : "text-slate-600 hover:bg-blue-50/90 hover:text-blue-800"}`}>{active && <span className="absolute inset-y-2 right-0 w-1 rounded-l-full bg-emerald-400" />}<span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-700"}`}><Icon size={18} /></span><span>{label}</span></Link>; })}</div></section>)}
      </nav>
      <div className="relative border-t border-slate-100 p-4"><div className="overflow-hidden rounded-2xl bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 p-4 text-white shadow-lg shadow-slate-200"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-blue-300">Second Chance 3.0</p><p className="mt-1 text-[11px] leading-5 text-slate-300">التأهيل · التمكين · الإدماج</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xs font-black">3.0</span></div></div></div>
    </aside>
  );
}
