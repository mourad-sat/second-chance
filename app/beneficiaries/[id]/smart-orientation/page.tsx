import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BrainCircuit, CheckCircle2, Info, Sparkles, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { buildSmartOrientation } from "@/lib/smart-orientation";

export const dynamic = "force-dynamic";

export default async function SmartOrientationPage({ params }: { params: { id: string } }) {
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: params.id },
    include: { admissionAssessment: true }
  });

  if (!beneficiary) notFound();

  const assessment = beneficiary.admissionAssessment;
  const recommendations = buildSmartOrientation({
    careerChoice1: beneficiary.careerChoice1,
    careerChoice2: beneficiary.careerChoice2,
    careerChoice3: beneficiary.careerChoice3,
    personalProject: beneficiary.personalProject,
    programExpectation: beneficiary.programExpectation,
    priorExperience: beneficiary.priorExperience,
    careerChoiceReason: beneficiary.careerChoiceReason,
    lastEducationLevel: beneficiary.lastEducationLevel,
    learningDifficulties: beneficiary.learningDifficulties,
    creativeDigitalInterest: assessment?.creativeDigitalInterest,
    socialServicesInterest: assessment?.socialServicesInterest,
    technicalInterest: assessment?.technicalInterest,
    greenEconomyInterest: assessment?.greenEconomyInterest,
    culturalAnimationInterest: assessment?.culturalAnimationInterest,
    arabicScore: assessment?.arabicScore,
    frenchScore: assessment?.frenchScore,
    mathematicsScore: assessment?.mathematicsScore,
    cognitiveScore: assessment?.cognitiveScore,
    motivationLevel: assessment?.motivationLevel,
    attendanceReadiness: assessment?.attendanceReadiness
  });

  return (
    <AppShell>
      <div dir="rtl" className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black text-violet-700">التوجيه الذكي المفسر</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">توصيات المسارات المهنية</h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              تحليل مساعد مبني على رغبات المستفيد ونتائج التشخيص والميول. لا يمثل قرارًا آليًا أو نهائيًا.
            </p>
          </div>
          <Link href={`/beneficiaries/${beneficiary.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
            <ArrowRight size={17} /> العودة إلى ملف المستفيد
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-violet-950 via-indigo-950 to-slate-950 text-white shadow-xl">
          <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10"><BrainCircuit size={29} /></span>
              <div>
                <h2 className="text-2xl font-black">{beneficiary.firstName} {beneficiary.lastName}</h2>
                <p className="mt-2 text-sm text-violet-100">الرغبة الأولى: {beneficiary.careerChoice1 || "غير محددة"}</p>
                <p className="mt-1 text-sm text-slate-300">المستوى الدراسي: {beneficiary.lastEducationLevel || "غير محدد"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center">
              <p className="text-xs text-violet-200">قوة البيانات</p>
              <p className="mt-1 text-xl font-black">{recommendations[0]?.confidence || "أولية"}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-3">
          {recommendations.map((recommendation, index) => (
            <article key={recommendation.track} className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${index === 0 ? "border-violet-300 ring-4 ring-violet-100" : "border-slate-200"}`}>
              <div className={`px-5 py-4 text-white ${index === 0 ? "bg-violet-700" : index === 1 ? "bg-blue-700" : "bg-slate-800"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold opacity-80">التوصية رقم {index + 1}</p>
                    <h3 className="mt-1 text-lg font-black">{recommendation.track}</h3>
                  </div>
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-xl font-black">{recommendation.score}%</span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <span className="font-bold text-slate-600">مستوى الثقة</span>
                  <span className="font-black text-slate-900">{recommendation.confidence}</span>
                </div>

                <div className="mt-5">
                  <h4 className="flex items-center gap-2 font-black text-emerald-800"><CheckCircle2 size={18} /> أسباب التوصية</h4>
                  <div className="mt-3 space-y-2">
                    {recommendation.reasons.map((reason) => (
                      <p key={reason} className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-950">{reason}</p>
                    ))}
                  </div>
                </div>

                {recommendation.cautions.length > 0 && (
                  <div className="mt-5">
                    <h4 className="flex items-center gap-2 font-black text-amber-800"><TriangleAlert size={18} /> نقاط يجب مراعاتها</h4>
                    <div className="mt-3 space-y-2">
                      {recommendation.cautions.map((caution) => (
                        <p key={caution} className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950">{caution}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="flex items-center gap-2 font-black text-blue-950"><Info size={19} /> كيف تُقرأ النتيجة؟</h3>
            <p className="mt-3 text-sm leading-7 text-blue-950">
              نسبة التوافق ليست احتمال نجاح علميًا ولا حكمًا على قدرات المستفيد. إنها مؤشر مساعد يجمع الرغبات والميول والنتائج المتاحة، ويجب مناقشته مع لجنة التوجيه والمستفيد.
            </p>
          </div>
          <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5">
            <h3 className="flex items-center gap-2 font-black text-violet-950"><Sparkles size={19} /> الإجراء المقترح</h3>
            <p className="mt-3 text-sm leading-7 text-violet-950">
              مناقشة التوصيات الثلاث في مقابلة التوجيه، التحقق من توفر المسارات والتجهيزات، ثم تسجيل القرار البشري النهائي وأسباب اختياره داخل ملف المستفيد.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
