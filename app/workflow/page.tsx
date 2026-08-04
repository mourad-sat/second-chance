import { AppShell } from "@/components/AppShell";
import { WorkflowManager } from "@/components/WorkflowManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = {
  PRE_REGISTERED: "التسجيل الأولي",
  UNDER_REVIEW: "دراسة الملف والتشخيص",
  WAITLISTED: "لائحة الانتظار",
  ACCEPTED: "القبول",
  REJECTED: "الملف مرفوض",
  ENROLLED: "التمدرس والتكوين",
  WITHDRAWN: "المسار متوقف",
  COMPLETED: "استكمال البرنامج"
};

const progress: Record<string, number> = {
  PRE_REGISTERED: 15,
  UNDER_REVIEW: 30,
  WAITLISTED: 40,
  ACCEPTED: 50,
  REJECTED: 30,
  ENROLLED: 75,
  WITHDRAWN: 75,
  COMPLETED: 100
};

const nextTransitions: Record<string, { value: string; label: string }[]> = {
  PRE_REGISTERED: [{ value: "UNDER_REVIEW", label: "بدء دراسة الملف" }],
  UNDER_REVIEW: [
    { value: "ACCEPTED", label: "قبول المستفيد" },
    { value: "WAITLISTED", label: "إدراج في الانتظار" },
    { value: "REJECTED", label: "رفض الملف" }
  ],
  WAITLISTED: [
    { value: "ACCEPTED", label: "قبول من لائحة الانتظار" },
    { value: "REJECTED", label: "رفض الملف" }
  ],
  ACCEPTED: [{ value: "ENROLLED", label: "تأكيد التمدرس" }],
  REJECTED: [{ value: "UNDER_REVIEW", label: "إعادة فتح الدراسة" }],
  ENROLLED: [
    { value: "COMPLETED", label: "إنهاء البرنامج" },
    { value: "WITHDRAWN", label: "تسجيل انسحاب" }
  ],
  WITHDRAWN: [{ value: "ENROLLED", label: "إعادة الإدماج" }],
  COMPLETED: []
};

export default async function WorkflowPage() {
  const beneficiaries = await prisma.beneficiary.findMany({
    include: {
      enrollments: {
        include: { group: { select: { name: true } } },
        orderBy: { enrolledAt: "desc" },
        take: 1
      }
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  const items = beneficiaries.map((beneficiary) => ({
    id: beneficiary.id,
    firstName: beneficiary.firstName,
    lastName: beneficiary.lastName,
    status: beneficiary.status,
    stageLabel: labels[beneficiary.status] || beneficiary.status,
    progress: progress[beneficiary.status] || 0,
    groupName: beneficiary.enrollments[0]?.group.name || null,
    nextOptions: nextTransitions[beneficiary.status] || []
  }));

  const activeFiles = beneficiaries.filter((item) => !["REJECTED", "WITHDRAWN", "COMPLETED"].includes(item.status)).length;
  const underReview = beneficiaries.filter((item) => item.status === "UNDER_REVIEW").length;
  const enrolled = beneficiaries.filter((item) => item.status === "ENROLLED").length;
  const completed = beneficiaries.filter((item) => item.status === "COMPLETED").length;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold text-blue-600">المسار الرقمي الموحد</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">سير ملفات المستفيدين</h1>
          <p className="mt-2 text-slate-600">تتبع انتقال كل ملف من التسجيل الأولي إلى استكمال البرنامج، مع منع الانتقالات غير المنطقية وتوثيق كل إجراء.</p>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["الملفات النشيطة", activeFiles],
            ["قيد الدراسة", underReview],
            ["في التمدرس والتكوين", enrolled],
            ["أنهت البرنامج", completed]
          ].map(([label, value]) => (
            <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
            </article>
          ))}
        </section>

        <WorkflowManager items={items} />
      </div>
    </AppShell>
  );
}
