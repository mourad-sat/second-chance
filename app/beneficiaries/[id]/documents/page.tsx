import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FolderOpen } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DocumentManager } from "@/components/DocumentManager";
import { currentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BeneficiaryDocumentsPage({ params }: { params: { id: string } }) {
  const [beneficiary, session] = await Promise.all([
    prisma.beneficiary.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        documents: {
          select: {
            id: true,
            title: true,
            category: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            notes: true,
            uploadedByName: true,
            createdAt: true
          },
          orderBy: { createdAt: "desc" }
        }
      }
    }),
    currentSession()
  ]);

  if (!beneficiary) notFound();

  const documents = beneficiary.documents.map((document) => ({
    ...document,
    createdAt: document.createdAt.toISOString()
  }));
  const canWrite = session?.role !== "VIEWER";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600"><FolderOpen size={17} /> الملف الرقمي</div>
            <h1 className="text-3xl font-bold text-slate-950">وثائق {beneficiary.firstName} {beneficiary.lastName}</h1>
            <p className="mt-2 text-slate-600">حفظ وثائق الهوية والتسجيل والدراسة والتكوين والتدريب داخل ملف المستفيد.</p>
          </div>
          <Link href={`/beneficiaries/${beneficiary.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><ArrowRight size={16} /> العودة إلى الملف</Link>
        </div>

        <DocumentManager beneficiaryId={beneficiary.id} initialDocuments={documents} canWrite={canWrite} />
      </div>
    </AppShell>
  );
}
