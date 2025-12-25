import { nanoid } from "nanoid";
import { ProtocolStep } from "../types";

function stripBullet(line: string) {
  return line
    .replace(/^\s*[-*•]\s+/, "")
    .replace(/^\s*\d+[\.|\)]\s+/, "")
    .trim();
}

export function parseProtocolPaste(text: string): { steps: ProtocolStep[]; raw: string } {
  const raw = text.replace(/\r\n/g, "\n").trim();
  const lines = raw.split("\n");

  // Heuristic: keep tables / formulas in raw; create steps from non-table lines.
  const steps: ProtocolStep[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip markdown table separator lines, but keep them in raw.
    const isTableish =
      trimmed.includes("|") ||
      /^\s*\|?\s*:-{2,}/.test(trimmed) ||
      /^\s*\|?\s*-{3,}/.test(trimmed);

    // If it's table-ish, don't convert to step.
    if (isTableish) continue;

    const text = stripBullet(trimmed);
    if (!text) continue;

    steps.push({ id: nanoid(), text, checked: false, note: "" });
  }

  return { steps, raw };
}
