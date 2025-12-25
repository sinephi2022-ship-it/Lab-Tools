import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Lab } from "./types";

export function listenMyLabs(uid: string, cb: (labs: Lab[]) => void) {
  const q = query(
    collection(db, "labs"),
    where("members", "array-contains", uid),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const labs: Lab[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    cb(labs);
  });
}

export function listenPublicLabs(cb: (labs: Lab[]) => void) {
  const q = query(collection(db, "labs"), where("isPublic", "==", true), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    const labs: Lab[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    cb(labs);
  });
}

export async function createLab(args: {
  name: string;
  type: "personal" | "shared";
  ownerUid: string;
  memberEmails?: string[]; // placeholder for future invite flow
  isPublic: boolean;
}) {
  const members = [args.ownerUid]; // invite flow can be added later
  const docRef = await addDoc(collection(db, "labs"), {
    name: args.name,
    type: args.type,
    ownerUid: args.ownerUid,
    members,
    isPublic: args.isPublic,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function touchLab(labId: string) {
  await updateDoc(doc(db, "labs", labId), { updatedAt: serverTimestamp() });
}
