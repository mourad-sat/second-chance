"use client";

import { useEffect, useState } from "react";
import { Database, HardDriveUpload, RefreshCw } from "lucide-react";

type Status = {
  databaseFiles: number;
  blobFiles: number;
  remainingBytes: number;
  batchSize: number;
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function StorageMigrationManager() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/documents/migrate", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر قراءة حالة التخزين.");
      setStatus(result);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function migrateBatch() {
    setMigrating(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/documents/migrate", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "تعذر تنفيذ الترحيل.");
      setMessage(`تم ترحيل ${result.migrated} وثيقة. المتبقي: ${result.remaining}.`);
      await load();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setMigrating(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Database className="text-amber-600" size={22} />
          <p className="mt-4 text-sm text-slate-500">ملفات داخل PostgreSQL</p>
          <p className="mt-2 text-3xl font-bold">{loading ? "—" : status?.databaseFiles ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <HardDriveUpload className="text-emerald-600" size={22} />
          <p className="mt-4 text-sm text-slate-500">ملفات في Vercel Blob</p>
          <p className="mt-2 text-3xl font-bold">{loading ? "—" : status?.blobFiles ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <RefreshCw className="text-blue-600" size={22} />
          <p className="mt-4 text-sm text-slate-500">حجم البيانات المتبقية</p>
          <p className="mt-2 text-3xl font-bold">{loading ? "—" : formatSize(status?.remainingBytes ?? 0)}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">ترحيل الوثائق القديمة</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">تُنقل الوثائق على دفعات من {status?.batchSize || 10} ملفات. لا تُحذف البيانات القديمة إلا بعد نجاح رفع كل ملف وحفظ رابط Blob.</p>
        {message && <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={migrateBatch} disabled={migrating || loading || !status?.databaseFiles} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{migrating ? "جارٍ الترحيل..." : "ترحيل الدفعة التالية"}</button>
          <button onClick={load} disabled={loading} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">تحديث الحالة</button>
        </div>
      </section>
    </div>
  );
}
