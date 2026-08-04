import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, History } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BeneficiaryTimeline } from "@/components/BeneficiaryTimeline";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TimelineEvent = {
  id: string;
  category: string;
  title: string;
  description: string;
  actorName: string;
  eventDate: string;
  href: string;
};

export default async function BeneficiaryTimelinePage({ params }: { params: { id: string } }) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id },
    include: {
      admissionAssessment: true,
      attendanceRecords: { include: { group: true }, orderBy: { date: "desc" }, take: 100 },
      academicResults: { include: { assessment: true }, orderBy: { createdAt: "desc" } },
      academicSupportPlans: { orderBy: { createdAt: "desc" } },
      socialFollowUps: { orderBy: { eventDate: "desc" } },
      skillEvaluations: { include: { competency: true }, orderBy: { evaluationDate: "desc" } },
      vocationalProjects: { orderBy: { createdAt: "desc" } },
      internships: { orderBy: { startDate: "desc" } },
      activityLogs: { orderBy: { eventDate: "desc" } }
    }
  });

  if (!beneficiary) notFound();

  const events: TimelineEvent[] = [
    {
      id: `registration-${beneficiary.id}`,
      category: "REGISTRATION",
      title: "تسجيل المستفيد في المنصة",
      description: `تم إنشاء الملف الرقمي للمستفيد ${beneficiary.firstName} ${beneficiary.lastName}.`,
      actorName: "النظام",
      eventDate: beneficiary.createdAt.toISOString(),
      href: `/beneficiaries/${beneficiary.id}#personal-data`
    }
  ];

  const admission = beneficiary.admissionAssessment;
  if (admission?.interviewDate) {
    events.push({
      id: `diagnosis-${admission.id}`,
      category: "DIAGNOSIS",
      title: "إنجاز المقابلة والتشخيص الأولي",
      description: admission.interviewSummary || "تم توثيق المقابلة ونتائج التشخيص.",
      actorName: admission.interviewerName || "غير محدد",
      eventDate: admission.interviewDate.toISOString(),
      href: `/beneficiaries/${beneficiary.id}#diagnosis`
    });
  }
  if (admission?.decisionDate) {
    events.push({
      id: `admission-${admission.id}`,
      category: "ADMISSION",
      title: `قرار لجنة القبول: ${admission.decision}`,
      description: admission.committeeNotes || admission.orientationReason || "تم اعتماد قرار لجنة القبول.",
      actorName: "لجنة القبول",
      eventDate: admission.decisionDate.toISOString(),
      href: `/beneficiaries/${beneficiary.id}#diagnosis`
    });
  }

  for (const record of beneficiary.attendanceRecords) {
    events.push({
      id: `attendance-${record.id}`,
      category: "ATTENDANCE",
      title: `الحضور: ${record.status}`,
      description: `${record.group.name}${record.notes ? ` · ${record.notes}` : ""}${record.excuse ? ` · المبرر: ${record.excuse}` : ""}`,
      actorName: "وحدة الحضور",
      eventDate: record.date.toISOString(),
      href: "/attendance"
    });
  }

  for (const result of beneficiary.academicResults) {
    events.push({
      id: `assessment-${result.id}`,
      category: "ASSESSMENT",
      title: result.assessment.title,
      description: `${result.assessment.subject} · النتيجة: ${result.score ?? "—"}/${result.assessment.maxScore}${result.competencyLevel ? ` · ${result.competencyLevel}` : ""}${result.notes ? ` · ${result.notes}` : ""}`,
      actorName: "التتبع التربوي",
      eventDate: result.assessment.assessmentDate.toISOString(),
      href: "/academic-tracking"
    });
  }

  for (const plan of beneficiary.academicSupportPlans) {
    events.push({
      id: `support-${plan.id}`,
      category: "SUPPORT",
      title: `خطة دعم: ${plan.difficulty}`,
      description: `${plan.objective} · الحالة: ${plan.status} · الإنجاز: ${plan.progressPercent}%`,
      actorName: plan.responsibleName || "غير محدد",
      eventDate: plan.startDate.toISOString(),
      href: `/beneficiaries/${beneficiary.id}/support-plan`
    });
  }

  for (const followUp of beneficiary.socialFollowUps) {
    events.push({
      id: `social-${followUp.id}`,
      category: "SOCIAL",
      title: followUp.subject,
      description: followUp.details || followUp.actionsTaken || `${followUp.type} · ${followUp.status}`,
      actorName: followUp.responsibleName || "غير محدد",
      eventDate: followUp.eventDate.toISOString(),
      href: "/social-support"
    });
  }

  for (const evaluation of beneficiary.skillEvaluations) {
    events.push({
      id: `skill-${evaluation.id}`,
      category: "TRAINING",
      title: `تقييم مهارة: ${evaluation.competency.title}`,
      description: `المستوى: ${evaluation.level}${evaluation.score != null ? ` · النقطة: ${evaluation.score}` : ""}${evaluation.notes ? ` · ${evaluation.notes}` : ""}`,
      actorName: evaluation.evaluatorName || "التكوين المهني",
      eventDate: evaluation.evaluationDate.toISOString(),
      href: "/vocational-training"
    });
  }

  for (const project of beneficiary.vocationalProjects) {
    events.push({
      id: `project-${project.id}`,
      category: "TRAINING",
      title: `المشروع المهني: ${project.title}`,
      description: `الحالة: ${project.status} · الإنجاز: ${project.progressPercent}%`,
      actorName: project.mentorName || "التكوين المهني",
      eventDate: project.startDate?.toISOString() || project.createdAt.toISOString(),
      href: "/vocational-training"
    });
  }

  for (const internship of beneficiary.internships) {
    events.push({
      id: `internship-${internship.id}`,
      category: "INTERNSHIP",
      title: `تدريب لدى ${internship.organizationName}`,
      description: `${internship.field || "المجال غير محدد"} · الحالة: ${internship.status}`,
      actorName: internship.supervisorName || "وحدة الإدماج",
      eventDate: internship.startDate.toISOString(),
      href: "/professional-integration"
    });
  }

  for (const activity of beneficiary.activityLogs) {
    events.push({
      id: `activity-${activity.id}`,
      category: activity.category,
      title: activity.title,
      description: activity.description || "",
      actorName: activity.actorName || "",
      eventDate: activity.eventDate.toISOString(),
      href: activity.referenceHref || ""
    });
  }

  events.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  return (
    <AppShell>
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">المرحلة 3.3.4</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">السجل الزمني الذكي</h1>
          <p className="mt-2 text-slate-600">التاريخ الموحد للمستفيد: {beneficiary.firstName} {beneficiary.lastName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/beneficiaries/${beneficiary.id}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold hover:bg-slate-50"><ArrowRight size={17} /> الملف الموحد</Link>
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white"><History size={17} /> {events.length} حدثًا</div>
        </div>
      </div>
      <BeneficiaryTimeline beneficiaryId={beneficiary.id} events={events} />
    </AppShell>
  );
}
