import { ReactNode } from "react";
import { FlaskConical } from "lucide-react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-items-center shadow-soft">
            <FlaskConical size={18} />
          </div>
          <div>
            <div className="font-semibold text-lg leading-tight text-center">Lab Tools</div>
            <div className="text-sm text-slate-500 text-center">Your experiment assistant</div>
          </div>
        </div>
        {children}
        <div className="text-xs text-slate-400 text-center mt-6">
          Data is stored in Firebase. Please don’t upload sensitive personal data.
        </div>
      </div>
    </div>
  );
}
