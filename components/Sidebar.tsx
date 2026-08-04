"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Settings,
  UserPlus,
  Users
} from "lucide-react";

const sections = [
  {
    title: "الرئيسية",
    items: [{ href: "/", label: "لوحة القيادة", icon: LayoutDashboard }]
  },
  {
    title: "إدارة المستفيدين",
    items: [
      { href: "/beneficiaries", label: "المستفيدون", icon: Users },
      { href: "/beneficiaries/new", label: "تسجيل مستفيد", icon: UserPlus }
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto bg-slate-950 px-4 py-6 text-white lg:block">
      <div className="mb-8 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 font-bold">ف2</div>
        <h1 className="text-lg font-bold">منصة الفرصة الثانية</h1>
        <p className="mt-1 text-xs leading-5 text-slate-400">التدبير التربوي والاجتماعي والمهني</p>
      </div>

      <nav className="space-y-7">
        {sections.map((section) => (
          <section key={section.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
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
