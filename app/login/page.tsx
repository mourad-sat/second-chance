import Image from "next/image";
import { AuthForm } from "@/components/AuthForm";
import { ArrowLeft, BookOpenCheck, BriefcaseBusiness, GraduationCap, HeartHandshake, ShieldCheck, Users } from "lucide-react";

const journey = [
  { label: "التسجيل والتشخيص", icon: Users },
  { label: "التأهيل والتكوين", icon: GraduationCap },
  { label: "المواكبة الفردية", icon: HeartHandshake },
  { label: "الإدماج والمتابعة", icon: BriefcaseBusiness }
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(500px,.92fr)]" dir="rtl">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,.08),transparent_35%),radial-gradient(circle_at_90%_90%,rgba(5,150,105,.07),transparent_32%)]" />
        <div className="relative w-full max-w-[34rem]">
          <div className="mb-9 flex items-center justify-between gap-4 lg:hidden">
            <Image src="/branding/nour-al-amal-mark.svg" alt="جمعية نور الأمل" width={190} height={120} priority className="h-auto w-40" />
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-800">Second Chance 2.0</span>
          </div>

          <AuthForm mode="login" />

          <footer className="mt-10 border-t border-slate-100 pt-5 text-center text-xs font-semibold leading-6 text-slate-400">
            © 2026 جمعية نور الأمل — جميع الحقوق محفوظة
            <span className="mx-2 text-slate-200">•</span>
            منصة تدبير برنامج الفرصة الثانية
          </footer>
        </div>
      </section>

      <aside className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-36 -left-28 h-[28rem] w-[28rem] rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative">
          <div className="inline-flex rounded-[2rem] border border-white/10 bg-white p-5 shadow-2xl shadow-blue-950/30">
            <Image src="/branding/nour-al-amal-mark.svg" alt="جمعية نور الأمل" width={260} height={200} priority className="h-auto w-56" />
          </div>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-blue-100 backdrop-blur">
            <ShieldCheck size={16} /> منصة مؤسساتية آمنة وموحدة
          </div>
          <h2 className="mt-6 max-w-xl text-4xl font-black leading-[1.35] tracking-tight xl:text-5xl">
            من التسجيل الأولي إلى الإدماج ضمن مسار رقمي واحد
          </h2>
          <p className="mt-5 max-w-xl text-base font-medium leading-8 text-blue-100/90">
            منصة جمعية نور الأمل لتدبير رحلة المستفيد، وتوحيد المتابعة التربوية والاجتماعية والمهنية، ودعم اتخاذ القرار بمعطيات دقيقة.
          </p>
        </div>

        <div className="relative my-10 grid gap-3 sm:grid-cols-2">
          {journey.map(({ label, icon: Icon }, index) => (
            <div key={label} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.08] p-4 backdrop-blur transition hover:bg-white/[.13]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-cyan-200 ring-1 ring-white/10">
                <Icon size={21} />
              </span>
              <div>
                <p className="text-[10px] font-black text-blue-300">المرحلة {index + 1}</p>
                <p className="mt-1 text-sm font-black">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative flex items-center justify-between gap-5 border-t border-white/10 pt-6">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/20"><BookOpenCheck size={23} /></span>
            <div><p className="text-xs font-black text-blue-200">التأهيل • التمكين • الإدماج</p><p className="mt-1 text-sm font-bold text-white">فرصة جديدة لبناء المستقبل</p></div>
          </div>
          <ArrowLeft className="text-blue-300" />
        </div>
      </aside>
    </main>
  );
}
