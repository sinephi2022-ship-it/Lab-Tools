import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { nanoid } from "nanoid";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref as sRef, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "../../lib/firebase";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/toast/ToastProvider";
import { useAuth } from "../auth/useAuth";

export function UploadFileButton({
  labId,
  parentId,
  onCreated,
}: {
  labId: string;
  parentId: string | null;
  onCreated: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  async function onPick(file: File) {
    if (!user) return;
    setBusy(true);
    try {
      const id = nanoid();
      const path = `labs/${labId}/uploads/${Date.now()}_${id}_${file.name}`;
      const storageRef = sRef(storage, path);

      const task = uploadBytesResumable(storageRef, file);
      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          undefined,
          (err) => reject(err),
          () => resolve()
        );
      });

      const url = await getDownloadURL(storageRef);

      const docRef = await addDoc(collection(db, "labs", labId, "items"), {
        type: "file",
        name: file.name,
        parentId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        mimeType: file.type || "application/octet-stream",
        originalName: file.name,
        size: file.size,
        storagePath: path,
        downloadUrl: url,
      });

      onCreated(docRef.id);
      push({ title: "Uploaded", message: file.name });
    } catch (err: any) {
      push({ title: "Upload failed", message: err?.message ?? "Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        leftIcon={<Upload size={16} />}
      >
        {busy ? "Uploading…" : "Upload"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.currentTarget.value = "";
        }}
      />
    </>
  );
}
