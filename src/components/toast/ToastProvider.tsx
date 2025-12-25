import React, { createContext, ReactNode, useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";

export type Toast = {
  id: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  kind?: "info" | "success" | "warning" | "error";
};

type ToastCtx = {
  push: (t: Omit<Toast, "id">) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, ...t }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 8000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl bg-white border border-slate-200 shadow-soft overflow-hidden"
          >
            <div className="p-3 flex gap-3 items-start">
              <div className="flex-1">
                <div className="font-semibold text-sm">{t.title}</div>
                {t.message && <div className="text-sm text-slate-600 mt-1">{t.message}</div>}
                {(t.actionLabel && t.onAction) && (
                  <button
                    className="mt-2 text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-700"
                    onClick={() => {
                      t.onAction?.();
                      setToasts((prev) => prev.filter((x) => x.id !== t.id));
                    }}
                  >
                    {t.actionLabel}
                  </button>
                )}
              </div>
              <button
                className="p-2 rounded-xl hover:bg-slate-100"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
