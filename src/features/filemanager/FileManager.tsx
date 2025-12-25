import { useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { FileList } from "./FileList";
import { CreateBar } from "./CreateBar";
import { AnyItem } from "../items/types";
import { listenAllItems, listenItemsInFolder, moveItem } from "../items/itemsService";
import { Inspector } from "./Inspector";
import { useToast } from "../../components/toast/ToastProvider";

export function FileManager({
  labId,
  focusItemId,
  onFocusConsumed,
}: {
  labId: string;
  focusItemId: string | null;
  onFocusConsumed: () => void;
}) {
  const { push } = useToast();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [items, setItems] = useState<AnyItem[]>([]);
  const [allItems, setAllItems] = useState<AnyItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const itemsById = useMemo(() => {
    const map: Record<string, AnyItem> = {};
    for (const it of allItems) map[it.id] = it;
    return map;
  }, [allItems]);

  const selectedItem = selectedId ? itemsById[selectedId] ?? null : null;

  useEffect(() => {
    const unsub = listenItemsInFolder(labId, currentFolderId, setItems);
    return () => unsub();
  }, [labId, currentFolderId]);

  useEffect(() => {
    const unsub = listenAllItems(labId, setAllItems);
    return () => unsub();
  }, [labId]);

  // Focus logic (from global timer notification)
  useEffect(() => {
    if (!focusItemId) return;
    const it = itemsById[focusItemId];
    if (!it) return;

    setSelectedId(it.id);
    setCurrentFolderId(it.parentId);
    onFocusConsumed();
  }, [focusItemId, itemsById, onFocusConsumed]);

  // Keep selection visible when folder changes
  useEffect(() => {
    setSelectedId(null);
  }, [currentFolderId]);

  async function onOpen(item: AnyItem) {
    if (item.type === "folder") {
      setCurrentFolderId(item.id);
      return;
    }
    setSelectedId(item.id);
  }

  async function onCreated(id: string) {
    const it = itemsById[id];
    // it may not exist yet in snapshot; select anyway.
    setSelectedId(id);
    push({ title: "Created", message: "Item created." });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Breadcrumbs
          currentFolderId={currentFolderId}
          itemsById={itemsById}
          onNavigate={(id) => setCurrentFolderId(id)}
        />
      </div>

      <CreateBar
        labId={labId}
        currentFolderId={currentFolderId}
        selectedItem={selectedItem}
        onCreated={(id) => {
          setSelectedId(id);
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-3">
        <div className="space-y-3">
          <FileList
            items={items}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            onOpen={onOpen}
          />

          <div className="text-xs text-slate-500">
            Drag-and-drop move is planned. For now, use folders and manual organization.
          </div>
        </div>

        <Inspector
          labId={labId}
          item={selectedItem}
          itemsById={itemsById}
          onOpenFolder={(id) => setCurrentFolderId(id)}
        />
      </div>
    </div>
  );
}
