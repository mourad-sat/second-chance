import Link from "next/link";

const links = [
  ["/", "لوحة القيادة"],
  ["/beneficiaries", "المستفيدون"],
  ["/beneficiaries/new", "تسجيل مستفيد"],
  ["/attendance", "الحضور والغياب"],
  ["/academic-tracking", "التتبع التربوي"],
  ["/social-support", "المواكبة الاجتماعية"],
  ["#", "التكوين المهني"],
  ["#", "التقارير"]
];

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-5">
      <h1 className="text-xl font-bold mb-2">الفرصة الثانية</h1>
      <p className="text-sm text-slate-300 mb-8">منصة التدبير السنوي</p>
      <nav className="space-y-2">
        {links.map(([href, label]) => (
          <Link key={label} href={href} className="block rounded-lg px-3 py-2 hover:bg-slate-800">
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
