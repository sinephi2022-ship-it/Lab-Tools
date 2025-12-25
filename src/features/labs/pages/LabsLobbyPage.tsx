import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, UserRound, Globe, FlaskConical } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { useAuth } from "../../auth/useAuth";
import { useToast } from "../../../components/toast/ToastProvider";
import { createLab, listenMyLabs, listenPublicLabs } from "../labsService";
import { Lab } from "../types";

export function LabsLobbyPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const nav = useNavigate();

  const [myLabs, setMyLabs] = useState<Lab[]>([]);
  const [publicLabs, setPublicLabs] = useState<Lab[]>([]);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<"personal" | "shared">("personal");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenMyLabs(user.uid, setMyLabs);
    const unsub2 = listenPublicLabs((labs) => setPublicLabs(labs));
    return () => {
      unsub();
      unsub2();
    };
  }, [user]);

  const publicButNotMine = useMemo(() => {
    const mine = new Set(myLabs.map((l) => l.id));
    return publicLabs.filter((l) => !mine.has(l.id));
  }, [myLabs, publicLabs]);

  async function onCreate() {
    if (!user) return;
    if (!name.trim()) {
      push({ title: "Missing name", message: "Please enter a lab name." });
      return;
    }
    setBusy(true);
    try {
      const labId = await createLab({
        name: name.trim(),
        type,
        ownerUid: user.uid,
        isPublic: type === "shared" ? isPublic : false,
      });
      setOpen(false);
      setName("");
      setType("personal");
      setIsPublic(false);
      nav(`/lab/${labId}`);
    } catch (err: any) {
      push({ title: "Create failed", message: err?.message ?? "Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-2">
            <FlaskConical size={18} />
            Labs
          </div>
        }
        subtitle="Pick a lab to enter. Shared labs can be public in the lobby."
        actions={
          <Button
            variant="primary"
            onClick={() => setOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            New lab
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {myLabs.length === 0 ? (
            <div className="text-sm text-slate-500">
              No labs yet. Create one to start.
            </div>
          ) : (
            myLabs.map((lab) => (
              <button
                key={lab.id}
                className="text-left rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 p-4 transition"
                onClick={() => nav(`/lab/${lab.id}`)}
              >
                <div className="flex items-center gap-2">
                  {lab.type === "shared" ? <Users size={16} /> : <UserRound size={16} />}
                  <div className="font-semibold">{lab.name}</div>
                  {lab.isPublic && (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-100 border border-slate-200">
                      <Globe size={12} /> Public
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {lab.type === "shared" ? "Shared lab" : "Personal lab"}
                </div>
              </button>
            ))
          )}
        </div>

        {publicButNotMine.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-semibold mb-2">Public labs</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {publicButNotMine.slice(0, 6).map((lab) => (
                <div
                  key={lab.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <div className="font-semibold">{lab.name}</div>
                    <span className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white border border-slate-200">
                      <Globe size={12} /> Public
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    You can ask the owner to add you as a member (invite flow TBD).
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        title="Create a new lab"
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} disabled={busy}>
              {busy ? "Creating…" : "Create"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Lab name" placeholder="e.g., Polymer Screening" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <button
              className={"rounded-2xl border px-3 py-3 text-left transition " + (type === "personal" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50")}
              onClick={() => { setType("personal"); setIsPublic(false); }}
            >
              <div className="flex items-center gap-2 font-semibold"><UserRound size={16} /> Personal</div>
              <div className="text-sm text-slate-500 mt-1">Only you. Great for private work.</div>
            </button>
            <button
              className={"rounded-2xl border px-3 py-3 text-left transition " + (type === "shared" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50")}
              onClick={() => setType("shared")}
            >
              <div className="flex items-center gap-2 font-semibold"><Users size={16} /> Shared</div>
              <div className="text-sm text-slate-500 mt-1">Team lab. Can be public in lobby.</div>
            </button>
          </div>

          {type === "shared" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Make this lab visible in lobby (public)
            </label>
          )}

          <div className="text-xs text-slate-500">
            Inviting members by email is planned. For now, membership is enforced by Firestore rules and manual updates.
          </div>
        </div>
      </Modal>
    </div>
  );
}
