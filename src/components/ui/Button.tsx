import { ReactNode } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  leftIcon,
  className,
}: {
  children: ReactNode;
  onClick?: () => void | Promise<void>;
  type?: "button" | "submit";
  variant?: Variant;
  disabled?: boolean;
  leftIcon?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ring-offset-white",
        disabled && "opacity-60 cursor-not-allowed",
        variant === "primary" &&
          "bg-slate-900 text-white hover:bg-slate-800 shadow-soft",
        variant === "secondary" &&
          "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200",
        variant === "ghost" && "bg-transparent text-slate-700 hover:bg-slate-100",
        variant === "danger" &&
          "bg-rose-600 text-white hover:bg-rose-700 shadow-soft",
        className
      )}
    >
      {leftIcon}
      {children}
    </button>
  );
}
