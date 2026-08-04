"use client";

import { DragEvent, FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clipboard,
  Download,
  Eye,
  FileImage,
  FileText,
  Search,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";

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

const categoryClasses: Record<string, string> = {
  IDENTITY: "bg-violet-50 text-violet-700",
  ENROLLMENT: "bg-blue-50 text-blue-700",
  EDUCATION: "bg-cyan-50 text-cyan-700",
  SOCIAL: "bg-rose-50 text-rose-700",
  TRAINING: "bg-amber-50 text-amber-700",
  INTERNSHIP: "bg-orange-50 text-orange-700",
  INTEGRATION: "bg-emerald-50 text-emerald-700",
  OTHER: "bg-slate-100 text-slate-700"
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function parseResponse(xhr: XMLHttpRequest) {
  const raw = xhr.responseText || "";
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { message: raw || "تعذر معالجة استجابة الخادم." };
  }
}

export function DocumentManager({ beneficiaryId, initialDocuments, canWrite }: { beneficiaryId: string; initialDocuments: DocumentItem[]; canWrite: boolean }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [preview, setPreview] = useState<DocumentItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ar");
    return documents.filter((document) => {
      const categoryMatches = categoryFilter === "ALL" || document.category === categoryFilter;
      const text = `${document.title} ${document.fileName} ${document.notes || ""} ${document.uploadedByName || ""}`.toLocaleLowerCase("ar");
      return categoryMatches && (!query || text.includes(query));
    });
  }, [documents, search, categoryFilter]);

  function validateFile(file: File) {
    if (!ALLOWED_TYPES.has(file.type)) return "يسمح فقط بملفات PDF وصور PNG وJPG وWEBP.";
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return "حجم الملف يجب ألا يتجاوز 4 ميغابايت.";
    return null;
  }

  function chooseFile(file: File | null) {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setIsError(true);
      setMessage(validationError);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
    setIsError(false);
    setMessage("");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0] || null);
  }

  async function refreshDocuments() {
    const response = await fetch(`/api/documents?beneficiaryId=${encodeURIComponent(beneficiaryId)}`, { cache: "no-store" });
    const text = await response.text();
    let data: { documents?: DocumentItem[]; message?: string } = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    if (!response.ok) throw new Error(data.message || "تعذر تحديث قائمة الوثائق.");
    setDocuments(data.documents || []);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = selectedFile || fileInputRef.current?.files?.[0] || null;
    if (!file) {
      setIsError(true);
      setMessage("اختر ملفًا قبل بدء الرفع.");
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setIsError(true);
      setMessage(validationError);
      return;
    }

    setSaving(true);
    setProgress(0);
    setMessage("");
    setIsError(false);

    const payload = new FormData(form);
    payload.set("beneficiaryId", beneficiaryId);
    payload.set("file", file);

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/documents");
        xhr.upload.onprogress = (progressEvent) => {
          if (progressEvent.lengthComputable) setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        };
        xhr.onload = () => {
          const result = parseResponse(xhr);
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(result.message || "تعذر رفع الوثيقة."));
        };
        xhr.onerror = () => reject(new Error("تعذر الاتصال بالخادم أثناء رفع الوثيقة."));
        xhr.send(payload);
      });

      await refreshDocuments();
      form.reset();
      setSelectedFile(null);
      setProgress(100);
      setMessage("تم رفع الوثيقة إلى التخزين الخارجي بنجاح.");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
      window.setTimeout(() => setProgress(0), 1200);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("هل تريد حذف هذه الوثيقة نهائيًا؟")) return;
    setMessage("");
    const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    const text = await response.text();
    let result: { message?: string } = {};
    try { result = text ? JSON.parse(text) : {}; } catch { result = { message: text }; }
    if (!response.ok) {
      setIsError(true);
      setMessage(result.message || "تعذر حذف الوثيقة.");
      return;
    }
    setDocuments((current) => current.filter((item) => item.id !== id));
    setIsError(false);
    setMessage("تم حذف الوثيقة.");
    router.refresh();
  }

  async function copyInternalLink(document: DocumentItem) {
    const url = `${window.location.origin}/api/documents/${document.id}/download`;
    await navigator.clipboard.writeText(url);
    setCopiedId(document.id);
    window.setTimeout(() => setCopiedId(null), 1600);
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

            <div
              className={`md:col-span-2 rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <UploadCloud className="mx-auto text-slate-400" size={34} />
              <p className="mt-3 font-semibold text-slate-800">اسحب الملف وأفلته هنا</p>
              <p className="mt-1 text-sm text-slate-500">أو اختره من جهازك</p>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-slate-200">اختيار ملف</button>
              <input ref={fileInputRef} required={!selectedFile} name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0] || null)} />
              {selectedFile && <p className="mt-4 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700">{selectedFile.name} · {formatSize(selectedFile.size)}</p>}
            </div>

            <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium">ملاحظات</span><textarea name="notes" rows={2} className={inputClass} /></label>
          </div>

          {saving && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600"><span>جارٍ رفع الوثيقة</span><span>{progress}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          <div className="mt-5 flex justify-end"><button disabled={saving} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "جارٍ الرفع..." : "رفع الوثيقة"}</button></div>
        </form>
      )}

      {message && <p className={`rounded-xl px-4 py-3 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</p>}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><h2 className="text-xl font-bold">الوثائق المحفوظة</h2><p className="mt-1 text-sm text-slate-500">{filteredDocuments.length} من أصل {documents.length} وثيقة</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث بالعنوان أو اسم الملف" className="w-full rounded-xl border border-slate-300 py-2.5 pl-3 pr-10 text-sm outline-none focus:border-blue-500" /></label>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"><option value="ALL">جميع التصنيفات</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </div>
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">لا توجد وثائق مطابقة للبحث أو التصنيف المحدد.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocuments.map((document) => {
              const Icon = document.mimeType === "application/pdf" ? FileText : FileImage;
              return (
                <article key={document.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-slate-100 p-3 text-slate-700"><Icon size={22} /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{document.title}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${categoryClasses[document.category] || categoryClasses.OTHER}`}>{categoryLabels[document.category] || document.category}</span></div>
                      <p className="mt-1 truncate text-sm text-slate-500">{document.fileName} · {formatSize(document.sizeBytes)}</p>
                      <p className="mt-1 text-xs text-slate-400">رفعها {document.uploadedByName || "مستخدم"} بتاريخ {new Date(document.createdAt).toLocaleDateString("ar-MA")}</p>
                      {document.notes && <p className="mt-2 text-sm text-slate-600">{document.notes}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button onClick={() => setPreview(document)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><Eye size={16} /> معاينة</button>
                    <a href={`/api/documents/${document.id}/download`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><Download size={16} /> فتح</a>
                    <button onClick={() => copyInternalLink(document)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">{copiedId === document.id ? <Check size={16} /> : <Clipboard size={16} />} {copiedId === document.id ? "نُسخ" : "نسخ الرابط"}</button>
                    {canWrite && <button onClick={() => remove(document.id)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"><Trash2 size={16} /> حذف</button>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" aria-label={`معاينة ${preview.title}`}>
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h3 className="font-bold text-slate-900">{preview.title}</h3><p className="text-xs text-slate-500">{preview.fileName}</p></div><button onClick={() => setPreview(null)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="إغلاق المعاينة"><X size={20} /></button></div>
            <div className="min-h-0 flex-1 bg-slate-100 p-3">
              {preview.mimeType === "application/pdf" ? (
                <iframe title={preview.title} src={`/api/documents/${preview.id}/download`} className="h-full w-full rounded-xl bg-white" />
              ) : (
                <div className="flex h-full items-center justify-center overflow-auto"><img src={`/api/documents/${preview.id}/download`} alt={preview.title} className="max-h-full max-w-full rounded-xl object-contain shadow" /></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
