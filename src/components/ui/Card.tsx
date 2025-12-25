import { ReactNode } from "react";
import clsx from "clsx";

export function Card({
  title,
  subtitle,
  children,
  className,
  actions,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={clsx("rounded-2xl bg-white border border-slate-200 shadow-soft", className)}>
      {(title || subtitle || actions) && (
        <div className="px-4 py-3 border-b border-slate-200 flex items-start gap-3">
          <div className="flex-1">
            {title && <div className="font-semibold">{title}</div>}
            {subtitle && <div className="text-sm text-slate-500">{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
