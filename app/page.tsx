import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck2,
  GraduationCap,
  HeartHandshake,
  Users
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default async function DashboardPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [
    beneficiaries,
    accepted,
    groups,
    programs,
    todayAttendance,
    presentToday,
    openFollowUps,
    urgentFollowUps,
    latestBeneficiaries
  ] = await Promise.all([
    prisma.beneficiary.count(),
    prisma.beneficiary.count({ where: { status: { in: ["ACCEPTED", "ENROLLED", "COMPLETED"] } } }),
    prisma.learningGroup.count({ where: { isActive: true } }),
    prisma.vocationalProgram.count({ where: { isActive: true } }),
    prisma.attendanceRecord.count({ where: { date: { gte: startOfDay, lt: endOfDay } } }),
    prisma.attendanceRecord.count({ where: { date: { gte: startOfDay, lt: endOfDay }, status: "PRESENT" } }),
    prisma.socialFollowUp.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.socialFollowUp.count({ where: { priority: "URGENT", status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.beneficiary.findMany({ orderBy: { createdAt: "desc" }, take: 5 })
  ]);

  const cards = [
    { label: "إجمالي المستفيدين", value: beneficiaries, note: `${accepted} مقبولًا أو متمدرسًا`, icon: Users },
    { label: "المجموعات النشيطة", value: groups, note: "خلال الموسم الجاري", icon: GraduationCap },
    { label: "نسبة حضور اليوم", value: `${percent(presentToday, todayAttendance)}%`, note: `${presentToday} من أصل ${todayAttendance}`, icon: CalendarCheck2 },
    { label: "ملفات تحتاج متابعة", value: openFollowUps, note: `${urgentFollowUps} حالات مستعجلة`, icon: HeartHandshake }
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-blue-600">لوحة القيادة التنفيذية</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">مرحبًا بك في منصة الفرصة الثانية</h2>
            <p className="mt-2 text-slate-500">نظرة موحدة على التسجيل والتتبع التربوي والاجتماعي والمهني.</p>
          </div>
          <Link href="/beneficiaries/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            تسجيل مستفيد جديد
            <ArrowLeft size={17} />
          </Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, note, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={22} /></div>
              </div>
              <p className="text-xs text-slate-500">{note}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">آخر التسجيلات</h3>
                <p className="mt-1 text-sm text-slate-500">أحدث الملفات المضافة إلى المنصة</p>
              </div>
              <Link href="/beneficiaries" className="text-sm font-semibold text-blue-600">عرض الكل</Link>
            </div>

            {latestBeneficiaries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">لم تُسجل ملفات بعد.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {latestBeneficiaries.map((beneficiary) => (
                  <Link key={beneficiary.id} href={`/beneficiaries/${beneficiary.id}`} className="flex items-center justify-between gap-4 py-4 transition hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700">
                        {beneficiary.firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{beneficiary.firstName} {beneficiary.lastName}</p>
                        <p className="mt-1 text-xs text-slate-500">{beneficiary.identityNumber || "بدون رقم هوية"}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{beneficiary.createdAt.toLocaleDateString("ar-MA")}</span>
                  </Link>
                ))}
              </div>
            )}
          </article>

          <div className="space-y-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600"><AlertTriangle size={21} /></div>
                <div>
                  <h3 className="font-bold text-slate-900">التنبيهات التشغيلية</h3>
                  <p className="text-sm text-slate-500">ما يحتاج إلى تدخل قريب</p>
                </div>
              </div>
              <div className="space-y-3">
                <Link href="/social-support" className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm">
                  <span className="font-medium text-red-800">حالات اجتماعية مستعجلة</span>
                  <strong className="text-red-700">{urgentFollowUps}</strong>
                </Link>
                <Link href="/attendance" className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 text-sm">
                  <span className="font-medium text-amber-800">سجلات الحضور اليوم</span>
                  <strong className="text-amber-700">{todayAttendance}</strong>
                </Link>
                <Link href="/vocational-training" className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 text-sm">
                  <span className="font-medium text-blue-800">برامج التكوين النشيطة</span>
                  <strong className="text-blue-700">{programs}</strong>
                </Link>
              </div>
            </article>

            <article className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
              <p className="text-sm font-semibold text-blue-300">مسار البرنامج</p>
              <h3 className="mt-2 text-xl font-bold">من التسجيل إلى الإدماج</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">التسجيل ← التشخيص والقبول ← التمدرس والتكوين ← المواكبة ← التقويم ← الإدماج والتتبع.</p>
            </article>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
