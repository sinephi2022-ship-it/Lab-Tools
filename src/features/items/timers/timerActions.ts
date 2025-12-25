import { Timestamp, serverTimestamp } from "firebase/firestore";
import { updateItem } from "../itemsService";
import { TimerItem } from "../types";

export function computeRemainingSec(timer: TimerItem, nowMs: number) {
  if (timer.status !== "running") return timer.durationSec;
  const ts = timer.startedAt as unknown as Timestamp | null | undefined;
  const startedAtMs = ts ? ts.toMillis() : nowMs;
  const elapsedSec = Math.max(0, (nowMs - startedAtMs) / 1000);
  return Math.max(0, Math.round(timer.durationSec - elapsedSec));
}

export async function startTimer(labId: string, timer: TimerItem) {
  if (timer.status === "running") return;
  await updateItem(labId, timer.id, {
    status: "running",
    startedAt: serverTimestamp(),
    // durationSec stays as total remaining seconds
  });
}

export async function pauseTimer(labId: string, timer: TimerItem) {
  if (timer.status !== "running") return;
  const remaining = computeRemainingSec(timer, Date.now());
  await updateItem(labId, timer.id, {
    status: "paused",
    durationSec: remaining,
    startedAt: null,
  });
}

export async function resumeTimer(labId: string, timer: TimerItem) {
  if (timer.status !== "paused") return;
  await updateItem(labId, timer.id, {
    status: "running",
    startedAt: serverTimestamp(),
  });
}

export async function resetTimer(labId: string, timerId: string, durationSec: number) {
  await updateItem(labId, timerId, {
    status: "idle",
    durationSec,
    startedAt: null,
  });
}

export async function markDoneIfNeeded(labId: string, timer: TimerItem) {
  if (timer.status !== "running") return;
  const remaining = computeRemainingSec(timer, Date.now());
  if (remaining <= 0) {
    await updateItem(labId, timer.id, { status: "done" });
  }
}
