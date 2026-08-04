"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
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
    items: [{ href: "/", label: "لوحة القيادة", icon: LayoutDashboard }]
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
      { href: "/reports", label: "التقارير", icon: BarChart3 },
      { href: "/integration", label: "الإدماج المهني", icon: BriefcaseBusiness },
      { href: "/settings", label: "الإعدادات", icon: Settings }
    ]
  }
];

type SidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
  role?: string;
};

export function Sidebar({ mobile = false, onClose, role = "VIEWER" }: SidebarProps) {
  const pathname = usePathname();
  const visibleSections = sections
    .map((section) => ({ ...section, items: section.items.filter((item) => visibleForRole(role, item.href)) }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={`${mobile ? "h-full w-72" : "sticky top-0 hidden h-screen w-72 lg:block"} shrink-0 overflow-y-auto bg-slate-950 px-4 py-6 text-white`}
      aria-label="القائمة الرئيسية"
    >
      <div className="mb-8 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 font-bold">ف2</div>
          {mobile && (
            <button onClick={onClose} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="إغلاق القائمة">
              <X size={20} />
            </button>
          )}
        </div>
        <h1 className="text-lg font-bold">منصة الفرصة الثانية</h1>
        <p className="mt-1 text-xs leading-5 text-slate-400">التدبير التربوي والاجتماعي والمهني</p>
      </div>

      <nav className="space-y-7">
        {visibleSections.map((section) => (
          <section key={section.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{section.title}</p>
            <div className="space-y-1">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="mt-8 rounded-2xl bg-blue-600/15 p-4 text-xs leading-6 text-blue-100 ring-1 ring-blue-500/20">
        <p className="font-semibold">الإصدار الأول</p>
        <p className="text-blue-200/70">بيئة الاختبار والتطوير المستمر</p>
      </div>
    </aside>
  );
}
