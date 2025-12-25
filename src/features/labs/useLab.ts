import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { Lab } from "./types";

export function useLab(labId: string) {
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "labs", labId), (snap) => {
      setLab(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Lab) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [labId]);

  return { lab, loading };
}
