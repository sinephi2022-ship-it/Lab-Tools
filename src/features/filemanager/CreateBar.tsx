import { useState } from "react";
import { Plus, FolderPlus, StickyNote, Timer, FileText, Upload, FileDown, Trash2, Pencil } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { AnyItem, ItemType } from "../items/types";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { createItem, deleteItem, renameItem } from "../items/itemsService";
import { useAuth } from "../auth/useAuth";
import { useToast } from "../../components/toast/ToastProvider";
import { ExportReportButton } from "./ExportReportButton";
import { UploadFileButton } from "./UploadFileButton";

export function CreateBar({
  labId,
  currentFolderId,
  selectedItem,
  onCreated,
}: {
  labId: string;
  currentFolderId: string | null;
  selectedItem: AnyItem | null;
  onCreated: (id: string) => void;
}) {
  const { user } = useAuth();
  const { push } = useToast();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ItemType>("note");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  async function doCreate() {
    if (!user) return;
    if (!name.trim()) {
      push({ title: "Missing name", message: "Please enter a name." });
      return;
    }
    setBusy(true);
    try {
      const id = await createItem(labId, {
        type,
        name: name.trim(),
        parentId: currentFolderId,
        createdBy: user.uid,
      });
      setOpen(false);
      setName("");
      onCreated(id);
    } catch (err: any) {
      push({ title: "Create failed", message: err?.message ?? "Please try again." });
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    if (!selectedItem) return;
    if (!confirm(`Delete "${selectedItem.name}"?`)) return;
    await deleteItem(labId, selectedItem.id);
  }

  async function doRename() {
    if (!selectedItem) return;
    const v = renameValue.trim();
    if (!v) return;
    await renameItem(labId, selectedItem.id, v);
    setRenameOpen(false);
  }

  const canRenameOrDelete = !!selectedItem;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" onClick={() => { setOpen(true); setType("note"); setName(""); }} leftIcon={<Plus size={16} />}>
        New
      </Button>

      <UploadFileButton labId={labId} parentId={currentFolderId} onCreated={onCreated} />

      <ExportReportButton labId={labId} />

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="secondary"
          disabled={!canRenameOrDelete}
          onClick={() => { if (!selectedItem) return; setRenameValue(selectedItem.name); setRenameOpen(true); }}
          leftIcon={<Pencil size={16} />}
        >
          Rename
        </Button>
        <Button
          variant="danger"
          disabled={!canRenameOrDelete}
          onClick={doDelete}
          leftIcon={<Trash2 size={16} />}
        >
          Delete
        </Button>
      </div>

      <Modal
        open={open}
        title="Create item"
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={doCreate} disabled={busy}>{busy ? "Creating…" : "Create"}</Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <TypeButton label="Folder" icon={<FolderPlus size={16} />} active={type==="folder"} onClick={() => setType("folder")} />
          <TypeButton label="Note" icon={<StickyNote size={16} />} active={type==="note"} onClick={() => setType("note")} />
          <TypeButton label="Timer" icon={<Timer size={16} />} active={type==="timer"} onClick={() => setType("timer")} />
          <TypeButton label="Protocol" icon={<FileText size={16} />} active={type==="protocol"} onClick={() => setType("protocol")} />
        </div>
        <div className="mt-3">
          <Input label="Name" placeholder={type === "folder" ? "New Folder" : "Untitled"} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="text-xs text-slate-500 mt-2">
          Tip: double‑click a folder to open it. Select an item to see its details on the right.
        </div>
      </Modal>

      <Modal
        open={renameOpen}
        title="Rename"
        onClose={() => setRenameOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={doRename}>Save</Button>
          </div>
        }
      >
        <Input label="Name" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
      </Modal>
    </div>
  );
}

function TypeButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={
        "rounded-2xl border px-3 py-3 text-left transition " +
        (active ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50")
      }
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-2 font-semibold">{icon}{label}</div>
    </button>
  );
}
