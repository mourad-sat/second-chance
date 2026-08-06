export default function Loading() {
  return (
    <div dir="rtl" className="min-h-[70vh] p-1" role="status" aria-live="polite">
      <div className="mx-auto max-w-[1540px] space-y-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="skeleton h-4 w-32" />
          <div className="mt-3 skeleton h-9 w-72 max-w-full" />
          <div className="mt-3 skeleton h-4 w-[32rem] max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex justify-between"><div className="space-y-3"><div className="skeleton h-4 w-28" /><div className="skeleton h-9 w-20" /></div><div className="skeleton h-12 w-12" /></div></div>)}
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"><div className="skeleton h-72 w-full" /></div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"><div className="skeleton h-72 w-full" /></div>
        </div>
        <p className="sr-only">جارٍ تحميل البيانات...</p>
      </div>
    </div>
  );
}
