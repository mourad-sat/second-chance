import Link from "next/link";
import {
  AlertTriangle,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarCheck,
  Check,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  FolderOpen,
  GraduationCap,
  HeartHandshake,
  Phone,
  UserRound
} from "lucide-react";

type Stage = {
  label: string;
  href: string;
  state: "completed" | "active" | "upcoming";
};

type Props = {
  id: string;
  fullName: string;
  initials: string;
  photoUrl?: string | null;
  statusLabel: string;
  registrationNumber: string;
  masarNumber?: string | null;
  phone?: string | null;
  groupLabel: string;
  completionRate: number;
  attendanceRate: number;
  absenceCount: number;
  documentsCount: number;
  socialFollowUpsCount: number;
  strengths?: string | null;
  priorityNeeds?: string | null;
  careerGoal?: string | null;
  nextAction: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  stages: Stage[];
};

const riskStyles = {
  LOW: { label: "خطر منخفض", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  MEDIUM: { label: "خطر متوسط", className: "border-amber-200 bg-amber-50 text-amber-700" },
  HIGH: { label: "خطر مرتفع", className: "border-red-200 bg-red-50 text-red-700" }
};

export function BeneficiaryProfileHeroV2(props: Props) {
  const risk = riskStyles[props.risk];

  return (
    <div className="mb-6 space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-[0_24px_70px_-34px_rgba(15,23,42,0.35)]">
        <div className="relative overflow-hidden bg-gradient-to-l from-blue-950 via-blue-900 to-blue-700 px-5 py-6 text-white sm:px-7 lg:px-8">
          <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-blue-300/10 blur-3xl" />

          <div className="relative grid gap-6 xl:grid-cols-[1.35fr_.9fr] xl:items-center">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.65rem] border-4 border-white/15 bg-white/10 shadow-2xl">
                {props.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={props.photoUrl} alt={`صورة ${props.fullName}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blue-400 to-cyan-500 text-3xl font-black">{props.initials}</div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-blue-100">ملف المستفيد 2.0</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">{props.statusLabel}</span>
                </div>
                <h1 className="mt-3 truncate text-3xl font-black tracking-tight sm:text-4xl">{props.fullName}</h1>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-100">
                  <span>رقم التسجيل: <bdi className="font-mono font-black text-white">{props.registrationNumber}</bdi></span>
                  <span>رقم مسار: <bdi className="font-mono font-black text-white">{props.masarNumber || "غير محدد"}</bdi></span>
                  {props.phone && <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {props.phone}</span>}
                </div>
                <p className="mt-3 text-sm font-semibold text-blue-100">{props.groupLabel}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-blue-200">اكتمال الملف</p>
                  <p className="mt-1 text-3xl font-black">{props.completionRate}%</p>
                </div>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-black ${risk.className}`}>{risk.label}</span>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-cyan-400" style={{ width: `${props.completionRate}%` }} />
              </div>
              <div className="mt-4 rounded-2xl bg-black/15 p-3">
                <p className="text-[11px] font-bold text-blue-200">الإجراء التالي المقترح</p>
                <p className="mt-1 text-sm font-black leading-6">{props.nextAction}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
          {[
            ["الحضور", `${props.attendanceRate}%`, CalendarCheck],
            ["الغيابات", props.absenceCount, AlertTriangle],
            ["الوثائق", props.documentsCount, FolderOpen],
            ["المتابعات", props.socialFollowUpsCount, HeartHandshake]
          ].map(([label, value, Icon]) => (
            <div key={String(label)} className="bg-white p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Icon size={18} /></span>
                <div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-950">{value}</p></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><p className="text-xs font-black text-blue-700">رحلة المستفيد</p><h2 className="mt-1 text-xl font-black text-slate-950">التقدم داخل البرنامج</h2></div>
            <ClipboardCheck className="text-blue-700" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {props.stages.map((stage, index) => (
              <div key={stage.label} className="flex shrink-0 items-center gap-3">
                <a href={stage.href} className={`min-w-36 rounded-2xl border p-3 transition ${stage.state === "active" ? "border-blue-300 bg-blue-50 text-blue-800" : stage.state === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  <div className="flex items-center gap-2">
                    <span className={`grid h-8 w-8 place-items-center rounded-xl ${stage.state === "active" ? "bg-blue-700 text-white" : stage.state === "completed" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                      {stage.state === "completed" ? <Check size={15} /> : <span className="text-xs font-black">{index + 1}</span>}
                    </span>
                    <div><p className="text-sm font-black">{stage.label}</p><p className="mt-0.5 text-[10px] font-bold">{stage.state === "completed" ? "مكتملة" : stage.state === "active" ? "المرحلة الحالية" : "لاحقًا"}</p></div>
                  </div>
                </a>
                {index < props.stages.length - 1 && <ChevronLeft className="text-slate-300" size={18} />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {[
            ["نقاط القوة", props.strengths || "لم تُسجل نقاط القوة بعد.", UserRound, "bg-emerald-50 text-emerald-800"],
            ["الاحتياجات ذات الأولوية", props.priorityNeeds || "لم تُحدد الاحتياجات بعد.", HeartHandshake, "bg-amber-50 text-amber-800"],
            ["الهدف المهني", props.careerGoal || "لم يُحدد الهدف المهني بعد.", BriefcaseBusiness, "bg-blue-50 text-blue-800"]
          ].map(([title, text, Icon, className]) => (
            <div key={String(title)} className={`rounded-2xl p-4 ${className}`}>
              <div className="flex items-center gap-2"><Icon size={17} /><p className="text-xs font-black">{title}</p></div>
              <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link href={`/beneficiaries/${props.id}/documents`} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"><FolderOpen size={20} /></span><div><p className="font-black text-slate-900">إدارة الوثائق</p><p className="text-xs text-slate-500">رفع ومعاينة الملفات</p></div></div><ChevronLeft className="text-slate-300 group-hover:text-blue-700" />
        </Link>
        <a href="#diagnosis" className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:shadow-md">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-700"><ClipboardCheck size={20} /></span><div><p className="font-black text-slate-900">التشخيص والقبول</p><p className="text-xs text-slate-500">المقابلة وقرار اللجنة</p></div></div><ChevronLeft className="text-slate-300 group-hover:text-violet-700" />
        </a>
        <Link href={`/beneficiaries/${props.id}/smart-orientation`} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-300 hover:shadow-md">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-50 text-cyan-700"><BrainCircuit size={20} /></span><div><p className="font-black text-slate-900">التوجيه الذكي</p><p className="text-xs text-slate-500">تحليل المسارات المناسبة</p></div></div><ChevronLeft className="text-slate-300 group-hover:text-cyan-700" />
        </Link>
        <a href="#activity" className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><FileText size={20} /></span><div><p className="font-black text-slate-900">السجل الزمني</p><p className="text-xs text-slate-500">جميع العمليات والأنشطة</p></div></div><ChevronLeft className="text-slate-300 group-hover:text-emerald-700" />
        </a>
      </section>
    </div>
  );
}
