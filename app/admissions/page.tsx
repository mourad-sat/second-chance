import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AdmissionsTable } from "@/components/AdmissionsTable";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const managedStatuses = ["PRE_REGISTERED", "UNDER_REVIEW", "WAITLISTED", "ACCEPTED", "REJECTED"] as const;

type AdmissionSource = "EXTERNAL" | "INTERNAL";

export default async function AdmissionsPage() {
  const session = await currentSession();
  if (!session) redirect("/login");

  const beneficiaries = await prisma.beneficiary.findMany({
    where: {
      archivedAt: null,
      deletedAt: null,
      status: { in: [...managedStatuses] }
    },
    orderBy: { registrationDate: "desc" },
    take: 300,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      registrationNumber: true,
      registrationDate: true,
      masarNumber: true,
      identityNumber: true,
      phone: true,
      gender: true,
      province: true,
      profilePhotoUrl: true,
      status: true,
      careerChoice1: true,
      admissionAssessment: {
        select: {
          interviewDate: true,
          proposedTrack: true,
          proposedSpecialty: true,
          decision: true
        }
      },
      _count: { select: { documents: true } },
      activityLogs: {
        where: { category: "REGISTRATION" },
        orderBy: { eventDate: "asc" },
        take: 1,
        select: { actorName: true, title: true }
      }
    }
  });

  const external = beneficiaries.filter((item) => item.activityLogs[0]?.actorName === "المترشح").length;
  const preRegistered = beneficiaries.filter((item) => item.status === "PRE_REGISTERED").length;
  const underReview = beneficiaries.filter((item) => item.status === "UNDER_REVIEW").length;
  const accepted = beneficiaries.filter((item) => item.status === "ACCEPTED").length;
  const waitlisted = beneficiaries.filter((item) => item.status === "WAITLISTED").length;
  const rejected = beneficiaries.filter((item) => item.status === "REJECTED").length;

  const items = beneficiaries.map((beneficiary) => {
    const source: AdmissionSource = beneficiary.activityLogs[0]?.actorName === "المترشح" ? "EXTERNAL" : "INTERNAL";

    return {
      id: beneficiary.id,
      fullName: `${beneficiary.firstName} ${beneficiary.lastName}`,
      registrationNumber: beneficiary.registrationNumber || `SC-${beneficiary.registrationDate.getFullYear()}-${beneficiary.id.slice(-8).toUpperCase()}`,
      masarNumber: beneficiary.masarNumber || "",
      identityNumber: beneficiary.identityNumber || "",
      phone: beneficiary.phone || "",
      gender: beneficiary.gender || "",
      province: beneficiary.province || "",
      profilePhotoUrl: beneficiary.profilePhotoUrl || "",
      registrationDate: beneficiary.registrationDate.toISOString(),
      status: beneficiary.status,
      source,
      documentCount: beneficiary._count.documents,
      interviewDate: beneficiary.admissionAssessment?.interviewDate?.toISOString() || "",
      proposedTrack: beneficiary.admissionAssessment?.proposedTrack || beneficiary.careerChoice1 || "",
      proposedSpecialty: beneficiary.admissionAssessment?.proposedSpecialty || "",
      decision: beneficiary.admissionAssessment?.decision || "PENDING",
      hasAssessment: Boolean(beneficiary.admissionAssessment)
    };
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-5 rounded-[2rem] bg-gradient-to-l from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-sm font-black text-cyan-300">بوابة القبول والتوجيه</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">طلبات التسجيل القبلي</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100">مراجعة الطلبات الخارجية والداخلية، التحقق من الوثائق، إجراء التشخيص، ثم اتخاذ قرار اللجنة.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" target="_blank" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black hover:bg-white/20">فتح الاستمارة العامة</Link>
            <Link href="/beneficiaries/new" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-900">تسجيل داخلي</Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ["طلبات خارجية", external, "text-cyan-700", "bg-cyan-50"],
            ["تسجيل قبلي", preRegistered, "text-blue-700", "bg-blue-50"],
            ["قيد الدراسة", underReview, "text-amber-700", "bg-amber-50"],
            ["لائحة الانتظار", waitlisted, "text-orange-700", "bg-orange-50"],
            ["مقبولون", accepted, "text-emerald-700", "bg-emerald-50"],
            ["غير مقبولين", rejected, "text-rose-700", "bg-rose-50"]
          ].map(([label, value, textClass, bgClass]) => (
            <article key={String(label)} className={`rounded-3xl border border-slate-200 p-5 shadow-sm ${bgClass}`}>
              <p className="text-xs font-bold text-slate-600">{label}</p>
              <p className={`mt-3 text-3xl font-black ${textClass}`}>{value}</p>
            </article>
          ))}
        </section>

        <AdmissionsTable items={items} />
      </div>
    </AppShell>
  );
}
