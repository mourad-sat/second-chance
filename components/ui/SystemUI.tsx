import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-[1540px] space-y-6", className)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  icon: Icon
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-sm md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex min-w-0 items-start gap-4">
        {Icon && <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon size={22} /></span>}
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-black text-emerald-700">{eyebrow}</p>}
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionCard({
  children,
  title,
  description,
  icon: Icon,
  action,
  className,
  contentClassName
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cx("overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm", className)}>
      {(title || description || Icon || action) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {Icon && <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={19} /></span>}
            <div>
              {title && <h2 className="font-black text-slate-900">{title}</h2>}
              {description && <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className={cx("p-5", contentClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  title,
  value,
  note,
  icon: Icon,
  href,
  tone = "emerald"
}: {
  title: string;
  value: ReactNode;
  note?: string;
  icon: LucideIcon;
  href?: string;
  tone?: "emerald" | "sky" | "violet" | "amber" | "rose";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700"
  };
  const body = (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-bold text-slate-500">{title}</p><p className="mt-2 text-3xl font-black text-slate-900">{value}</p></div>
        <span className={cx("grid h-12 w-12 place-items-center rounded-2xl", tones[tone])}><Icon size={22} /></span>
      </div>
      {note && <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">{note}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "success" | "warning" | "danger" | "info" | "neutral" }) {
  const tones = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-600"
  };
  return <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black", tones[tone])}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm"><Icon size={26} /></span>
      <h3 className="mt-4 font-black text-slate-800">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PrimaryButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cx("btn-primary", className)} {...props}>{children}</button>;
}

export function SecondaryButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cx("btn-secondary", className)} {...props}>{children}</button>;
}

export function TableShell({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("overflow-x-auto rounded-2xl border border-slate-200/80 bg-white", className)}>{children}</div>;
}
