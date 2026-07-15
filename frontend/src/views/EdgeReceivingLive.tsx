import * as React from "react";
import {
  ScanLine,
  Camera,
  Upload,
  Check,
  ShieldAlert,
  RefreshCw,
  Cpu,
  CloudOff,
  Lock,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";

/* Network failures vs. backend business errors (e.g. 409) read very differently —
 * classify so a 409 doesn't masquerade as "edge unreachable". */
function classifyError(e: string): { conn: boolean; msg: string } {
  if (/failed to fetch|networkerror|load failed/i.test(e)) return { conn: true, msg: e };
  const m = e.match(/\{"detail":"(.*?)"\}/);
  return { conn: false, msg: m ? m[1] : e };
}
import { cn } from "@/lib/utils";
import { TopRow } from "@/components/blocks/TopRow";
import { PillButton } from "@/components/blocks/PillButton";
import { StatusPill } from "@/components/blocks/StatusPill";
import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";
import { Spinner } from "@/components/ai/Spinner";
import { CopilotPanel } from "@/components/CopilotPanel";
import { useApp } from "@/state";
import { HandoffOverlay } from "@/components/HandoffOverlay";
import { ThinkingOverlay, sleep } from "@/lib/thinking";
import { ModelBadge } from "@/components/ModelBadge";
import { useEdgeMode } from "@/lib/edgeMode";
import { makeSamplePackingList } from "@/lib/sampleDoc";
import {
  edgeApi,
  type Health,
  type EdgeCase,
  type Extraction,
  type Evaluation,
  type ApproveResult,
  type SyncQueue,
  type ExtractedField,
  type P2PState,
  type PORecord,
} from "@/lib/edgeApi";

/* ──────────────────────────────────────────────────────────────────────────
 * Edge receiving · LIVE — the real closed loop against the edge-runtime on
 * :8077. Upload evidence → run on-device extraction + rules → human approval →
 * local audit + offline sync queue. Every value here is real backend data.
 * ────────────────────────────────────────────────────────────────────────── */

function Card({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="bg-white border border-divider rounded-md p-5 space-y-3">
      <header className="flex items-center gap-2">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">{label}</span>
        {right && <span className="ml-auto">{right}</span>}
      </header>
      {children}
    </article>
  );
}

function ConfidenceChip({ value }: { value: number }) {
  // Colour reflects CONFIDENCE only — a high-confidence read is green even when
  // the value disagrees with the PO (that mismatch is shown via the red value text).
  const low = value < 0.95;
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums",
        low ? "bg-surface-rose text-mark-red" : "bg-surface-mint text-surface-deep",
      )}
    >
      {Math.round(value * 100)}%
    </span>
  );
}

const STEPS = ["Capture", "Extract", "Evaluate", "Approve", "Handoff"];

function Stepper({ active }: { active: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <span
            className={cn(
              "text-[11px] font-bold px-2.5 py-1 rounded-full",
              i < active && "bg-surface-deep text-ink-inverse",
              i === active && "bg-surface-mint text-surface-deep ring-1 ring-surface-deep/30",
              i > active && "bg-surface-fog text-mute",
            )}
          >
            {i + 1} {s}
          </span>
          {i < STEPS.length - 1 && <ChevronRight size={12} className="text-mute shrink-0" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function FieldsTable({ fields }: { fields: ExtractedField[] }) {
  return (
    <div className="rounded-md border border-divider overflow-hidden">
      <table className="w-full text-[12.5px]">
        <tbody>
          {fields.map((f) => (
            <tr key={f.label} className="border-b border-divider last:border-b-0">
              <td className="px-3 py-2 text-mute w-[150px] align-top">{f.label}</td>
              <td className="px-3 py-2 align-top">
                <div className={cn("font-bold", f.flag ? "text-mark-red" : "text-ink")}>{f.value}</div>
                <div className="text-[11px] text-mute mt-0.5">{f.source}</div>
              </td>
              <td className="px-3 py-2 text-right align-top w-[60px]">
                <ConfidenceChip value={f.confidence} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EdgeReceivingLive() {
  const [health, setHealth] = React.useState<Health | null>(null);
  const [kase, setKase] = React.useState<EdgeCase | null>(null);
  const [extraction, setExtraction] = React.useState<Extraction | null>(null);
  const [evaluation, setEvaluation] = React.useState<Evaluation | null>(null);
  const [approval, setApproval] = React.useState<ApproveResult | null>(null);
  const [sync, setSync] = React.useState<SyncQueue | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const em = useEdgeMode(); // global runtime mode (switch lives in the sidebar)
  const { go, handoff, focus, clearFocus } = useApp();
  const [handingOff, setHandingOff] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [p2p, setP2p] = React.useState<P2PState | null>(null);
  const [damageBoxed, setDamageBoxed] = React.useState<{ url: string; count: number; model: string } | null>(null);
  const [cases, setCases] = React.useState<EdgeCase[]>([]);
  const [pos, setPos] = React.useState<PORecord[]>([]);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const activeRef = React.useRef<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const camRef = React.useRef<HTMLInputElement>(null);
  // Pre-select the case handed off from PO management (before the list loads).
  if (focus?.caseId && activeRef.current == null) activeRef.current = focus.caseId;
  React.useEffect(() => {
    if (focus?.caseId) clearFocus();
  }, [focus, clearFocus]);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const [h, cs, q, ps] = await Promise.all([
        edgeApi.health(),
        edgeApi.listCases(),
        edgeApi.syncQueue(),
        edgeApi.listPos(),
      ]);
      setHealth(h);
      setSync(q);
      setCases(cs);
      setPos(ps);
      const want = activeRef.current && cs.some((c) => c.id === activeRef.current) ? activeRef.current : cs[0]?.id ?? null;
      activeRef.current = want;
      if (want) {
        setKase(await edgeApi.getCase(want));
        setP2p(await edgeApi.getP2P(want));
      } else {
        setKase(null);
        setP2p(null);
      }
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const caseId = kase?.id;

  // Switch the active receiving case — resets the per-case step UI.
  const selectCase = async (id: string) => {
    if (!id || id === activeRef.current) return;
    activeRef.current = id;
    setExtraction(null);
    setEvaluation(null);
    setApproval(null);
    setDamageBoxed(null);
    setKase(await edgeApi.getCase(id));
    setP2p(await edgeApi.getP2P(id));
  };

  const boxDamage = async () => {
    if (!caseId) return;
    setBusy("damage");
    try {
      await sleep();
      const res = await edgeApi.annotateDamage(caseId);
      setDamageBoxed({ url: `${edgeApi.base}${res.boxedUrl}?t=${Date.now()}`, count: res.count, model: res.model });
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  // Open a new delivery (receiving case) against any PO from the ERP register.
  const newDelivery = async (poNumber: string) => {
    setBusy("newcase");
    try {
      await sleep();
      const created = await edgeApi.createCase(poNumber);
      setPickerOpen(false);
      activeRef.current = created.id;
      setExtraction(null);
      setEvaluation(null);
      setApproval(null);
      setDamageBoxed(null);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const onUpload = async (files: FileList | null) => {
    if (!caseId || !files || !files.length) return;
    setBusy("upload");
    try {
      await sleep();
      await edgeApi.uploadEvidence(caseId, files);
      setKase(await edgeApi.getCase(caseId));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const useSampleEvidence = async () => {
    if (!caseId) return;
    setBusy("upload");
    try {
      await sleep();
      const po = p2p?.purchaseOrder;
      if (po && po.poNumber === "45009281") {
        // Hero PO — the real BASF docs + damage photo (the polished exception).
        const samples: [string, string][] = [
          ["/sample-packing-list.png", "basf_packing_list.png"],
          ["/sample-damage.png", "damaged_cartons.png"],
        ];
        const files = await Promise.all(
          samples.map(async ([url, name]) => new File([await (await fetch(url)).blob()], name, { type: "image/png" })),
        );
        await edgeApi.uploadEvidence(caseId, files);
      } else if (po) {
        // Any other PO — generate a packing list that MATCHES this PO (real OCR) +
        // the real damage photo (so the damage-box step works on any case).
        const file = await makeSamplePackingList({
          poNumber: po.poNumber, supplier: po.supplier, material: po.material,
          ordered: po.ordered + 2, unit: po.unit, plant: kase?.plant ?? "Heidelberg", // over-deliver by 2 → over-qty exception
          requiredDocuments: p2p?.contract?.requiredDocuments ?? ["Packing list"],
        });
        const dmg = new File([await (await fetch("/sample-damage.png")).blob()], "damaged_cartons.png", { type: "image/png" });
        await edgeApi.uploadEvidence(caseId, [file, dmg]);
      }
      setKase(await edgeApi.getCase(caseId));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const runEdgeAI = async () => {
    if (!caseId) return;
    setBusy("ai");
    setApproval(null);
    try {
      await sleep();
      const x = await edgeApi.extract(caseId);
      setExtraction(x);
      const ev = await edgeApi.evaluate(caseId);
      setEvaluation(ev);
      const updated = await edgeApi.getCase(caseId);
      setKase(updated);
      // Auto-box the damage if a damage photo is on the case (deterministic, pinned).
      if (updated.evidence?.some((e) => e.kind === "damage")) {
        try {
          const r = await edgeApi.annotateDamage(caseId);
          setDamageBoxed({ url: `${edgeApi.base}${r.boxedUrl}?t=${Date.now()}`, count: r.count, model: r.model });
        } catch {
          /* boxing is best-effort; the button stays as a fallback */
        }
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const onApprove = async () => {
    if (!caseId) return;
    setBusy("approve");
    try {
      await sleep();
      const r = await edgeApi.approve(caseId, { decision: "approved", approver: "M. Keller" });
      setApproval(r);
      setSync(await edgeApi.syncQueue());
      setP2p(await edgeApi.getP2P(caseId)); // goods receipt now posted
      // Hand the posted goods receipt to AP (Invoice resolution), case pre-selected.
      setHandingOff("Invoice resolution");
      setTimeout(() => handoff({ kind: "agent", id: "invoice" }, { caseId }), 1100);
    } catch (e) {
      setError(String(e));
      setBusy(null);
    }
  };

  const onFlush = async () => {
    setBusy("flush");
    try {
      await sleep();
      await edgeApi.flushSync();
      setSync(await edgeApi.syncQueue());
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const activeStep = approval ? 4 : evaluation ? 3 : extraction ? 2 : kase?.evidence?.length ? 1 : 0;

  return (
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      {busy && !handingOff && <ThinkingOverlay />}
      {handingOff && <HandoffOverlay to={handingOff} />}
      <TopRow breadcrumb={{ label: "Edge receiving", chip: "Live" }} />

      {/* Edge status banner */}
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-white border border-divider px-5 py-3">
        <ScanLine size={18} className="text-surface-deep" />
        <span className="text-[14px] font-bold text-ink">Edge receiving control · live backend</span>
        <ModelBadge step="receiving" />
        {health ? (
          <>
            {/* Mode is read-only here — the switch lives in the sidebar (global) */}
            <span className="inline-flex items-center gap-1 rounded-md border border-divider bg-surface-fog px-2 py-0.5 text-[11px] font-bold text-surface-deep" title="Switch runtime mode in the sidebar">
              {em.mode === "offline" ? "Offline" : em.mode === "cloud-sync" ? "Cloud sync" : "Vertex"}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-mute"><Cpu size={12} /> {em.deviceId || health.deviceId}</span>
            <span className="text-[11px] text-mute">sync: <span className={cn("font-bold", em.syncEnabled ? "text-surface-deep" : "text-mute")}>{em.syncEnabled ? "on" : "off"}</span></span>
            <span className="text-[11px] text-mute">AI: <span className="font-bold text-surface-deep">{em.vertexAssist ? "Vertex" : "on-device"}</span></span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-surface-deep font-medium">
              <Lock size={12} /> Images processed locally — only hashes sync
            </span>
          </>
        ) : (
          <span className="text-[12px] text-mute">connecting to {edgeApi.base} …</span>
        )}
      </div>

      {/* Case switcher — receive against any PO (closes PR→…→PO→receiving) */}
      {health && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-white border border-divider px-5 py-2.5 relative">
          <span className="text-[11px] uppercase tracking-[0.06em] text-mute">Receiving case</span>
          <select
            value={caseId ?? ""}
            onChange={(e) => void selectCase(e.target.value)}
            className="text-[12.5px] rounded-md border border-divider bg-surface-fog px-2 py-1 text-ink max-w-[440px]"
          >
            {cases.length === 0 && <option value="">no cases yet</option>}
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.poNumber} · {c.title || c.id} · {c.status}</option>
            ))}
          </select>
          <div className="relative">
            <PillButton variant="secondary" size="sm" onClick={() => setPickerOpen((o) => !o)} disabled={busy === "newcase"}>
              <span className="inline-flex items-center gap-1.5">{busy === "newcase" ? <Spinner size={13} /> : <span className="text-[14px] leading-none">+</span>} New delivery</span>
            </PillButton>
            {pickerOpen && (
              <div className="absolute z-20 mt-1 w-[360px] max-h-[320px] overflow-auto rounded-md border border-divider bg-white shadow-lg p-1">
                <div className="px-2 py-1 text-[10.5px] uppercase tracking-[0.06em] text-mute">Open a delivery against a PO</div>
                {pos.length === 0 && <div className="px-2 py-2 text-[12px] text-mute">No POs — create one on PO management.</div>}
                {pos.map((p) => (
                  <button key={p.poNumber} type="button" onClick={() => void newDelivery(p.poNumber)} className="w-full text-left rounded px-2 py-1.5 hover:bg-surface-fog">
                    <div className="text-[12.5px] font-bold text-ink">{p.poNumber} · {p.supplier} {p.source === "po-agent" && <span className="text-[10px] uppercase font-bold text-surface-deep bg-surface-mint px-1 py-0.5 rounded ml-1">agent</span>}</div>
                    <div className="text-[11px] text-mute">{p.expectedQuantity} {p.unit} {p.material}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {kase && <span className="ml-auto text-[11px] text-mute">PO {kase.poNumber} · {kase.plant}</span>}
        </div>
      )}

      {error && (classifyError(error).conn ? (
        <div className="mt-3 rounded-md border border-mark-red/30 bg-surface-rose/30 px-5 py-4">
          <div className="flex items-center gap-2 text-[13px] font-bold text-mark-red">
            <CloudOff size={15} /> Edge-runtime not reachable
          </div>
          <p className="text-[12px] text-ink mt-1 leading-snug">
            {classifyError(error).msg}
            <br />
            Start it with <code className="bg-white px-1.5 py-0.5 rounded">PORT=8077 backend/scripts/run_edge_runtime.sh</code>,
            then <button className="underline font-medium" onClick={() => void load()}>retry</button>.
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-divider bg-white px-5 py-3 flex items-start gap-2">
          <AlertTriangle size={15} className="text-mark-red shrink-0 mt-0.5" />
          <p className="text-[12px] text-ink leading-snug flex-1">
            <span className="font-bold">This step can't run yet · </span>{classifyError(error).msg}
          </p>
          <button className="text-[12px] text-mute hover:text-ink" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      ))}

      <div className="mt-3"><Stepper active={activeStep} /></div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3 items-start">
        {/* Main work surface */}
        <div className="space-y-3 min-w-0">
          {/* Case + PO */}
          {kase && (
            <Card label="Inbound case · matched to purchase order" right={<StatusPill label={kase.status} kind="neutral" />}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
                <div><span className="text-mute">Case · </span><span className="font-bold text-ink">{kase.id}</span></div>
                <div><span className="text-mute">PO · </span><span className="font-bold text-ink">{kase.poNumber}</span></div>
                <div><span className="text-mute">Plant · </span>{kase.plant}</div>
                <div><span className="text-mute">Title · </span>{kase.title}</div>
              </div>
            </Card>
          )}

          {/* Evidence capture */}
          <Card
            label="1 · Capture evidence"
            right={
              <span className="inline-flex items-center gap-1.5 text-[11px] text-surface-deep">
                <Lock size={12} /> stays on device
              </span>
            }
          >
            {/* Accept everything real cameras produce — iPhone HEIC, Samsung/Android
                JPEG, PNG/WEBP/TIFF. The camera input opens the device camera on phones. */}
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.heic,.heif,.tiff"
              className="hidden"
              onChange={(e) => void onUpload(e.target.files)}
            />
            <input
              ref={camRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => void onUpload(e.target.files)}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <PillButton variant="deep" size="sm" onClick={() => fileRef.current?.click()}>
                <span className="inline-flex items-center gap-1.5">
                  {busy === "upload" ? <Spinner size={14} /> : <Upload size={14} />} Upload delivery evidence
                </span>
              </PillButton>
              <PillButton variant="secondary" size="sm" onClick={() => camRef.current?.click()}>
                <span className="inline-flex items-center gap-1.5"><Camera size={14} /> Take photo</span>
              </PillButton>
              <PillButton variant="secondary" size="sm" onClick={() => void useSampleEvidence()} disabled={busy === "upload"}>
                Use sample evidence
              </PillButton>
              <span className="text-[12px] text-mute">iPhone · Samsung · webcam · any image · click a thumbnail to view</span>
            </div>
            {kase?.evidence && kase.evidence.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {kase.evidence.map((e) => (
                  <div key={e.id} className="flex gap-3 rounded-md bg-surface-fog p-2">
                    <img
                      src={edgeApi.base + e.imageUrl}
                      alt={e.filename}
                      onClick={() => setPreview(edgeApi.base + e.imageUrl)}
                      className="w-16 h-16 rounded object-cover bg-white border border-divider shrink-0 cursor-zoom-in hover:ring-2 hover:ring-surface-deep/40"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12.5px] font-medium text-ink truncate">{e.filename}</span>
                        <span className="text-[9.5px] uppercase tracking-[0.04em] text-mute bg-white px-1.5 py-0.5 rounded shrink-0">{e.kind}</span>
                      </div>
                      <div className="text-[10.5px] text-mute mt-0.5">
                        {e.device ? `📱 ${e.device} · ` : ""}
                        {e.format && e.format !== "unknown" ? `${e.format} · ` : ""}
                        {e.width && e.height ? `${e.width}×${e.height}` : ""}
                      </div>
                      <div className="text-[10px] text-mute font-mono truncate mt-0.5">{e.sha256}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Run edge AI */}
          <Card label="2 · Extract + evaluate on-device">
            <div className="flex items-center gap-3">
              <PillButton variant="deep" size="sm" arrow onClick={() => void runEdgeAI()} disabled={!caseId || busy === "ai"}>
                <span className="inline-flex items-center gap-1.5">
                  {busy === "ai" ? <Spinner size={14} /> : <ScanLine size={14} />} Run Edge AI analysis
                </span>
              </PillButton>
              <span className="text-[12px] text-mute">reads fields → matches PO → rules engine</span>
            </div>

            {extraction && (
              <SpringIn>
                <div className="space-y-3 pt-1">
                  {(extraction.model || extraction.provider) && (
                    <div className="flex items-center gap-2 text-[11px] text-mute">
                      <span>read by <span className="font-bold text-surface-deep">{extraction.provider}{extraction.model ? ` · ${extraction.model}` : ""}</span></span>
                      {extraction.escalatedFrom && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.04em] bg-surface-mint text-surface-deep px-1.5 py-0.5 rounded">
                          ↑ escalated from {extraction.escalatedFrom}
                        </span>
                      )}
                    </div>
                  )}
                  <FieldsTable fields={extraction.fields} />
                  {evaluation && (
                    <>
                      <div className="grid grid-cols-4 gap-2">
                        <Metric label="PO match" value={`${evaluation.poMatchScore}%`} tone={evaluation.poMatchScore >= 90 ? "ok" : "warn"} />
                        <Metric label="Qty variance" value={`${evaluation.quantityVariance >= 0 ? "+" : ""}${evaluation.quantityVariance}`} tone={evaluation.quantityVariance !== 0 ? "warn" : "ok"} />
                        <Metric label="Damaged" value={String(evaluation.damagedCartons)} tone={evaluation.damagedCartons ? "warn" : "ok"} />
                        <Metric label="Exposure" value={`$${evaluation.paymentExposure.toLocaleString()}`} tone={evaluation.paymentExposure ? "warn" : "ok"} />
                      </div>

                      {/* Damage detection — box the damaged cartons (pinned; a trained YOLO would replace) */}
                      {kase?.evidence?.some((e) => e.kind === "damage") && (
                        <div className="rounded-md border border-divider p-3 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] uppercase tracking-[0.05em] text-surface-deep font-medium">Damage detection</span>
                            <span className="text-[11px] text-mute">bounding boxes · YOLO stand-in</span>
                            {!damageBoxed && (
                              <PillButton variant="secondary" size="sm" onClick={() => void boxDamage()} disabled={busy === "damage"}>
                                <span className="inline-flex items-center gap-1.5">{busy === "damage" ? <Spinner size={13} /> : <ScanLine size={13} />} Box the damage</span>
                              </PillButton>
                            )}
                          </div>
                          {damageBoxed && (
                            <SpringIn>
                              <img src={damageBoxed.url} alt="boxed damage" className="w-full rounded-md border border-divider cursor-zoom-in" onClick={() => setPreview(damageBoxed.url)} />
                              <p className="text-[11px] text-mute mt-1">{damageBoxed.count} damaged carton{damageBoxed.count === 1 ? "" : "s"} boxed · {damageBoxed.model}</p>
                            </SpringIn>
                          )}
                        </div>
                      )}
                      {/* match table */}
                      <div className="rounded-md border border-divider overflow-hidden">
                        <table className="w-full text-[12.5px]">
                          <thead className="bg-surface-fog text-[10.5px] uppercase tracking-[0.04em] text-mute">
                            <tr>
                              <th className="px-3 py-1.5 text-left font-medium">Item</th>
                              <th className="px-3 py-1.5 text-right font-medium">Ordered</th>
                              <th className="px-3 py-1.5 text-right font-medium">Received</th>
                              <th className="px-3 py-1.5 text-right font-medium">Damaged</th>
                              <th className="px-3 py-1.5 text-right font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {evaluation.matchLines.map((l) => (
                              <tr key={l.line} className="border-t border-divider">
                                <td className="px-3 py-2 font-medium text-ink">{l.item}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{l.ordered} {l.unit}</td>
                                <td className="px-3 py-2 text-right tabular-nums font-bold text-mark-red">{l.received} {l.unit}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-mark-red">{l.damaged}</td>
                                <td className="px-3 py-2 text-right">
                                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-surface-rose text-mark-red">{l.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* exception case */}
                      {evaluation.exceptionCase && (
                        <div className="rounded-md border border-mark-red/30 bg-surface-rose/25 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-mark-red text-ink-inverse flex items-center justify-center"><ShieldAlert size={14} /></span>
                            <span className="text-[12.5px] font-bold text-ink">Exception · {evaluation.exceptionCase.id}</span>
                            <span className="ml-auto text-[10px] uppercase font-bold text-mark-red bg-white/70 px-1.5 py-0.5 rounded">{evaluation.exceptionCase.severity}</span>
                          </div>
                          <p className="text-[12px] text-ink">{evaluation.exceptionCase.type}</p>
                          {evaluation.exceptionCase.damageSummary && (
                            <p className="text-[12px] text-ink italic flex items-start gap-1.5">
                              <Camera size={13} className="text-mark-red mt-0.5 shrink-0" />
                              <span>“{evaluation.exceptionCase.damageSummary}” <span className="not-italic text-mute">— VLM</span></span>
                            </p>
                          )}
                          <ul className="space-y-1">
                            {evaluation.recommendedActions.map((a) => (
                              <li key={a} className="flex items-start gap-2 text-[12px] text-ink">
                                <Check size={13} className="text-surface-deep mt-0.5 shrink-0" /> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </SpringIn>
            )}
          </Card>

          {/* Approve */}
          {evaluation && (
            <Card label="3 · Human approval">
              {!approval ? (
                <div className="flex items-center gap-3">
                  <PillButton variant="deep" size="sm" onClick={() => void onApprove()} disabled={busy === "approve"}>
                    <span className="inline-flex items-center gap-1.5">
                      {busy === "approve" ? <Spinner size={14} /> : <Check size={14} />} Approve · partial receipt
                    </span>
                  </PillButton>
                  <span className="text-[12px] text-mute">executes actions + seals the audit package</span>
                </div>
              ) : (
                <SpringIn>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[12.5px] font-bold text-surface-deep">
                      <Check size={15} strokeWidth={2.6} /> {approval.humanDecision} by {approval.approver}
                    </div>
                    <ul className="space-y-1">
                      {approval.autoActions.map((a) => (
                        <li key={a} className="flex items-start gap-2 text-[12px] text-ink">
                          <span className="w-4 h-4 rounded bg-surface-mint text-surface-deep flex items-center justify-center shrink-0 mt-0.5"><Check size={10} strokeWidth={3} /></span>
                          {a}
                        </li>
                      ))}
                    </ul>
                    <div className="text-[11px] text-mute break-all">audit · {approval.auditUri}</div>
                  </div>
                </SpringIn>
              )}
            </Card>
          )}

          {/* 4 · Handoff — receiving ENDS at the goods receipt. The four-way match
              + payment belong to AP / Invoice resolution (when the invoice arrives). */}
          {approval && p2p?.goodsReceipt && (
            <SpringIn>
              <Card label="4 · Handoff to Invoice resolution" right={<span className="text-[11px] text-mute">goods receipt posted</span>}>
                <div className="flex items-start gap-3 rounded-md bg-surface-mint/30 px-3 py-3">
                  <span className="w-8 h-8 rounded-md bg-white border border-divider text-surface-deep flex items-center justify-center shrink-0"><Check size={16} strokeWidth={2.6} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-ink">Goods receipt posted for PO {kase?.poNumber}</div>
                    <div className="text-[12px] text-mute">The dock's job is done. AP runs the four-way match + payment in Invoice resolution once the supplier invoice arrives.</div>
                  </div>
                </div>
                {(() => { const g = p2p.goodsReceipt!; return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Metric label="Received" value={String(g.received)} />
                    <Metric label="Accepted" value={String(g.accepted)} />
                    <Metric label="Damaged" value={String(g.damaged)} tone={g.damaged ? "warn" : "ok"} />
                    <Metric label="Docs missing" value={String(g.documentsMissing.length)} tone={g.documentsMissing.length ? "warn" : "ok"} />
                  </div>
                ); })()}
                <PillButton variant="deep" size="sm" arrow onClick={() => go({ kind: "agent", id: "invoice" })}>
                  <span className="inline-flex items-center gap-1.5">Open Invoice resolution</span>
                </PillButton>
              </Card>
            </SpringIn>
          )}

          {/* Grounded copilot — agent loop over this case's real receiving data */}
          {caseId && evaluation && (
            <CopilotPanel
              caseId={caseId}
              agent="receiving"
              chips={["Why was this flagged?", "What's the quantity variance?", "Which documents are missing?", "Is it safe to receive?"]}
            />
          )}
        </div>

        {/* Right rail — sync queue */}
        <aside className="space-y-3">
          <Card
            label="Offline sync queue"
            right={
              <PillButton variant="secondary" size="sm" onClick={() => void onFlush()} disabled={busy === "flush"}>
                <span className="inline-flex items-center gap-1.5">
                  {busy === "flush" ? <Spinner size={12} /> : <RefreshCw size={12} />} Flush
                </span>
              </PillButton>
            }
          >
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-surface-deep tabular-nums leading-none">{sync?.pending ?? 0}</span>
              <span className="text-[12px] text-mute">pending events</span>
            </div>
            <p className="text-[11.5px] text-mute leading-snug">
              {health?.mode !== "gcp"
                ? "Offline — structured events (metadata + hashes, no images) queue locally; nothing is sent to the cloud."
                : "GCP — approved events sync to the Cloud Run control plane / Firestore."}
            </p>
            {sync?.events.map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-md bg-surface-fog px-3 py-2 text-[11.5px]">
                <AIDot size={5} tone="mute" />
                <span className="font-medium text-ink truncate">{e.type}</span>
                <span className="ml-auto text-mute">{e.status}</span>
              </div>
            ))}
          </Card>

          <button
            type="button"
            onClick={() => void load()}
            className="ui-pill w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-divider bg-white px-3 py-2 text-[12px] text-ink hover:bg-surface-fog"
          >
            <RefreshCw size={13} /> Refresh from edge
          </button>
        </aside>
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setPreview(null)}
        >
          <img
            src={preview}
            alt="evidence"
            className="max-h-[90vh] max-w-[92vw] rounded-lg shadow-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 text-ink flex items-center justify-center hover:bg-white"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone = "ok" }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className={cn("rounded-md px-3 py-2.5 border", tone === "warn" ? "bg-surface-rose/30 border-mark-red/20" : "bg-surface-fog border-divider")}>
      <div className={cn("text-[18px] font-bold tabular-nums leading-none", tone === "warn" ? "text-mark-red" : "text-surface-deep")}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.05em] text-mute mt-1">{label}</div>
    </div>
  );
}
