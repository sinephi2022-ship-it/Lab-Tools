import { useContext } from "react";
import { GlobalTimersContext } from "./GlobalTimersProvider";

export function useGlobalTimers() {
  const ctx = useContext(GlobalTimersContext);
  if (!ctx) throw new Error("useGlobalTimers must be used within GlobalTimersProvider");
  return ctx;
}
