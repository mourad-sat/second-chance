"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BellRing,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  ClipboardCheck,
  GitBranch,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Settings,
  UserPlus,
  Users,
  X
} from "lucide-react";
import { visibleForRole } from "@/lib/permissions";

const sections = [
  {
    title: "الرئيسية",
    items: [
      { href: "/", label: "لوحة القيادة", icon: LayoutDashboard },
      { href: "/notifications", label: "مركز الإشعارات", icon: BellRing }
    ]
  },
  {
    title: "إدارة المستفيدين",
    items: [
      { href: "/beneficiaries", label: "المستفيدون", icon: Users },
      { href: "/beneficiaries/new", label: "تسجيل مستفيد", icon: UserPlus },
      { href: "/admissions", label: "التشخيص والقبول", icon: ClipboardCheck },
      { href: "/workflow", label: "سير الملفات", icon: GitBranch }
    ]
  },
  {
    title: "التتبع والتكوين",
    items: [
      { href: "/attendance", label: "الحضور والغياب", icon: CalendarCheck2 },
      { href: "/academic-tracking", label: "التتبع التربوي", icon: BookOpenCheck },
      { href: "/social-support", label: "المواكبة الاجتماعية", icon: HeartHandshake },
      { href: "/vocational-training", label: "التكوين المهني", icon: GraduationCap }
    ]
  },
  {
    title: "القيادة والإدارة",
    items: [
      { href: "/reports", label: "التقارير والإحصائيات", icon: BarChart3 },
      { href: "/integration", label: "الإدماج المهني", icon: BriefcaseBusiness },
      { href: "/settings", label: "الإعدادات", icon: Settings }
    ]
  }
];

type SidebarProps = { mobile?: boolean; onClose?: () => void; role?: string };

export function Sidebar({ mobile = false, onClose, role = "VIEWER" }: SidebarProps) {
  const pathname = usePathname();
  const visibleSections = sections
    .map((section) => ({ ...section, items: section.items.filter((item) => visibleForRole(role, item.href)) }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={`${mobile ? "h-full w-[19rem]" : "sticky top-0 hidden h-screen w-[18rem] lg:flex"} shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white text-slate-800 shadow-[0_0_50px_rgba(15,23,42,0.04)]`}
      aria-label="القائمة الرئيسية"
    >
      <div className="relative border-b border-slate-100 px-5 pb-5 pt-4">
        {mobile && (
          <button onClick={onClose} className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50" aria-label="إغلاق القائمة">
            <X size={19} />
          </button>
        )}
        <Link href="/" onClick={onClose} className="block rounded-3xl bg-gradient-to-b from-blue-50/70 to-white p-3 text-center ring-1 ring-blue-100/70">
          <Image src="/branding/nour-al-amal-mark.svg" alt="جمعية نور الأمل" width={230} height={185} priority className="mx-auto h-auto w-full max-w-[210px]" />
          <span className="mt-1 block text-[11px] font-bold text-slate-500">منصة تدبير برنامج الفرصة الثانية</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {visibleSections.map((section) => (
          <section key={section.title}>
            <p className="mb-2 px-3 text-[10px] font-black tracking-wide text-slate-400">{section.title}</p>
            <div className="space-y-1.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
                  >
                    <span className={`grid h-9 w-9 place-items-center rounded-xl transition ${active ? "bg-white/15" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-700"}`}>
                      <Icon size={18} />
                    </span>
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-2xl bg-slate-950 p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-blue-300">Second Chance 2.0</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-400">واجهة حديثة لتدبير رحلة المستفيد من التسجيل إلى الإدماج.</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-xs font-black">2.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
