import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, ExternalLink, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AdmissionsTable } from "@/components/AdmissionsTable";
import { PageContainer, PageHeader, StatCard } from "@/components/ui/SystemUI";
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
      <PageContainer>
        <PageHeader
          eyebrow="بوابة القبول والتوجيه"
          title="طلبات التسجيل القبلي"
          description="مراجعة الطلبات الخارجية والداخلية، التحقق من الوثائق، إجراء التشخيص، ثم اعتماد قرار اللجنة."
          icon={ClipboardCheck}
          actions={
            <>
              <Link href="/register" target="_blank" className="btn-secondary">
                <ExternalLink size={16} /> فتح الاستمارة العامة
              </Link>
              <Link href="/beneficiaries/new" className="btn-primary">
                <UserPlus size={16} /> تسجيل داخلي
              </Link>
            </>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard title="طلبات خارجية" value={external} note="وصلت من البوابة العامة" icon={ExternalLink} tone="sky" />
          <StatCard title="تسجيل قبلي" value={preRegistered} note="بانتظار بدء المراجعة" icon={Users} tone="violet" />
          <StatCard title="قيد الدراسة" value={underReview} note="تحت المراجعة والتشخيص" icon={ClipboardCheck} tone="amber" />
          <StatCard title="لائحة الانتظار" value={waitlisted} note="بانتظار توفر مقعد" icon={Users} tone="amber" />
          <StatCard title="مقبولون" value={accepted} note="تم اعتماد قرار القبول" icon={ClipboardCheck} tone="emerald" />
          <StatCard title="غير مقبولين" value={rejected} note="تم إنهاء دراسة الملف" icon={Users} tone="rose" />
        </section>

        <AdmissionsTable items={items} />
      </PageContainer>
    </AppShell>
  );
}
