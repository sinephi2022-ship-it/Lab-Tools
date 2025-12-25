import clsx from "clsx";
import { forwardRef } from "react";

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }
>(function TextArea({ label, hint, className, ...props }, ref) {
  return (
    <label className="block">
      {label && <div className="text-sm font-medium mb-1">{label}</div>}
      <textarea
        ref={ref}
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm min-h-[120px]",
          "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ring-offset-white",
          className
        )}
        {...props}
      />
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </label>
  );
});
