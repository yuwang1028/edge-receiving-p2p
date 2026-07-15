import * as React from "react";
import { HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEdgeMode, setEdgeMode } from "@/lib/edgeMode";

/* Global runtime-mode switch — lives in the sidebar footer because the mode is a
 * device-level posture that changes every console's engine. AI extract/assist
 * follows the mode; the decisions stay rules + human in every mode. */

const FALLBACK = [
  { id: "offline", label: "Offline" },
  { id: "cloud-sync", label: "Cloud sync" },
  { id: "vertex", label: "Vertex" },
];
const short = (id: string) => (id === "offline" ? "Offline" : id === "cloud-sync" ? "Cloud" : id === "vertex" ? "Vertex" : id);

export function EdgeModeControl() {
  const s = useEdgeMode();
  const [busy, setBusy] = React.useState(false);
  const modes = s.modes.length ? s.modes : FALLBACK;

  const pick = async (m: string) => {
    setBusy(true);
    try {
      await setEdgeMode(m);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 py-3 border-t border-divider">
      <div className="flex items-center gap-1.5 mb-1.5">
        <HardDrive size={12} className="text-mute" />
        <span className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-mute">Edge device</span>
        <span className={cn("ml-auto w-1.5 h-1.5 rounded-full", s.error ? "bg-mark-red" : "bg-surface-deep")} title={s.error ? "edge-runtime unreachable" : "live"} />
      </div>
      <div className="text-[12px] font-bold text-ink mb-2 truncate">{s.deviceId || "edge-runtime"}</div>

      <div className="inline-flex w-full rounded-md border border-divider overflow-hidden text-[10.5px] font-bold mb-1.5">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={busy}
            title={m.label}
            onClick={() => void pick(m.id)}
            className={cn(
              "flex-1 px-1.5 py-1 border-l border-divider first:border-l-0 disabled:opacity-60",
              s.mode === m.id ? "bg-surface-deep text-ink-inverse" : "bg-white text-mute hover:bg-surface-fog",
            )}
          >
            {short(m.id)}
          </button>
        ))}
      </div>

      <div className="text-[10.5px] text-mute">
        sync <b className={s.syncEnabled ? "text-surface-deep" : "text-mute"}>{s.syncEnabled ? "on" : "off"}</b>
        {" · "}AI <b className="text-surface-deep">{s.vertexAssist ? "Vertex" : "on-device"}</b>
      </div>
    </div>
  );
}
