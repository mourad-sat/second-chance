"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardCheck,
  FolderOpen,
  GraduationCap,
  HeartHandshake,
  History,
  Printer,
  UserRound,
  X
} from "lucide-react";
import { useState } from "react";

const statusLabels: Record<string, string> = {
  PRE_REGISTERED: "مسجل أوليًا",
  UNDER_REVIEW: "قيد دراسة الملف",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "مقبول",
  REJECTED: "غير مقبول",
  ENROLLED: "متمدرس",
  WITHDRAWN: "منسحب",
  COMPLETED: "أنهى البرنامج"
};

const actions = [
  ["#personal-data", "البيانات", UserRound],
  ["#documents", "الوثائق", FolderOpen],
  ["#diagnosis", "التشخيص", ClipboardCheck],
  ["#attendance", "الحضور", CalendarCheck],
  ["#academic", "التتبع", BookOpenCheck],
  ["#social", "المواكبة", HeartHandshake],
  ["#training", "التكوين", GraduationCap],
  ["#integration", "الإدماج", BriefcaseBusiness],
  ["#activity", "السجل", History]
] as const;

export function BeneficiaryQuickActions({
  beneficiaryId,
  fullName,
  registrationNumber,
  status
}: {
  beneficiaryId: string;
  fullName: string;
  registrationNumber: string;
  status: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-2xl shadow-blue-900/30 transition hover:bg-blue-800 print:hidden"
        aria-label="فتح الإجراءات السريعة"
      >
        <UserRound size={18} /> إجراءات الملف
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 p-3 backdrop-blur-sm print:hidden" onClick={() => setOpen(false)}>
          <aside
            dir="rtl"
            className="mr-auto flex h-full w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="bg-slate-950 p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-blue-300">الإجراءات السريعة</p>
                  <h2 className="mt-1 text-xl font-black">{fullName}</h2>
                  <p className="mt-2 font-mono text-xs text-slate-300">{registrationNumber}</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="rounded-xl bg-white/10 p-2 hover:bg-white/20" aria-label="إغلاق"><X size={18} /></button>
              </div>
              <span className="mt-4 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold">
                {statusLabels[status] || status}
              </span>
            </header>

            <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4">
              <Link
                href={`/beneficiaries/${beneficiaryId}/smart-orientation`}
                onClick={() => setOpen(false)}
                className="col-span-2 flex min-h-24 items-center justify-center gap-3 rounded-2xl border border-violet-200 bg-gradient-to-l from-violet-700 to-indigo-800 p-4 text-center text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:from-violet-800 hover:to-indigo-900"
              >
                <BrainCircuit size={25} /> التوجيه الذكي للمسارات
              </Link>
              {actions.map(([href, label, Icon]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                >
                  <Icon size={22} /> {label}
                </a>
              ))}
            </div>

            <footer className="space-y-2 border-t border-slate-200 p-4">
              <button type="button" onClick={() => window.print()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white hover:bg-emerald-800">
                <Printer size={17} /> طباعة الملف
              </button>
              <Link href={`/beneficiaries/${beneficiaryId}/documents`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-800 hover:bg-blue-100">
                <FolderOpen size={17} /> إدارة جميع الوثائق
              </Link>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
