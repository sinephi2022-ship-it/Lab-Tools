import { AnyItem } from "../items/types";
import { Folder, StickyNote, Timer, FileText, Image as Img, File } from "lucide-react";

export function ItemIcon({ item }: { item: AnyItem }) {
  const size = 16;
  switch (item.type) {
    case "folder":
      return <Folder size={size} />;
    case "note":
      return <StickyNote size={size} />;
    case "timer":
      return <Timer size={size} />;
    case "protocol":
      return <FileText size={size} />;
    case "file":
      if (item.mimeType.startsWith("image/")) return <Img size={size} />;
      return <File size={size} />;
    default:
      return null as any;
  }
}
