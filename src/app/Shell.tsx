import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FlaskConical, LogOut, Timer } from "lucide-react";
import { useAuth } from "../features/auth/useAuth";
import { useGlobalTimers } from "../features/items/timers/useGlobalTimers";
import { Button } from "../components/ui/Button";
import { formatDistanceToNowStrict } from "date-fns";

export function Shell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { activeTimers, jumpToTimer } = useGlobalTimers();
  const loc = useLocation();
  const nav = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <Link to="/labs" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center shadow-soft">
              <FlaskConical size={18} />
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Lab Tools</div>
              <div className="text-xs text-slate-500">
                Notes • Protocols • Timers • Files
              </div>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {activeTimers.length > 0 && (
              <div className="hidden md:flex items-center gap-2 mr-2">
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Timer size={14} />
                  {activeTimers.length} running
                </div>
                <div className="flex items-center gap-2 overflow-x-auto max-w-[360px] scrollbar">
                  {activeTimers.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100"
                      onClick={() => jumpToTimer(t.labId, t.id)}
                      title="Jump to timer"
                    >
                      {t.name} · {formatDistanceToNowStrict(t.endsAt)} left
                    </button>
                  ))}
                  {activeTimers.length > 3 && (
                    <button
                      className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100"
                      onClick={() => nav("/labs")}
                    >
                      +{activeTimers.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500 hidden sm:block">
              {user?.email ?? ""}
            </div>
            <Button
              variant="ghost"
              onClick={async () => {
                await signOut();
                if (loc.pathname !== "/login") nav("/login");
              }}
              leftIcon={<LogOut size={16} />}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
