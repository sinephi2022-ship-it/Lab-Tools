import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ExternalLink, FolderOpen, Play, Pause, RotateCcw, ClipboardPaste } from "lucide-react";
import { AnyItem, NoteItem, ProtocolItem, TimerItem, FileItem, ProtocolStep } from "../items/types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { TextArea } from "../../components/ui/TextArea";
import { Input } from "../../components/ui/Input";
import { applyProtocolPaste, updateItem } from "../items/itemsService";
import { useToast } from "../../components/toast/ToastProvider";
import { markDoneIfNeeded, pauseTimer, resetTimer, resumeTimer, startTimer, computeRemainingSec } from "../items/timers/timerActions";

export function Inspector({
  labId,
  item,
  itemsById,
  onOpenFolder,
}: {
  labId: string;
  item: AnyItem | null;
  itemsById: Record<string, AnyItem>;
  onOpenFolder: (folderId: string | null) => void;
}) {
  if (!item) {
    return (
      <Card title="Details" subtitle="Select an item">
        <div className="text-sm text-slate-500">
          Pick an item from the list to view or edit it here.
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={<div className="flex items-center gap-2">{item.name}</div>}
      subtitle={<MetaLine item={item} itemsById={itemsById} onOpenFolder={onOpenFolder} />}
    >
      {item.type === "folder" && (
        <div className="space-y-3">
          <div className="text-sm text-slate-600">
            This is a folder. Double‑click it in the list to open.
          </div>
          <Button variant="secondary" leftIcon={<FolderOpen size={16} />} onClick={() => onOpenFolder(item.id)}>
            Open folder
          </Button>
        </div>
      )}

      {item.type === "note" && <NoteEditor labId={labId} item={item as NoteItem} />}

      {item.type === "protocol" && (
        <ProtocolEditor labId={labId} item={item as ProtocolItem} />
      )}

      {item.type === "timer" && <TimerEditor labId={labId} item={item as TimerItem} />}

      {item.type === "file" && <FileViewer item={item as FileItem} />}
    </Card>
  );
}

function MetaLine({
  item,
  itemsById,
  onOpenFolder,
}: {
  item: AnyItem;
  itemsById: Record<string, AnyItem>;
  onOpenFolder: (folderId: string | null) => void;
}) {
  const parent = item.parentId ? itemsById[item.parentId] : null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">{item.type}</span>
      <span className="text-xs text-slate-400">•</span>
      <button
        className="text-xs text-slate-600 hover:underline underline-offset-4"
        onClick={() => onOpenFolder(parent ? parent.id : null)}
      >
        {parent ? parent.name : "Home"}
      </button>
    </div>
  );
}

function NoteEditor({ labId, item }: { labId: string; item: NoteItem }) {
  const { push } = useToast();
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [value, setValue] = useState(item.content ?? "");
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    setValue(item.content ?? "");
  }, [item.id]);

  useEffect(() => {
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(async () => {
      try {
        await updateItem(labId, item.id, { content: value });
      } catch (err: any) {
        push({ title: "Save failed", message: err?.message ?? "Please try again." });
      }
    }, 500);
    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, [value, labId, item.id, push]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          className={"px-3 py-1 rounded-xl text-sm border " + (tab === "edit" ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50")}
          onClick={() => setTab("edit")}
        >
          Edit
        </button>
        <button
          className={"px-3 py-1 rounded-xl text-sm border " + (tab === "preview" ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50")}
          onClick={() => setTab("preview")}
        >
          Preview
        </button>
      </div>

      {tab === "edit" ? (
        <TextArea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write Markdown… (tables via GFM, math via $...$)"
          className="min-h-[320px]"
        />
      ) : (
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {value || "_(empty)_"}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function ProtocolEditor({ labId, item }: { labId: string; item: ProtocolItem }) {
  const { push } = useToast();
  const [raw, setRaw] = useState(item.raw ?? "");
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    setRaw(item.raw ?? "");
  }, [item.id]);

  // Debounced raw save
  useEffect(() => {
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(async () => {
      try {
        await updateItem(labId, item.id, { raw });
      } catch (err: any) {
        push({ title: "Save failed", message: err?.message ?? "Please try again." });
      }
    }, 600);
    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, [raw, labId, item.id, push]);

  async function pasteAndBuildChecklist() {
    try {
      const txt = await navigator.clipboard.readText();
      if (!txt.trim()) {
        push({ title: "Clipboard empty", message: "Copy some protocol text first." });
        return;
      }
      await applyProtocolPaste(labId, item.id, txt);
      push({ title: "Protocol parsed", message: "Checklist generated from pasted text." });
    } catch (err: any) {
      push({ title: "Paste failed", message: err?.message ?? "Browser blocked clipboard access." });
    }
  }

  async function updateStep(stepId: string, patch: Partial<ProtocolStep>) {
    const steps = (item.steps ?? []).map((s) => (s.id === stepId ? { ...s, ...patch } : s));
    await updateItem(labId, item.id, { steps });
  }

  const checkedCount = (item.steps ?? []).filter((s) => s.checked).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" leftIcon={<ClipboardPaste size={16} />} onClick={pasteAndBuildChecklist}>
          Paste → Checklist
        </Button>
        <div className="text-xs text-slate-500">
          Parses bullets/numbered lines into checkable steps. Tables & formulas stay in the raw view.
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Checklist</div>
          <div className="text-xs text-slate-500">{checkedCount}/{(item.steps ?? []).length} done</div>
        </div>
        <div className="mt-2 space-y-2">
          {(item.steps ?? []).length === 0 ? (
            <div className="text-sm text-slate-500">No steps yet. Use “Paste → Checklist”.</div>
          ) : (
            item.steps.map((s) => (
              <div key={s.id} className="rounded-2xl bg-white border border-slate-200 p-3">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={s.checked}
                    onChange={(e) => updateStep(s.id, { checked: e.target.checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <input
                      className="w-full text-sm font-medium outline-none"
                      value={s.text}
                      onChange={(e) => updateStep(s.id, { text: e.target.value })}
                    />
                    <input
                      className="w-full text-sm text-slate-600 mt-1 outline-none"
                      placeholder="Note (optional)…"
                      value={s.note ?? ""}
                      onChange={(e) => updateStep(s.id, { note: e.target.value })}
                    />
                  </div>
                </label>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">Raw protocol (Markdown)</div>
        <TextArea value={raw} onChange={(e) => setRaw(e.target.value)} className="min-h-[220px]" />
        <div className="text-xs text-slate-500 mt-2">
          Supports tables (GFM) and formulas like $E = mc^2$.
        </div>
      </div>

      {raw.trim() && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="text-sm font-semibold mb-2">Preview</div>
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {raw}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

function TimerEditor({ labId, item }: { labId: string; item: TimerItem }) {
  const { push } = useToast();
  const [tick, setTick] = useState(0);
  const [mins, setMins] = useState(Math.floor(item.durationSec / 60));
  const [secs, setSecs] = useState(item.durationSec % 60);

  useEffect(() => {
    setMins(Math.floor(item.durationSec / 60));
    setSecs(item.durationSec % 60);
  }, [item.id, item.durationSec]);

  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    // best-effort mark done
    markDoneIfNeeded(labId, item).catch(() => {});
  }, [tick, labId, item]);

  const remainingSec = computeRemainingSec(item, Date.now());
  const totalSec = Math.max(1, item.status === "idle" ? (mins * 60 + secs) : item.durationSec);
  const pct = Math.min(1, Math.max(0, remainingSec / totalSec));

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  async function saveDuration() {
    const d = Math.max(1, mins * 60 + secs);
    await updateItem(labId, item.id, { durationSec: d, status: "idle", startedAt: null });
    push({ title: "Timer set", message: fmt(d) });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs text-slate-500">Remaining</div>
        <div className="text-3xl font-semibold tabular-nums">{fmt(remainingSec)}</div>
        <div className="mt-3 h-2 rounded-full bg-white border border-slate-200 overflow-hidden">
          <div className="h-full bg-slate-900" style={{ width: `${pct * 100}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.status !== "running" ? (
            <Button variant="primary" leftIcon={<Play size={16} />} onClick={() => startTimer(labId, item).catch((e) => push({ title: "Start failed", message: String(e) }))}>
              Start
            </Button>
          ) : (
            <Button variant="secondary" leftIcon={<Pause size={16} />} onClick={() => pauseTimer(labId, item).catch((e) => push({ title: "Pause failed", message: String(e) }))}>
              Pause
            </Button>
          )}
          {item.status === "paused" && (
            <Button variant="primary" leftIcon={<Play size={16} />} onClick={() => resumeTimer(labId, item).catch((e) => push({ title: "Resume failed", message: String(e) }))}>
              Resume
            </Button>
          )}
          <Button
            variant="secondary"
            leftIcon={<RotateCcw size={16} />}
            onClick={() => resetTimer(labId, item.id, Math.max(1, mins * 60 + secs)).catch((e) => push({ title: "Reset failed", message: String(e) }))}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="text-sm font-semibold mb-2">Duration</div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Minutes"
            type="number"
            min={0}
            value={mins}
            onChange={(e) => setMins(Math.max(0, Number(e.target.value)))}
          />
          <Input
            label="Seconds"
            type="number"
            min={0}
            max={59}
            value={secs}
            onChange={(e) => setSecs(Math.min(59, Math.max(0, Number(e.target.value))))}
          />
        </div>
        <div className="mt-2">
          <Button variant="secondary" onClick={() => saveDuration().catch((e) => push({ title: "Save failed", message: String(e) }))}>
            Save duration
          </Button>
        </div>
        <div className="text-xs text-slate-500 mt-2">
          When you pause, the remaining time is synced to Firebase so multiple users/devices stay consistent.
        </div>
      </div>
    </div>
  );
}

function FileViewer({ item }: { item: FileItem }) {
  const isImg = item.mimeType?.startsWith("image/");
  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600">
        <a
          href={item.downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-4"
        >
          Open file <ExternalLink size={14} />
        </a>
      </div>

      {isImg ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-2">
          <img
            src={item.downloadUrl}
            alt={item.name}
            className="w-full rounded-xl object-contain max-h-[420px]"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Preview is available for images. For other file types, use “Open file”.
        </div>
      )}

      <div className="text-xs text-slate-500">
        {item.mimeType} • {Math.round(item.size / 1024)} KB
      </div>
    </div>
  );
}
