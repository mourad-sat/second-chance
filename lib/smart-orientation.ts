export type OrientationInput = {
  careerChoice1?: string | null;
  careerChoice2?: string | null;
  careerChoice3?: string | null;
  personalProject?: string | null;
  programExpectation?: string | null;
  priorExperience?: string | null;
  careerChoiceReason?: string | null;
  lastEducationLevel?: string | null;
  learningDifficulties?: string | null;
  creativeDigitalInterest?: number | null;
  socialServicesInterest?: number | null;
  technicalInterest?: number | null;
  greenEconomyInterest?: number | null;
  culturalAnimationInterest?: number | null;
  arabicScore?: number | null;
  frenchScore?: number | null;
  mathematicsScore?: number | null;
  cognitiveScore?: number | null;
  motivationLevel?: number | null;
  attendanceReadiness?: number | null;
};

export type OrientationRecommendation = {
  track: string;
  score: number;
  confidence: "مرتفعة" | "متوسطة" | "أولية";
  reasons: string[];
  cautions: string[];
};

type TrackDefinition = {
  name: string;
  keywords: string[];
  interestKey?: keyof OrientationInput;
  academicKeys?: (keyof OrientationInput)[];
};

const tracks: TrackDefinition[] = [
  { name: "التصميم الغرافيكي والهوية البصرية", keywords: ["تصميم", "غرافيك", "هوية", "رسم", "فوتوشوب", "إبداع"], interestKey: "creativeDigitalInterest", academicKeys: ["cognitiveScore"] },
  { name: "صناعة المحتوى والتسويق الرقمي", keywords: ["محتوى", "تسويق", "فيديو", "تصوير", "تواصل", "إعلان"], interestKey: "creativeDigitalInterest", academicKeys: ["arabicScore", "frenchScore"] },
  { name: "تصميم وتطوير المواقع الإلكترونية", keywords: ["موقع", "ويب", "برمجة", "حاسوب", "تقنية"], interestKey: "creativeDigitalInterest", academicKeys: ["mathematicsScore", "cognitiveScore"] },
  { name: "برمجة تطبيقات الهاتف", keywords: ["تطبيق", "هاتف", "برمجة", "كود", "تقنية"], interestKey: "creativeDigitalInterest", academicKeys: ["mathematicsScore", "cognitiveScore"] },
  { name: "الذكاء الاصطناعي وتطبيقاته المهنية", keywords: ["ذكاء اصطناعي", "بيانات", "برمجة", "تقنية", "أتمتة"], interestKey: "creativeDigitalInterest", academicKeys: ["mathematicsScore", "cognitiveScore"] },
  { name: "الكهرباء المنزلية", keywords: ["كهرباء", "تركيب", "صيانة", "تقني", "يدوي"], interestKey: "technicalInterest", academicKeys: ["mathematicsScore", "cognitiveScore"] },
  { name: "الطاقة الشمسية", keywords: ["طاقة", "شمسية", "بيئة", "كهرباء", "تركيب"], interestKey: "greenEconomyInterest", academicKeys: ["mathematicsScore", "technicalInterest"] },
  { name: "كاميرات المراقبة والشبكات", keywords: ["كاميرات", "شبكات", "مراقبة", "تركيب", "تقنية"], interestKey: "technicalInterest", academicKeys: ["mathematicsScore", "cognitiveScore"] },
  { name: "الصيانة الإلكترونية للأجهزة الرقمية", keywords: ["صيانة", "إلكترونيات", "هاتف", "حاسوب", "إصلاح"], interestKey: "technicalInterest", academicKeys: ["mathematicsScore", "cognitiveScore"] },
  { name: "المساعد الاجتماعي", keywords: ["اجتماعي", "مساعدة", "دعم", "إنصات", "أسرة"], interestKey: "socialServicesInterest", academicKeys: ["arabicScore"] },
  { name: "التنشيط الثقافي والتربوي", keywords: ["تنشيط", "ثقافة", "أطفال", "مسرح", "تربية", "تواصل"], interestKey: "culturalAnimationInterest", academicKeys: ["arabicScore", "frenchScore"] },
  { name: "الاستقبال والإرشاد", keywords: ["استقبال", "إرشاد", "تواصل", "خدمة", "تنظيم"], interestKey: "socialServicesInterest", academicKeys: ["arabicScore", "frenchScore"] }
];

function normalize(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function numeric(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function scaleTo100(value: number) {
  if (value <= 5) return value * 20;
  if (value <= 10) return value * 10;
  if (value <= 20) return value * 5;
  return Math.min(100, value);
}

export function buildSmartOrientation(input: OrientationInput): OrientationRecommendation[] {
  const choices = [input.careerChoice1, input.careerChoice2, input.careerChoice3].map(normalize);
  const narrative = normalize([
    input.personalProject,
    input.programExpectation,
    input.priorExperience,
    input.careerChoiceReason
  ].filter(Boolean).join(" "));

  const availableSignals = [
    ...choices.filter(Boolean),
    narrative,
    input.creativeDigitalInterest,
    input.socialServicesInterest,
    input.technicalInterest,
    input.greenEconomyInterest,
    input.culturalAnimationInterest,
    input.arabicScore,
    input.frenchScore,
    input.mathematicsScore,
    input.cognitiveScore,
    input.motivationLevel,
    input.attendanceReadiness
  ].filter((value) => value !== null && value !== undefined && value !== "").length;

  return tracks.map((track) => {
    let score = 20;
    const reasons: string[] = [];
    const cautions: string[] = [];

    choices.forEach((choice, index) => {
      if (!choice) return;
      const exact = choice.includes(track.name.toLowerCase()) || track.name.toLowerCase().includes(choice);
      const keywordMatch = track.keywords.some((keyword) => choice.includes(keyword));
      if (exact || keywordMatch) {
        const points = index === 0 ? 35 : index === 1 ? 22 : 14;
        score += points;
        reasons.push(index === 0 ? "يتوافق مباشرة مع الرغبة المهنية الأولى." : `يتوافق مع الرغبة المهنية رقم ${index + 1}.`);
      }
    });

    const narrativeMatches = track.keywords.filter((keyword) => narrative.includes(keyword));
    if (narrativeMatches.length) {
      score += Math.min(18, narrativeMatches.length * 6);
      reasons.push(`المشروع الشخصي والخبرة السابقة يتضمنان مؤشرات مرتبطة بـ: ${narrativeMatches.slice(0, 3).join("، ")}.`);
    }

    if (track.interestKey) {
      const value = numeric(input[track.interestKey]);
      if (value !== null) {
        const scaled = scaleTo100(value);
        score += Math.round(scaled * 0.2);
        if (scaled >= 70) reasons.push("نتيجة الميول المهنية في هذا المجال مرتفعة.");
        if (scaled < 40) cautions.push("نتيجة الميول المهنية المرتبطة بهذا المسار منخفضة نسبيًا.");
      }
    }

    const academicValues = (track.academicKeys || [])
      .map((key) => numeric(input[key]))
      .filter((value): value is number => value !== null)
      .map(scaleTo100);
    if (academicValues.length) {
      const average = academicValues.reduce((sum, value) => sum + value, 0) / academicValues.length;
      score += Math.round(average * 0.12);
      if (average >= 65) reasons.push("المؤشرات المعرفية والدراسية الداعمة للمسار جيدة.");
      if (average < 40) cautions.push("قد يحتاج المترشح إلى دعم تأسيسي قبل الالتحاق بهذا المسار.");
    }

    const motivation = numeric(input.motivationLevel);
    if (motivation !== null) {
      const scaled = scaleTo100(motivation);
      score += Math.round(scaled * 0.08);
      if (scaled >= 70) reasons.push("مستوى الدافعية المسجل في المقابلة إيجابي.");
    }

    const readiness = numeric(input.attendanceReadiness);
    if (readiness !== null && scaleTo100(readiness) < 40) {
      cautions.push("الاستعداد للمواظبة يحتاج إلى مواكبة قبل تثبيت التوجيه.");
    }

    if (input.learningDifficulties && academicValues.length && academicValues.some((value) => value < 45)) {
      cautions.push("ينبغي مراعاة الصعوبات التعلمية المسجلة ووضع خطة دعم مناسبة.");
    }

    const finalScore = Math.max(5, Math.min(98, Math.round(score)));
    const confidence = availableSignals >= 9 ? "مرتفعة" : availableSignals >= 5 ? "متوسطة" : "أولية";

    if (!reasons.length) reasons.push("التوصية أولية وتحتاج إلى استكمال نتائج التشخيص والميول.");

    return { track: track.name, score: finalScore, confidence, reasons: reasons.slice(0, 4), cautions: cautions.slice(0, 3) };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}
