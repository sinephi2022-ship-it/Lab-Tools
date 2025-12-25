import { Timestamp } from "firebase/firestore";

export type ItemType = "folder" | "note" | "timer" | "protocol" | "file";

export type ItemBase = {
  id: string;
  type: ItemType;
  name: string;
  parentId: string | null;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type NoteItem = ItemBase & {
  type: "note";
  content: string; // markdown
};

export type ProtocolStep = {
  id: string;
  text: string;
  checked: boolean;
  note?: string;
};

export type ProtocolItem = ItemBase & {
  type: "protocol";
  raw: string; // markdown with tables / math
  steps: ProtocolStep[];
};

export type TimerStatus = "idle" | "running" | "paused" | "done";

export type TimerItem = ItemBase & {
  type: "timer";
  durationSec: number;
  status: TimerStatus;
  startedAt?: Timestamp | null;
  // when paused, durationSec becomes remaining seconds
};

export type FileItem = ItemBase & {
  type: "file";
  mimeType: string;
  originalName: string;
  size: number;
  storagePath: string;
  downloadUrl: string;
};

export type FolderItem = ItemBase & { type: "folder" };

export type AnyItem = FolderItem | NoteItem | ProtocolItem | TimerItem | FileItem;
