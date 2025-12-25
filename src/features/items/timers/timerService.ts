import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { TimerItem } from "../types";

export type RunningTimer = {
  id: string;
  labId: string;
  name: string;
  startedAtMs: number;
  durationSec: number;
  endsAt: Date;
};

function itemsCol(labId: string) {
  return collection(db, "labs", labId, "items");
}

export function listenRunningTimers(labId: string, cb: (timers: RunningTimer[]) => void) {
  const q = query(
    itemsCol(labId),
    where("type", "==", "timer"),
    where("status", "==", "running"),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const timers: RunningTimer[] = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) as TimerItem }))
      .map((t) => {
        const ts = (t.startedAt as unknown as Timestamp | null);
        const startedAtMs = ts ? ts.toMillis() : Date.now();
        const endsAt = new Date(startedAtMs + t.durationSec * 1000);
        return { id: t.id, labId, name: t.name, startedAtMs, durationSec: t.durationSec, endsAt };
      });
    cb(timers);
  });
}
