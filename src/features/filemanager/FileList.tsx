import clsx from "clsx";
import { AnyItem } from "../items/types";
import { ItemIcon } from "./ItemIcon";
import { format } from "date-fns";

export function FileList({
  items,
  selectedId,
  onSelect,
  onOpen,
}: {
  items: AnyItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (item: AnyItem) => void;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-soft overflow-hidden">
      <div className="grid grid-cols-[1fr_110px] gap-2 px-4 py-2 border-b border-slate-200 text-xs text-slate-500">
        <div>Name</div>
        <div className="text-right">Updated</div>
      </div>
      <div className="divide-y divide-slate-200">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-sm text-slate-500">This folder is empty.</div>
        ) : (
          items.map((it) => {
            const isSel = it.id === selectedId;
            const updated = (it.updatedAt as any)?.toDate?.() as Date | undefined;
            return (
              <button
                key={it.id}
                className={clsx(
                  "w-full text-left px-4 py-3 grid grid-cols-[1fr_110px] gap-2 items-center",
                  "hover:bg-slate-50",
                  isSel && "bg-slate-50"
                )}
                onClick={() => onSelect(it.id)}
                onDoubleClick={() => onOpen(it)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-slate-600">
                    <ItemIcon item={it} />
                  </div>
                  <div className="font-medium truncate">{it.name}</div>
                  <div className="ml-auto text-xs text-slate-500 hidden lg:block">
                    {it.type}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {updated ? format(updated, "MM-dd HH:mm") : "-"}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
