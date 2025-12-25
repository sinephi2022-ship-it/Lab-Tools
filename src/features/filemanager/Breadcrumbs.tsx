import { AnyItem } from "../items/types";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs({
  currentFolderId,
  itemsById,
  onNavigate,
}: {
  currentFolderId: string | null;
  itemsById: Record<string, AnyItem>;
  onNavigate: (folderId: string | null) => void;
}) {
  const crumbs: { id: string | null; name: string }[] = [{ id: null, name: "Home" }];
  let cursor = currentFolderId;

  const safety = new Set<string>();
  while (cursor) {
    if (safety.has(cursor)) break;
    safety.add(cursor);
    const it = itemsById[cursor];
    if (!it) break;
    crumbs.push({ id: it.id, name: it.name });
    cursor = it.parentId;
  }
  crumbs.reverse();

  return (
    <div className="flex items-center gap-1 text-sm text-slate-600">
      {crumbs.map((c, idx) => (
        <div key={`${c.id ?? "root"}:${idx}`} className="flex items-center gap-1">
          <button
            className="px-2 py-1 rounded-lg hover:bg-slate-100"
            onClick={() => onNavigate(c.id)}
            title={c.name}
          >
            {idx === 0 ? (
              <span className="inline-flex items-center gap-1">
                <Home size={14} /> {c.name}
              </span>
            ) : (
              c.name
            )}
          </button>
          {idx < crumbs.length - 1 && <ChevronRight size={14} className="text-slate-400" />}
        </div>
      ))}
    </div>
  );
}
