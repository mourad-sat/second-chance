export function RegistrationBrandLogo() {
  return (
    <div dir="rtl" className="flex items-center gap-3 sm:gap-4" aria-label="جمعية نور الأمل — التأهيل، التمكين، الإدماج">
      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-emerald-100 sm:h-20 sm:w-20">
        <img
          src="/branding/nour-al-amal-mark.svg"
          alt="شعار جمعية نور الأمل"
          className="h-12 w-12 object-contain sm:h-16 sm:w-16"
          loading="eager"
        />
      </span>
      <div className="min-w-0 text-right">
        <div className="text-xl font-black leading-tight text-blue-900 sm:text-2xl">جمعية نور الأمل</div>
        <div className="mt-1 text-[11px] font-bold tracking-wide text-emerald-700 sm:text-sm">التأهيل • التمكين • الإدماج</div>
      </div>
    </div>
  );
}
