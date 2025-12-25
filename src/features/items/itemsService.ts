import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, ref as storageRef } from "firebase/storage";
import { db, storage } from "../../lib/firebase";
import { AnyItem, ItemType } from "./types";
import { parseProtocolPaste } from "./protocols/protocolParsing";

function itemsCol(labId: string) {
  return collection(db, "labs", labId, "items");
}

export function listenItemsInFolder(
  labId: string,
  parentId: string | null,
  cb: (items: AnyItem[]) => void
) {
  const q = query(
    itemsCol(labId),
    where("parentId", "==", parentId),
    orderBy("type", "asc"),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const items: AnyItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    cb(items);
  });
}

export function listenAllItems(labId: string, cb: (items: AnyItem[]) => void) {
  const q = query(itemsCol(labId), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items: AnyItem[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    cb(items);
  });
}

export async function createItem(labId: string, args: { type: ItemType; name: string; parentId: string | null; createdBy: string; }) {
  const base = {
    type: args.type,
    name: args.name,
    parentId: args.parentId,
    createdBy: args.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as any;

  if (args.type === "note") base.content = "";
  if (args.type === "timer") {
    base.durationSec = 5 * 60;
    base.status = "idle";
    base.startedAt = null;
  }
  if (args.type === "protocol") {
    base.raw = "";
    base.steps = [];
  }
  if (args.type === "folder") { /* no extra */ }

  const ref = await addDoc(itemsCol(labId), base);
  return ref.id;
}

export async function updateItem(labId: string, itemId: string, patch: Record<string, any>) {
  await updateDoc(doc(db, "labs", labId, "items", itemId), { ...patch, updatedAt: serverTimestamp() });
}

export async function renameItem(labId: string, itemId: string, name: string) {
  await updateItem(labId, itemId, { name });
}

export async function moveItem(labId: string, itemId: string, parentId: string | null) {
  await updateItem(labId, itemId, { parentId });
}

export async function deleteItem(labId: string, itemId: string) {
  const ref = doc(db, "labs", labId, "items", itemId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as AnyItem;
  if (data.type === "file") {
    try {
      await deleteObject(storageRef(storage, data.storagePath));
    } catch {
      // ignore
    }
  }
  await deleteDoc(ref);
}

export async function applyProtocolPaste(labId: string, itemId: string, pasted: string) {
  const { steps, raw } = parseProtocolPaste(pasted);
  await updateItem(labId, itemId, { steps, raw });
}
