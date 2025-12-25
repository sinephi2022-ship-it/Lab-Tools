import { createContext, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../components/toast/ToastProvider";
import { useAuth } from "../../auth/useAuth";
import { listenMyLabs } from "../../labs/labsService";
import { Lab } from "../../labs/types";
import { listenRunningTimers, RunningTimer } from "./timerService";

type CtxType = {
  activeTimers: RunningTimer[];
  jumpToTimer: (labId: string, timerId: string) => void;
};

export const GlobalTimersContext = createContext<CtxType | null>(null);

export function GlobalTimersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { push } = useToast();
  const nav = useNavigate();

  const [activeTimers, setActiveTimers] = useState<RunningTimer[]>([]);
  const prevIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setActiveTimers([]);
      return;
    }

    let unsubLabs: (() => void) | null = null;
    const unsubsTimers: (() => void)[] = [];

    unsubLabs = listenMyLabs(user.uid, (labs: Lab[]) => {
      // reset old timer listeners
      for (const u of unsubsTimers.splice(0)) u();

      const all: RunningTimer[] = [];
      const perLab: Record<string, RunningTimer[]> = {};

      const updateMerged = () => {
        const merged = Object.values(perLab).flat().sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
        setActiveTimers(merged);
      };

      labs.forEach((lab) => {
        const unsub = listenRunningTimers(lab.id, (timers) => {
          perLab[lab.id] = timers;
          updateMerged();
        });
        unsubsTimers.push(unsub);
      });
    });

    return () => {
      unsubLabs?.();
      for (const u of unsubsTimers) u();
    };
  }, [user]);

  useEffect(() => {
    // Toast/notification for newly started timers (best-effort)
    const curr = new Set(activeTimers.map((t) => `${t.labId}:${t.id}`));
    for (const key of curr) {
      if (!prevIds.current.has(key)) {
        const [labId, timerId] = key.split(":");
        const t = activeTimers.find((x) => `${x.labId}:${x.id}` === key);
        if (!t) continue;

        push({
          title: `Timer running: ${t.name}`,
          message: "Click to jump back to the timer.",
          actionLabel: "Open timer",
          onAction: () => nav(`/lab/${labId}?open=${timerId}`),
        });

        if ("Notification" in window) {
          try {
            if (Notification.permission === "granted") {
              const n = new Notification(`Timer running: ${t.name}`, {
                body: "Click to open in Lab Tools",
              });
              n.onclick = () => nav(`/lab/${labId}?open=${timerId}`);
            } else if (Notification.permission === "default") {
              // Ask once, but only when a timer is started
              Notification.requestPermission().catch(() => {});
            }
          } catch {
            // ignore
          }
        }
      }
    }
    prevIds.current = curr;
  }, [activeTimers, push, nav]);

  const value = useMemo<CtxType>(() => ({
    activeTimers,
    jumpToTimer: (labId, timerId) => nav(`/lab/${labId}?open=${timerId}`),
  }), [activeTimers, nav]);

  return <GlobalTimersContext.Provider value={value}>{children}</GlobalTimersContext.Provider>;
}
