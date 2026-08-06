import { BeneficiaryStatus } from "@prisma/client";

export type IntelligenceInput = {
  status: BeneficiaryStatus;
  completionRate: number;
  attendanceRate: number | null;
  absenceCount: number;
  documentsCount: number;
  followUpsOpen: number;
  urgentFollowUps: number;
  academicResultsCount: number;
  skillsCount: number;
  internshipsCount: number;
  hasAssessment: boolean;
  motivationLevel?: number | null;
  attendanceReadiness?: number | null;
  strengths?: string | null;
  priorityNeeds?: string | null;
  careerGoal?: string | null;
  careerChoice1?: string | null;
};

export type IntelligenceReport = {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  readinessScore: number;
  confidence: "منخفضة" | "متوسطة" | "مرتفعة";
  summary: string;
  factors: { label: string; impact: "positive" | "warning" | "critical"; detail: string }[];
  recommendations: string[];
  nextAction: string;
};

const ASSESSMENT_REQUIRED_STATUSES = new Set<BeneficiaryStatus>([
  BeneficiaryStatus.UNDER_REVIEW,
  BeneficiaryStatus.ACCEPTED,
  BeneficiaryStatus.ENROLLED
]);

export function buildBeneficiaryIntelligence(input: IntelligenceInput): IntelligenceReport {
  let risk = 0;
  const factors: IntelligenceReport["factors"] = [];
  const recommendations: string[] = [];

  if (input.absenceCount >= 10) {
    risk += 35;
    factors.push({ label: "غياب حرج", impact: "critical", detail: `${input.absenceCount} حالات غياب مسجلة.` });
    recommendations.push("إجراء مقابلة عاجلة لفهم أسباب الغياب ووضع خطة استبقاء.");
  } else if (input.absenceCount >= 5) {
    risk += 22;
    factors.push({ label: "غياب متكرر", impact: "warning", detail: `${input.absenceCount} حالات غياب تحتاج متابعة.` });
    recommendations.push("برمجة متابعة فردية وربطها بموعد مراجعة واضح.");
  } else if (input.attendanceRate !== null && input.attendanceRate >= 85) {
    factors.push({ label: "مواظبة جيدة", impact: "positive", detail: `نسبة الحضور ${input.attendanceRate}%.` });
  }

  if (input.completionRate < 50) {
    risk += 22;
    factors.push({ label: "ملف ناقص", impact: "critical", detail: `اكتمال الملف لا يتجاوز ${input.completionRate}%.` });
    recommendations.push("استكمال البيانات الأساسية قبل اتخاذ قرارات انتقال جديدة.");
  } else if (input.completionRate < 75) {
    risk += 10;
    factors.push({ label: "اكتمال متوسط", impact: "warning", detail: `اكتمال الملف ${input.completionRate}%.` });
  } else {
    factors.push({ label: "ملف منظم", impact: "positive", detail: `اكتمال الملف ${input.completionRate}%.` });
  }

  if (input.documentsCount === 0) {
    risk += 12;
    factors.push({ label: "غياب الوثائق", impact: "warning", detail: "لا توجد وثائق رقمية مرفوعة." });
    recommendations.push("رفع وثائق الهوية والتسجيل والتحقق منها.");
  }

  if (input.urgentFollowUps > 0) {
    risk += Math.min(20, input.urgentFollowUps * 8);
    factors.push({ label: "متابعات عاجلة", impact: "critical", detail: `${input.urgentFollowUps} متابعة ذات أولوية عاجلة.` });
  } else if (input.followUpsOpen > 0) {
    risk += Math.min(10, input.followUpsOpen * 3);
    factors.push({ label: "متابعات مفتوحة", impact: "warning", detail: `${input.followUpsOpen} متابعة لم تُغلق بعد.` });
  }

  if (!input.hasAssessment && ASSESSMENT_REQUIRED_STATUSES.has(input.status)) {
    risk += 14;
    factors.push({ label: "تشخيص غير مكتمل", impact: "warning", detail: "لا توجد مقابلة تشخيص موثقة." });
    recommendations.push("استكمال التشخيص قبل اعتماد التوجيه أو خطة التدخل.");
  }

  if ((input.motivationLevel || 0) >= 4) factors.push({ label: "دافعية مرتفعة", impact: "positive", detail: "نتيجة الدافعية داعمة للاستمرار." });
  if ((input.attendanceReadiness || 0) <= 2 && input.attendanceReadiness !== null && input.attendanceReadiness !== undefined) {
    risk += 10;
    factors.push({ label: "جاهزية حضور منخفضة", impact: "warning", detail: "مؤشر الجاهزية للمواظبة منخفض." });
  }

  risk = Math.min(100, risk);
  const riskLevel = risk >= 70 ? "CRITICAL" : risk >= 45 ? "HIGH" : risk >= 20 ? "MEDIUM" : "LOW";
  const readinessScore = Math.max(0, Math.min(100, Math.round(
    input.completionRate * 0.35 +
    (input.attendanceRate ?? 50) * 0.3 +
    Math.min(100, input.documentsCount * 18) * 0.1 +
    (input.hasAssessment ? 100 : 30) * 0.15 +
    Math.min(100, (input.skillsCount + input.academicResultsCount) * 12) * 0.1
  )));
  const dataSignals = [input.attendanceRate !== null, input.documentsCount > 0, input.hasAssessment, input.academicResultsCount > 0, input.skillsCount > 0].filter(Boolean).length;
  const confidence = dataSignals >= 4 ? "مرتفعة" : dataSignals >= 2 ? "متوسطة" : "منخفضة";

  let nextAction = "الاستمرار في التتبع الدوري وتحديث بيانات الملف.";
  if (riskLevel === "CRITICAL") nextAction = "تدخل عاجل متعدد الأطراف خلال 48 ساعة مع توثيق خطة الاستبقاء.";
  else if (riskLevel === "HIGH") nextAction = "برمجة مقابلة متابعة خلال هذا الأسبوع وتعيين مسؤول وموعد مراجعة.";
  else if (input.completionRate < 75) nextAction = "استكمال الملف والوثائق قبل الانتقال إلى المرحلة التالية.";
  else if (input.status === BeneficiaryStatus.ACCEPTED) nextAction = "إسناد المستفيد إلى مجموعة وتأكيد التسجيل النهائي.";
  else if (input.status === BeneficiaryStatus.ENROLLED && input.skillsCount === 0) nextAction = "بدء تقييم الكفايات المهنية وتوثيق خط الأساس.";

  if (!recommendations.length) recommendations.push("الحفاظ على المواظبة ومراجعة تقدم المشروع الشخصي بصورة دورية.");
  if (input.careerGoal || input.careerChoice1) recommendations.push(`ربط خطة المواكبة بالهدف المهني: ${input.careerGoal || input.careerChoice1}.`);

  return {
    riskScore: risk,
    riskLevel,
    readinessScore,
    confidence,
    summary: riskLevel === "LOW"
      ? "المؤشرات الحالية مستقرة ولا تظهر عوامل خطر كبيرة، مع ضرورة استمرار التحديث الدوري."
      : riskLevel === "MEDIUM"
        ? "توجد مؤشرات تستدعي متابعة وقائية قبل أن تتحول إلى عوائق في المسار."
        : riskLevel === "HIGH"
          ? "الملف يحتاج تدخلًا منظمًا وقريبًا لتقليل احتمال التعثر أو الانقطاع."
          : "الملف يحمل مؤشرات حرجة ويحتاج تدخلًا عاجلًا موثقًا ومسؤولًا محددًا.",
    factors,
    recommendations: Array.from(new Set(recommendations)).slice(0, 6),
    nextAction
  };
}
