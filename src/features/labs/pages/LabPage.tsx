import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useLab } from "../useLab";
import { useToast } from "../../../components/toast/ToastProvider";
import { FileManager } from "../../filemanager/FileManager";
import { Link } from "react-router-dom";

export function LabPage() {
  const { labId } = useParams();
  const [search] = useSearchParams();
  const openId = search.get("open");
  const { lab, loading } = useLab(labId!);
  const { push } = useToast();

  const [focusItemId, setFocusItemId] = useState<string | null>(null);

  useEffect(() => {
    if (openId) setFocusItemId(openId);
  }, [openId]);

  if (!labId) return null;

  if (loading) {
    return <div className="text-sm text-slate-500">Loading lab…</div>;
  }

  if (!lab) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-slate-500">Lab not found.</div>
        <Link to="/labs">
          <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
            Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-sm text-slate-500">Lab</div>
          <div className="text-2xl font-semibold">{lab.name}</div>
          <div className="text-sm text-slate-500 mt-1">
            {lab.type === "shared" ? "Shared lab" : "Personal lab"}{" "}
            {lab.isPublic ? "• Public in lobby" : ""}
          </div>
        </div>
        <Link to="/labs">
          <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
            Lobby
          </Button>
        </Link>
      </div>

      <FileManager labId={labId} focusItemId={focusItemId} onFocusConsumed={() => setFocusItemId(null)} />
    </div>
  );
}
