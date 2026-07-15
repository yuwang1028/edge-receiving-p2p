import * as React from "react";
import {
  Check,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  Bot,
  ScanLine,
  Camera,
  FileText,
  Tag,
  Boxes,
  PackageX,
  ShieldAlert,
  Truck,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/state";
import { agentsById } from "@/data/agents";
import {
  dockQueue,
  liveCaptures,
  extractedFields,
  matchLines,
  exceptionCase,
  analysisSteps,
  type DockDelivery,
  type DockCapture,
} from "@/data/receiving";
import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";
import { Spinner } from "@/components/ai/Spinner";
import { StatusPill } from "@/components/blocks/StatusPill";
import { PillButton } from "@/components/blocks/PillButton";
import { TopRow } from "@/components/blocks/TopRow";
import { AutonomyControl } from "@/components/agents/AutonomyControl";
import { AgentChat, type ChatTurn } from "@/components/agents/AgentChat";

/* ──────────────────────────────────────────────────────────────────────────
 * Goods Receipt Agent console — Edge AI on the receiving dock.
 *
 * Left column: slim hero · autonomy dial · output/handoff status · inbound dock
 * queue · "what the edge camera reads" explainer. Right rail: scripted chat.
 * Opening the flagged BeltPro delivery runs the ceremony: four camera captures
 * → "Run Edge AI analysis" → on-device extraction steps → extracted fields with
 * confidence → PO-match table (ordered vs received) → damage detection →
 * auto-generated exception case → Approve / Accept / Escalate / Reject.
 * ────────────────────────────────────────────────────────────────────────── */

function CardHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-2">
      <AIDot size={6} tone="deep" pulse />
      <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
        {label}
      </span>
      {right && <span className="ml-auto">{right}</span>}
    </header>
  );
}

function SlimHero() {
  const agent = agentsById.receiving;
  const Icon = agent.icon;
  return (
    <SpringIn>
      <section className="bg-white border border-divider rounded-md p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-surface-deep flex items-center justify-center shrink-0">
            <Icon size={20} strokeWidth={1.9} color="var(--ink-inverse)" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[19px] font-bold text-ink leading-tight">{agent.name}</h1>
              <StatusPill label="1 exception" kind="critical" pulse />
            </div>
            <p className="text-[13px] text-mute leading-snug mt-1 max-w-2xl">{agent.purpose}</p>
          </div>
          <div className="text-right shrink-0 pl-3">
            <div className="text-[18px] font-bold text-surface-deep leading-none">{agent.stat}</div>
            <div className="text-[10px] tracking-[0.06em] uppercase text-mute mt-1">Today · dock</div>
          </div>
        </div>
      </section>
    </SpringIn>
  );
}

/* ── Output / handoff card ─────────────────────────────────────────────────── */

const OUTPUT_META: Record<
  string,
  { label: string; kind: "active" | "critical" | "neutral"; note: string }
> = {
  none: {
    label: "Scanning the dock",
    kind: "neutral",
    note: "Open the flagged delivery to run the edge analysis and match it to the PO.",
  },
  pending: {
    label: "On hold",
    kind: "neutral",
    note: "BeltPro delivery parked at the dock — resume it from the queue when ready.",
  },
  approved: {
    label: `${exceptionCase.id} raised · routed`,
    kind: "critical",
    note: "46 EA received, 4 rejected on damage. Exception case routed to PO + Invoice; supplier claim opened.",
  },
  rejected: {
    label: "Delivery rejected",
    kind: "critical",
    note: "Whole BeltPro delivery turned away at the dock — nothing posted.",
  },
  escalated: {
    label: "Escalated",
    kind: "critical",
    note: "Routed to the buyer with the annotated photos and PO-match attached.",
  },
};

function OutputStatusCard({ onReopen }: { onReopen: () => void }) {
  const { agentOutputs } = useApp();
  const status = agentOutputs.receiving;
  const meta = OUTPUT_META[status];
  const resolved = status === "approved" || status === "escalated" || status === "rejected";

  return (
    <article className="bg-white border border-divider rounded-md p-5 space-y-3">
      <CardHeader
        label="Current output · handoff to PO + Invoice"
        right={<StatusPill label={meta.label} kind={meta.kind} pulse={status === "approved"} />}
      />
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-3",
          resolved ? "bg-surface-rose/30" : "bg-surface-fog",
        )}
      >
        <span
          className={cn(
            "w-9 h-9 rounded-md flex items-center justify-center shrink-0",
            resolved ? "bg-mark-red text-ink-inverse" : "bg-white border border-divider text-surface-deep",
          )}
        >
          {resolved ? <ShieldAlert size={17} strokeWidth={1.9} /> : <ScanLine size={17} strokeWidth={1.9} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-ink">
            {resolved ? `Exception case · ${exceptionCase.id}` : "No receipt posted yet"}
          </div>
          <div className="text-[12px] text-mute leading-snug mt-0.5">{meta.note}</div>
        </div>
        <PillButton variant="deep" size="sm" arrow onClick={onReopen}>
          {resolved ? "Reopen" : "Open delivery"}
        </PillButton>
      </div>
    </article>
  );
}

/* ── Inbound dock queue ────────────────────────────────────────────────────── */

const QUEUE_TONE: Record<DockDelivery["status"], { chip: string; label: string }> = {
  exception: { chip: "bg-surface-rose text-mark-red", label: "Exception" },
  clean: { chip: "bg-surface-mint text-surface-deep", label: "Auto-posted" },
  scanning: { chip: "bg-surface-fog text-surface-deep", label: "Scanning" },
  waiting: { chip: "bg-surface-fog text-mute", label: "Uploading" },
};

function DockRow({ d, onOpen }: { d: DockDelivery; onOpen: (d: DockDelivery) => void }) {
  const tone = QUEUE_TONE[d.status];
  return (
    <button
      type="button"
      onClick={() => onOpen(d)}
      className={cn(
        "ui-pill w-full text-left flex gap-3 px-4 py-3 border-b border-divider last:border-b-0 hover:bg-surface-fog",
        d.flagged && "bg-surface-rose/15",
      )}
    >
      <span
        className={cn(
          "w-9 h-9 rounded-md flex items-center justify-center shrink-0",
          d.flagged ? "bg-mark-red/10 text-mark-red" : "bg-surface-fog text-surface-deep",
        )}
      >
        <Truck size={17} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-ink truncate">{d.supplier}</span>
          <span className="text-[11px] text-mute truncate">· PO {d.po}</span>
          <span className={cn("ml-auto text-[9.5px] tracking-[0.04em] uppercase font-bold px-1.5 py-0.5 rounded shrink-0", tone.chip)}>
            {tone.label}
          </span>
        </span>
        <span className="flex items-center gap-2 mt-0.5 text-[11.5px] text-mute">
          <span>{d.door}</span>
          <span>· {d.carrier}</span>
          <span>· {d.load}</span>
          <span className="ml-auto inline-flex items-center gap-1">
            <Camera size={11} /> {d.shots}
          </span>
          <span>{d.time}</span>
        </span>
        <span className="block text-[12px] text-ink leading-snug mt-0.5 line-clamp-1">{d.note}</span>
      </span>
    </button>
  );
}

function DockQueue({ onOpen }: { onOpen: (d: DockDelivery) => void }) {
  const exceptions = dockQueue.filter((d) => d.status === "exception").length;
  return (
    <article className="bg-white border border-divider rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-divider flex items-center gap-2">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
          Inbound · dock queue
        </span>
        <span className="ml-auto text-[11px] font-bold text-mark-red bg-surface-rose px-2 py-0.5 rounded-full">
          {exceptions} exception
        </span>
      </div>
      <div>
        {dockQueue.map((d) => (
          <DockRow key={d.id} d={d} onOpen={onOpen} />
        ))}
      </div>
    </article>
  );
}

/* ── "What the edge camera reads" explainer ────────────────────────────────── */

const CAPTURE_ICON: Record<DockCapture["tone"], React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  doc: FileText,
  label: Tag,
  pallet: Boxes,
  damage: PackageX,
};

function CaptureExplainer() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="What the edge camera reads at the dock" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {liveCaptures.map((c) => {
          const Icon = CAPTURE_ICON[c.tone];
          return (
            <div key={c.kind} className="flex items-start gap-2.5 rounded-md bg-surface-fog px-3 py-2.5">
              <span className="w-8 h-8 rounded-md bg-white border border-divider text-surface-deep flex items-center justify-center shrink-0">
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold text-ink leading-tight flex items-center gap-1.5">
                  {c.label}
                  {c.zh && <span className="text-[11px] text-mute font-normal">{c.zh}</span>}
                </div>
                <div className="text-[11.5px] text-mute leading-snug mt-0.5">{c.caption}</div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

/* ── Camera-capture placeholder tile (no real assets) ──────────────────────── */

const TILE_BG: Record<DockCapture["tone"], string> = {
  doc: "from-[#eef1f5] to-[#dfe5ec]",
  label: "from-[#eaf2fb] to-[#d6e6f7]",
  pallet: "from-[#eef0ec] to-[#dde2d8]",
  damage: "from-[#fdeceb] to-[#f7d9d6]",
};

function CornerBrackets({ tone }: { tone: "mark" | "ink" }) {
  const c = tone === "mark" ? "border-mark-red" : "border-ink/40";
  return (
    <>
      <span className={cn("absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2", c)} />
      <span className={cn("absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2", c)} />
      <span className={cn("absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2", c)} />
      <span className={cn("absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2", c)} />
    </>
  );
}

function CaptureTile({ c, analysed }: { c: DockCapture; analysed: boolean }) {
  const Icon = CAPTURE_ICON[c.tone];
  const isDamage = c.tone === "damage";
  return (
    <div className="relative rounded-md overflow-hidden border border-divider">
      <div className={cn("relative aspect-[4/3] bg-gradient-to-br flex items-center justify-center", TILE_BG[c.tone])}>
        <CornerBrackets tone={analysed && isDamage ? "mark" : "ink"} />
        <Icon size={30} strokeWidth={1.4} className={cn(isDamage ? "text-mark-red/70" : "text-ink/45")} />

        {/* Live edge overlay */}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[8.5px] tracking-[0.08em] uppercase font-bold text-ink/55">
          <span className="w-1.5 h-1.5 rounded-full bg-mark-red animate-pulse" /> Edge cam
        </span>

        {/* Detection box appears after analysis */}
        {analysed && (
          <SpringIn>
            {isDamage ? (
              <span className="absolute inset-[26%] border-2 border-mark-red rounded-sm">
                <span className="absolute -top-4 left-0 text-[8.5px] font-bold text-mark-red bg-white/90 px-1 rounded-sm whitespace-nowrap">
                  crushed corner 0.93
                </span>
              </span>
            ) : (
              <span className="absolute inset-[30%] border-2 border-surface-deep/70 rounded-sm">
                <span className="absolute -top-4 left-0 text-[8.5px] font-bold text-surface-deep bg-white/90 px-1 rounded-sm whitespace-nowrap">
                  read ✓
                </span>
              </span>
            )}
          </SpringIn>
        )}
      </div>
      <div className="px-2.5 py-2 bg-white">
        <div className="text-[11.5px] font-bold text-ink leading-tight flex items-center gap-1.5">
          {c.label}
          {c.zh && <span className="text-[10.5px] text-mute font-normal">{c.zh}</span>}
        </div>
        <div className="text-[10.5px] text-mute leading-snug mt-0.5">{c.caption}</div>
      </div>
    </div>
  );
}

/* ── Extraction ceremony ───────────────────────────────────────────────────── */

function AnalysisSteps({ onComplete }: { onComplete: () => void }) {
  const [done, setDone] = React.useState(0);

  React.useEffect(() => {
    if (done >= analysisSteps.length) {
      const t = window.setTimeout(onComplete, 600);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setDone((d) => d + 1), 720);
    return () => window.clearTimeout(t);
  }, [done, onComplete]);

  return (
    <div className="space-y-2.5">
      {analysisSteps.map((label, i) => {
        const isDone = i < done;
        const isActive = i === done;
        return (
          <div key={label} className="flex items-center gap-3">
            <span className="w-5 h-5 flex items-center justify-center shrink-0">
              {isDone ? (
                <span className="w-5 h-5 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center">
                  <Check size={12} strokeWidth={3} />
                </span>
              ) : isActive ? (
                <Spinner size={16} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-divider" />
              )}
            </span>
            <span
              className={cn(
                "text-[13px] leading-snug",
                isDone ? "text-ink" : isActive ? "text-ink font-medium" : "text-mute",
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Result blocks ─────────────────────────────────────────────────────────── */

function ConfidenceChip({ value, flag }: { value: number; flag?: boolean }) {
  const pct = Math.round(value * 100);
  const low = value < 0.95;
  return (
    <span
      className={cn(
        "text-[10px] tracking-[0.03em] font-bold px-1.5 py-0.5 rounded tabular-nums",
        flag || low ? "bg-surface-rose text-mark-red" : "bg-surface-mint text-surface-deep",
      )}
    >
      {pct}%
    </span>
  );
}

function ExtractedFieldsCard() {
  return (
    <div className="rounded-md border border-divider overflow-hidden">
      <div className="px-3 py-2 bg-surface-fog flex items-center gap-2">
        <Sparkles size={13} className="text-surface-deep" />
        <span className="text-[11px] tracking-[0.06em] uppercase font-bold text-surface-deep">
          Extracted on-device
        </span>
        <span className="ml-auto text-[11px] text-mute">field · confidence</span>
      </div>
      <table className="w-full text-[12.5px]">
        <tbody>
          {extractedFields.map((f) => (
            <tr key={f.label} className="border-b border-divider last:border-b-0">
              <td className="px-3 py-2 text-mute w-[140px] align-top">{f.label}</td>
              <td className="px-3 py-2 align-top">
                <div className={cn("font-bold", f.flag ? "text-mark-red" : "text-ink")}>{f.value}</div>
                <div className="text-[11px] text-mute leading-snug mt-0.5">{f.source}</div>
              </td>
              <td className="px-3 py-2 text-right align-top w-[60px]">
                <ConfidenceChip value={f.confidence} flag={f.flag} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LINE_TONE: Record<string, { chip: string; label: string }> = {
  match: { chip: "bg-surface-mint text-surface-deep", label: "Match" },
  short: { chip: "bg-surface-rose text-mark-red", label: "Short" },
  over: { chip: "bg-surface-rose text-mark-red", label: "Over" },
  damaged: { chip: "bg-surface-rose text-mark-red", label: "Damaged" },
};

function MatchTable() {
  return (
    <div className="rounded-md border border-divider overflow-hidden">
      <div className="px-3 py-2 bg-surface-fog flex items-center gap-2">
        <span className="text-[11px] tracking-[0.06em] uppercase font-bold text-surface-deep">
          PO match · ordered vs received
        </span>
        <span className="ml-auto text-[11px] text-mute">PO {exceptionCase.po}</span>
      </div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-[10.5px] tracking-[0.04em] uppercase text-mute">
            <th className="px-3 py-1.5 text-left font-medium">Line</th>
            <th className="px-3 py-1.5 text-left font-medium">Item</th>
            <th className="px-3 py-1.5 text-right font-medium">Ordered</th>
            <th className="px-3 py-1.5 text-right font-medium">Received</th>
            <th className="px-3 py-1.5 text-right font-medium">Damaged</th>
            <th className="px-3 py-1.5 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {matchLines.map((l) => {
            const tone = LINE_TONE[l.status];
            return (
              <tr key={l.line} className="border-t border-divider">
                <td className="px-3 py-2 tabular-nums text-mute">{l.line}</td>
                <td className="px-3 py-2 font-medium text-ink">{l.item}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.ordered} {l.unit}</td>
                <td className="px-3 py-2 text-right tabular-nums font-bold text-mark-red">{l.received} {l.unit}</td>
                <td className="px-3 py-2 text-right tabular-nums text-mark-red">{l.damaged}</td>
                <td className="px-3 py-2 text-right">
                  <span className={cn("text-[10px] tracking-[0.03em] uppercase font-bold px-1.5 py-0.5 rounded", tone.chip)}>
                    {tone.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ExceptionCaseCard() {
  return (
    <div className="rounded-md border border-mark-red/30 bg-surface-rose/25 overflow-hidden">
      <div className="px-3 py-2.5 flex items-center gap-2 border-b border-mark-red/20">
        <span className="w-6 h-6 rounded-md bg-mark-red text-ink-inverse flex items-center justify-center shrink-0">
          <ShieldAlert size={14} strokeWidth={2.1} />
        </span>
        <span className="text-[12.5px] font-bold text-ink">
          Exception case auto-generated · {exceptionCase.id}
        </span>
        <span className="ml-auto text-[10px] tracking-[0.04em] uppercase font-bold text-mark-red bg-white/70 px-1.5 py-0.5 rounded">
          {exceptionCase.severity}
        </span>
      </div>
      <div className="px-3 py-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
          <div><span className="text-mute">Type · </span><span className="font-medium text-ink">{exceptionCase.type}</span></div>
          <div><span className="text-mute">PO · </span><span className="font-medium text-ink">{exceptionCase.po}</span></div>
          <div><span className="text-mute">Supplier · </span><span className="font-medium text-ink">{exceptionCase.supplier}</span></div>
          <div><span className="text-mute">Detected · </span><span className="font-medium text-ink">{exceptionCase.detected}</span></div>
        </div>
        <p className="text-[12px] text-ink leading-snug"><span className="font-bold">Root cause. </span>{exceptionCase.rootCause}</p>
        <p className="text-[12px] text-ink leading-snug"><span className="font-bold">Impact. </span>{exceptionCase.impact}</p>
        <div>
          <div className="text-[10.5px] tracking-[0.05em] uppercase text-mute font-medium mb-1">Recommended actions</div>
          <ul className="space-y-1">
            {exceptionCase.recommended.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px] text-ink">
                <Check size={13} strokeWidth={2.6} className="text-surface-deep mt-0.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Decision buttons ──────────────────────────────────────────────────────── */

function ActionButton({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "approve" | "accept" | "escalate" | "reject";
  onClick: () => void;
}) {
  const cls = {
    approve: "bg-surface-deep text-ink-inverse hover:bg-accent-green",
    accept: "bg-white text-ink border border-ink/30 hover:bg-surface-fog",
    escalate: "bg-white text-mark-red border border-mark-red/40 hover:bg-surface-rose/30",
    reject: "bg-white text-mute border border-divider hover:bg-surface-fog",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ui-pill flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-[13px] font-bold whitespace-nowrap",
        cls,
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ── The dock-scan modal ───────────────────────────────────────────────────── */

type Phase = "read" | "analyzing" | "done";

function DeliveryModal({ delivery, onClose }: { delivery: DockDelivery; onClose: () => void }) {
  const { setAgentOutput } = useApp();
  const [phase, setPhase] = React.useState<Phase>("read");
  const analysed = phase === "done";

  const decide = (status: "approved" | "pending" | "escalated" | "rejected") => {
    setAgentOutput("receiving", status);
    onClose();
  };

  // Non-live deliveries (already auto-posted / uploading) just show a short note.
  if (!delivery.actionable) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
        <div className="ai-spring w-full max-w-md bg-white rounded-lg shadow-xl p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-[15px] font-bold text-ink">{delivery.supplier} · PO {delivery.po}</h2>
          <p className="text-[13px] text-mute leading-snug">{delivery.note}</p>
          <div className="flex justify-end">
            <PillButton variant="secondary" onClick={onClose}>Close</PillButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="ai-spring w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-divider flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Truck size={15} className="text-mark-red shrink-0" />
              <h2 className="text-[15px] font-bold text-ink leading-tight truncate">
                {delivery.supplier} · PO {delivery.po}
              </h2>
            </div>
            <div className="text-[12px] text-mute mt-1">
              {delivery.door} · {delivery.carrier} · {delivery.load} · {delivery.time}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-pill w-8 h-8 rounded-full text-mute hover:text-ink flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 space-y-4">
          {/* Camera captures */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Camera size={13} className="text-surface-deep" />
              <span className="text-[11px] tracking-[0.06em] uppercase font-bold text-surface-deep">
                Edge captures · {liveCaptures.length} photos
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {liveCaptures.map((c) => (
                <CaptureTile key={c.kind} c={c} analysed={analysed} />
              ))}
            </div>
          </div>

          {/* Analyzing */}
          {phase === "analyzing" && (
            <SpringIn>
              <div className="rounded-md border border-divider bg-surface-fog p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AIDot size={6} tone="deep" pulse />
                  <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-bold">
                    Goods receipt agent · on-device inference
                  </span>
                </div>
                <AnalysisSteps onComplete={() => setPhase("done")} />
              </div>
            </SpringIn>
          )}

          {/* Results */}
          {phase === "done" && (
            <SpringIn>
              <div className="space-y-3">
                <ExtractedFieldsCard />
                <MatchTable />
                <div className="flex items-start gap-2 rounded-md bg-surface-rose/30 border border-mark-red/20 px-3 py-2.5">
                  <PackageX size={15} className="text-mark-red mt-0.5 shrink-0" strokeWidth={2} />
                  <p className="text-[12.5px] text-ink leading-snug">
                    Vision model flagged a <span className="font-bold">crushed corner on pallet 2</span> — 4 of 50
                    cartons compromised (confidence 0.93). Received qty falls 4 short of the PO. The clean four-way
                    match would have paid all 50; the dock catch stops it.
                  </p>
                </div>
                <ExceptionCaseCard />
              </div>
            </SpringIn>
          )}
        </div>

        {/* Footer */}
        <footer className="px-5 py-4 border-t border-divider bg-surface-fog/50 shrink-0">
          {phase === "read" && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-mute">
                The agent reads the four captures, extracts the fields, matches the PO and inspects for damage.
              </span>
              <PillButton variant="deep" arrow onClick={() => setPhase("analyzing")}>
                Run Edge AI analysis
              </PillButton>
            </div>
          )}
          {phase === "analyzing" && (
            <div className="flex items-center gap-2 text-[12px] text-mute">
              <Spinner size={14} /> Running on-device inference…
            </div>
          )}
          {phase === "done" && (
            <div className="space-y-2">
              <div className="text-[11px] tracking-[0.06em] uppercase text-mute font-medium">
                Decide on the exception
              </div>
              <div className="flex">
                <ActionButton
                  tone="approve"
                  icon={<Check size={15} strokeWidth={2.4} />}
                  label="Approve case & route"
                  onClick={() => decide("approved")}
                />
              </div>
              <div className="flex items-stretch gap-2">
                <ActionButton
                  tone="accept"
                  icon={<Clock size={15} strokeWidth={2.2} />}
                  label="Hold"
                  onClick={() => decide("pending")}
                />
                <ActionButton
                  tone="escalate"
                  icon={<AlertTriangle size={15} strokeWidth={2.2} />}
                  label="Escalate"
                  onClick={() => decide("escalated")}
                />
                <ActionButton
                  tone="reject"
                  icon={<X size={15} strokeWidth={2.2} />}
                  label="Reject delivery"
                  onClick={() => decide("rejected")}
                />
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

/* ── Chat script ───────────────────────────────────────────────────────────── */

const receivingChatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Goods Receipt Agent. A camera on every dock door reads each delivery as it lands — packing list, box marks, pallet and any damage. A truck just pulled into Dock 3. Want the read?",
      },
    ],
    chips: ["What came in on Dock 3?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "BeltPro Industrial against PO 4500039217 — the No.2 double-backer belt. I read the PO, supplier, item and lot at 0.96+, but the carton count comes back 46, not the 50 ordered.",
      },
    ],
    chips: ["Why only 46?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Pallet 2 has a crushed corner — 4 cartons compromised. So it's short and damaged. Left alone, the invoice would four-way match against the PO and pay for all 50. Shall I raise the exception case?",
      },
    ],
    chips: ["Yes — raise the exception"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "Raising EXC-2207 now — posting 46 accepted, rejecting 4 damaged, opening a supplier claim and blocking the invoice match to the received qty. Opening it for you.",
      },
    ],
  },
];

const EXC_TRIGGER_TURN = 3;

/* ── Console ───────────────────────────────────────────────────────────────── */

export function ReceivingConsole() {
  const [openDelivery, setOpenDelivery] = React.useState<DockDelivery | null>(null);
  const [chatHidden, setChatHidden] = React.useState(true);
  const agent = agentsById.receiving;

  const live = dockQueue.find((d) => d.actionable) ?? dockQueue[0];

  const handleReachTurn = React.useCallback(
    (i: number) => {
      if (i === EXC_TRIGGER_TURN) window.setTimeout(() => setOpenDelivery(live), 900);
    },
    [live],
  );

  return (
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <TopRow breadcrumb={{ label: "Agent workforce", chip: agent.menuLabel }} />

      <div
        className={cn(
          "mt-3 grid grid-cols-1 gap-3 items-start",
          !chatHidden && "lg:grid-cols-[1fr_360px]",
        )}
      >
        {/* Left — work surface */}
        <div className="space-y-3 min-w-0">
          <SlimHero />
          <AutonomyControl agent={agent} />
          <OutputStatusCard onReopen={() => setOpenDelivery(live)} />
          <DockQueue onOpen={setOpenDelivery} />
          <CaptureExplainer />
          <div className="flex items-center justify-between gap-4 rounded-md bg-white border border-divider px-5 py-4">
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-ink">See the Goods Receipt agent catch the bad delivery</div>
              <p className="text-[12px] text-mute leading-snug mt-0.5">
                Reads the BeltPro delivery at Dock 3, matches PO 4500039217 and raises the exception.
              </p>
            </div>
            <PillButton variant="deep" size="sm" arrow onClick={() => setOpenDelivery(live)}>
              <span className="inline-flex items-center gap-1">
                Open the flagged delivery <ChevronRight size={14} />
              </span>
            </PillButton>
          </div>
        </div>

        {/* Right — conversation rail */}
        {!chatHidden && (
          <aside className="lg:sticky lg:top-4">
            <div className="rounded-md border border-divider overflow-hidden h-[calc(100vh-2rem)]">
              <AgentChat
                agentName="Goods receipt agent"
                script={receivingChatScript}
                onHide={() => setChatHidden(true)}
                onReachTurn={handleReachTurn}
              />
            </div>
          </aside>
        )}
      </div>

      {chatHidden && (
        <button
          type="button"
          onClick={() => setChatHidden(false)}
          className="ui-pill fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-surface-deep text-ink-inverse px-4 py-2.5 text-[13px] font-bold shadow-lg hover:bg-accent-green"
        >
          <Bot size={16} strokeWidth={1.9} /> Chat with Goods receipt
        </button>
      )}

      {openDelivery && <DeliveryModal delivery={openDelivery} onClose={() => setOpenDelivery(null)} />}
    </div>
  );
}
