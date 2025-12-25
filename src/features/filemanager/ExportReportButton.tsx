import { useState } from "react";
import { FileDown } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Button } from "../../components/ui/Button";
import { AnyItem } from "../items/types";
import { format } from "date-fns";
import { useToast } from "../../components/toast/ToastProvider";

function download(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportReportButton({ labId }: { labId: string }) {
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  async function onExport() {
    setBusy(true);
    try {
      const q = query(collection(db, "labs", labId, "items"), orderBy("updatedAt", "asc"));
      const snap = await getDocs(q);
      const items: AnyItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      const now = new Date();
      const title = `Lab Tools Report (${format(now, "yyyy-MM-dd HH:mm")})`;

      const notes = items.filter((i) => i.type === "note") as any[];
      const protos = items.filter((i) => i.type === "protocol") as any[];
      const timers = items.filter((i) => i.type === "timer") as any[];
      const files = items.filter((i) => i.type === "file") as any[];

      let md = `# ${title}\n\n`;
      md += `Generated from Lab Tools.\n\n`;

      md += `## Notes\n\n`;
      if (notes.length === 0) md += `_(none)_\n\n`;
      for (const n of notes) {
        md += `### ${n.name}\n\n`;
        md += `${n.content || "_(empty)_"}\n\n`;
      }

      md += `## Protocols\n\n`;
      if (protos.length === 0) md += `_(none)_\n\n`;
      for (const p of protos) {
        md += `### ${p.name}\n\n`;
        if (p.raw) md += `${p.raw}\n\n`;
        if (Array.isArray(p.steps) && p.steps.length) {
          md += `**Checklist**\n\n`;
          for (const s of p.steps) {
            md += `- [${s.checked ? "x" : " "}] ${s.text}${s.note ? " — " + s.note : ""}\n`;
          }
          md += `\n`;
        }
      }

      md += `## Timers\n\n`;
      if (timers.length === 0) md += `_(none)_\n\n`;
      for (const t of timers) {
        md += `- **${t.name}** — ${t.status}, remaining/total: ${t.durationSec}s\n`;
      }
      md += `\n`;

      md += `## Files\n\n`;
      if (files.length === 0) md += `_(none)_\n\n`;
      for (const f of files) {
        md += `- ${f.name} (${Math.round(f.size / 1024)} KB) — ${f.downloadUrl}\n`;
      }
      md += `\n`;

      const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family: ui-sans-serif, system-ui; padding:24px; max-width: 900px; margin:0 auto;"><pre style="white-space:pre-wrap;">${escapeHtml(md)}</pre></body></html>`;

      download(`lab-report-${format(now, "yyyyMMdd-HHmm")}.md`, md, "text/markdown;charset=utf-8");
      download(`lab-report-${format(now, "yyyyMMdd-HHmm")}.html`, html, "text/html;charset=utf-8");
      push({ title: "Exported", message: "Downloaded .md and .html" });
    } catch (err: any) {
      push({ title: "Export failed", message: err?.message ?? "Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" onClick={onExport} disabled={busy} leftIcon={<FileDown size={16} />}>
      {busy ? "Exporting…" : "Export report"}
    </Button>
  );
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
