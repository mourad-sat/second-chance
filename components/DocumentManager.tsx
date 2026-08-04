"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileImage, FileText, Trash2, UploadCloud } from "lucide-react";

type DocumentItem = {
  id: string;
  title: string;
  category: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  notes: string | null;
  uploadedByName: string | null;
  createdAt: string;
};

type ApiResult = { message?: string; documents?: DocumentItem[] };

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

const categoryLabels: Record<string, string> = {
  IDENTITY: "وثائق الهوية",
  ENROLLMENT: "التسجيل والالتزام",
  EDUCATION: "المسار الدراسي",
  SOCIAL: "الملف الاجتماعي",
  TRAINING: "التكوين المهني",
  INTERNSHIP: "التدريب الميداني",
  INTEGRATION: "الإدماج المهني",
  OTHER: "أخرى"
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function readApiResult(response: Response): Promise<ApiResult> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<ApiResult>;
  }

  const text = await response.text();
  if (response.status === 413 || /request entity too large|payload too large/i.test(text)) {
    return { message: "حجم الملف أكبر من الحد المسموح. اختر ملفًا لا يتجاوز 4 ميغابايت." };
  }

  return { message: text.trim() || "تعذر تنفيذ العملية." };
}

export function DocumentManager({ beneficiaryId, initialDocuments, canWrite }: { beneficiaryId: string; initialDocuments: DocumentItem[]; canWrite: boolean }) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    setMessage("");
    setIsError(false);

    if (!file) {
      setIsError(true);
      setMessage("اختر ملفًا لرفعه.");
      return;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      setIsError(true);
      setMessage("يسمح فقط بملفات PDF وصور PNG وJPG وWEBP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setIsError(true);
      setMessage(`حجم الملف ${formatSize(file.size)}. الحد الأقصى المسموح هو 4 ميغابايت.`);
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData(form);
      payload.set("beneficiaryId", beneficiaryId);
      const response = await fetch("/api/documents", { method: "POST", body: payload });
      const result = await readApiResult(response);
      if (!response.ok) throw new Error(result.message || "تعذر رفع الوثيقة.");

      const refreshed = await fetch(`/api/documents?beneficiaryId=${encodeURIComponent(beneficiaryId)}`, { cache: "no-store" });
      const data = await readApiResult(refreshed);
      if (!refreshed.ok) throw new Error(data.message || "تم الرفع، لكن تعذر تحديث قائمة الوثائق.");

      setDocuments(data.documents || []);
      form.reset();
      setMessage("تم رفع الوثيقة إلى التخزين الخارجي بنجاح.");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("هل تريد حذف هذه الوثيقة نهائيًا؟")) return;
    setMessage("");

    try {
      const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const result = await readApiResult(response);
      if (!response.ok) throw new Error(result.message || "تعذر حذف الوثيقة.");

      setDocuments((current) => current.filter((item) => item.id !== id));
      setIsError(false);
      setMessage("تم حذف الوثيقة.");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "تعذر حذف الوثيقة.");
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <div className="space-y-6">
      {canWrite && (
        <form onSubmit={upload} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><UploadCloud size={22} /></div>
            <div><h2 className="text-xl font-bold">رفع وثيقة جديدة</h2><p className="mt-1 text-sm text-slate-500">PDF أو صورة إلى Vercel Blob الخاص، بحد أقصى 4 ميغابايت.</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label><span className="mb-2 block text-sm font-medium">عنوان الوثيقة</span><input required name="title" className={inputClass} placeholder="مثال: نسخة البطاقة الوطنية" /></label>
            <label><span className="mb-2 block text-sm font-medium">التصنيف</span><select name="category" className={inputClass}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium">الملف</span><input required name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className={inputClass} /></label>
            <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium">ملاحظات</span><textarea name="notes" rows={2} className={inputClass} /></label>
          </div>
          <div className="mt-5 flex justify-end"><button disabled={saving} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "جارٍ الرفع..." : "رفع الوثيقة"}</button></div>
        </form>
      )}

      {message && <p className={`rounded-xl px-4 py-3 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</p>}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5"><h2 className="text-xl font-bold">الوثائق المحفوظة</h2><p className="mt-1 text-sm text-slate-500">{documents.length} وثيقة</p></div>
        {documents.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">لا توجد وثائق مرفوعة لهذا المستفيد.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((document) => {
              const Icon = document.mimeType === "application/pdf" ? FileText : FileImage;
              return (
                <article key={document.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-slate-100 p-3 text-slate-700"><Icon size={22} /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{document.title}</h3><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{categoryLabels[document.category] || document.category}</span></div>
                      <p className="mt-1 truncate text-sm text-slate-500">{document.fileName} · {formatSize(document.sizeBytes)}</p>
                      <p className="mt-1 text-xs text-slate-400">رفعها {document.uploadedByName || "مستخدم"} بتاريخ {new Date(document.createdAt).toLocaleDateString("ar-MA")}</p>
                      {document.notes && <p className="mt-2 text-sm text-slate-600">{document.notes}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <a href={`/api/documents/${document.id}/download`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"><Download size={16} /> فتح</a>
                    {canWrite && <button onClick={() => remove(document.id)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"><Trash2 size={16} /> حذف</button>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
