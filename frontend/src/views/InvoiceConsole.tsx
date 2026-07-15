import * as React from "react";
import { ReceiptText, X, RefreshCw, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/state";
import { agentsById } from "@/data/agents";
import { TopRow } from "@/components/blocks/TopRow";
import { PillButton } from "@/components/blocks/PillButton";
import { StatusPill } from "@/components/blocks/StatusPill";
import { AIDot } from "@/components/ai/AIDot";
import { Spinner } from "@/components/ai/Spinner";
import { CopilotPanel } from "@/components/CopilotPanel";
import { FourWayMatch } from "@/components/FourWayMatch";
import { edgeApi, type P2PState, type EdgeCase } from "@/lib/edgeApi";
import { ModelBadge } from "@/components/ModelBadge";
import { ThinkingOverlay, sleep } from "@/lib/thinking";

/* ──────────────────────────────────────────────────────────────────────────
 * Invoice Resolution Agent console — REAL (backend-driven).
 *
 * This is where AP runs the four-way match (contract · PO · goods receipt ·
 * invoice) and releases payment — NOT the dock. Pick any case whose goods receipt
 * was posted by receiving, bring in the supplier invoice (scanned → IDP, or EDI),
 * run the match against the REAL goods receipt, release/hold payment. Paired with
 * the grounded invoice copilot.
 * ────────────────────────────────────────────────────────────────────────── */

const HERO_PO = "45009281"; // the hero PO ships a scanned invoice (IDP); others arrive via EDI

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

const money = (n: number) => "$" + Math.round(n).toLocaleString();

export function InvoiceConsole() {
  const agent = agentsById.invoice;
  const [cases, setCases] = React.useState<EdgeCase[]>([]);
  const [p2p, setP2p] = React.useState<P2PState | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const activeRef = React.useRef<string | null>(null);
  const { focus, clearFocus } = useApp();
  // Pre-select the case handed off from Edge receiving (before the list loads).
  if (focus?.caseId && activeRef.current == null) activeRef.current = focus.caseId;
  React.useEffect(() => {
    if (focus?.caseId) clearFocus();
  }, [focus, clearFocus]);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      // Cases whose goods receipt is posted (approved at the dock) are AP's worklist.
      const received = (await edgeApi.listCases()).filter((c) => c.status === "approved");
      setCases(received);
      const want = activeRef.current && received.some((c) => c.id === activeRef.current) ? activeRef.current : received[0]?.id ?? null;
      activeRef.current = want;
      setP2p(want ? await edgeApi.getP2P(want) : null);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }, []);
  React.useEffect(() => {
    void load();
  }, [load]);

  const caseId = activeRef.current;
  const select = async (id: string) => {
    if (!id || id === activeRef.current) return;
    activeRef.current = id;
    setP2p(await edgeApi.getP2P(id));
  };

  const runMatch = async () => {
    if (!caseId) return;
    setBusy("match");
    try {
      await sleep();
      await edgeApi.runMatch(caseId);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };
  const pay = async () => {
    if (!caseId) return;
    setBusy("pay");
    try {
      await sleep();
      await edgeApi.pay(caseId, "AP controller");
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };
  const onUploadInvoice = async (files: FileList | null) => {
    if (!files || !files.length || !caseId) return;
    setBusy("invoice");
    try {
      await sleep();
      await edgeApi.uploadInvoice(caseId, files[0]);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };
  const useSampleInvoice = async () => {
    if (!caseId) return;
    setBusy("invoice");
    try {
      await sleep();
      const res = await fetch("/sample-invoice.png");
      const blob = await res.blob();
      await edgeApi.uploadInvoice(caseId, new File([blob], "basf_invoice_INV-BASF-77418.png", { type: "image/png" }));
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };
  const receiveEdiInvoice = async () => {
    if (!caseId) return;
    setBusy("invoice");
    try {
      await sleep();
      await edgeApi.simulateInvoice(caseId);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const inv = p2p?.invoice;
  const gr = p2p?.goodsReceipt;
  const po = p2p?.purchaseOrder;
  const contract = p2p?.contract;
  const isHero = po?.poNumber === HERO_PO;

  return (
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      {busy && <ThinkingOverlay />}
      <TopRow breadcrumb={{ label: "Agent workforce", chip: agent.menuLabel }} />

      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-white border border-divider px-5 py-3">
        <ReceiptText size={18} className="text-surface-deep" />
        <span className="text-[14px] font-bold text-ink">{agent.name} · live</span>
        {inv && <StatusPill label={inv.status} kind={inv.status === "held" ? "critical" : inv.status === "paid" || inv.status === "partial" ? "active" : "neutral"} pulse />}
        {cases.length > 0 && (
          <select
            value={caseId ?? ""}
            onChange={(e) => void select(e.target.value)}
            className="text-[12.5px] rounded-md border border-divider bg-surface-fog px-2 py-1 text-ink max-w-[420px]"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>PO {c.poNumber} · {c.title || c.id}</option>
            ))}
          </select>
        )}
        <button type="button" onClick={() => void load()} className="ui-pill ml-auto inline-flex items-center gap-1.5 rounded-md border border-divider bg-white px-3 py-1.5 text-[12px] text-ink hover:bg-surface-fog">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-mark-red/30 bg-surface-rose/30 px-5 py-4">
          <div className="flex items-center gap-2 text-[13px] font-bold text-mark-red"><CloudOff size={15} /> Edge-runtime not reachable</div>
          <p className="text-[12px] text-ink mt-1">{error}<br />Start it with <code className="bg-white px-1.5 py-0.5 rounded">PORT=8077 backend/scripts/run_edge_runtime.sh</code>, then <button className="underline font-medium" onClick={() => void load()}>retry</button>.</p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3 items-start">
        <div className="space-y-3 min-w-0">
          {!gr && !error && (
            <div className="rounded-md border border-divider bg-white px-5 py-4 text-[13px] text-mute">
              No goods receipts to resolve — approve a delivery on <span className="font-bold text-surface-deep">Edge receiving · live</span> first; AP's four-way match needs the posted goods receipt.
            </div>
          )}

          {/* Worklist — upload the supplier invoice doc when none on file (IDP) */}
          <Card label="Invoice worklist · blocks & matches" right={inv && <span className="text-[11px] text-mute">1 to resolve</span>}>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.heic" className="hidden" onChange={(e) => void onUploadInvoice(e.target.files)} />
            {inv ? (
              <div className="flex items-center gap-3 rounded-md bg-surface-fog px-3 py-3">
                <span className="w-9 h-9 rounded-md bg-white border border-divider text-surface-deep flex items-center justify-center shrink-0"><ReceiptText size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-ink">{inv.id} · {inv.supplier}</div>
                  <div className="text-[12px] text-mute">{money(inv.amount)} · {inv.billedQuantity} billed · PO {inv.poNumber}</div>
                </div>
                <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded", inv.status === "held" ? "bg-surface-rose text-mark-red" : "bg-surface-mint text-surface-deep")}>{inv.status}</span>
              </div>
            ) : !gr ? (
              <div className="text-[12px] text-mute">Select a case with a posted goods receipt to bring in its supplier invoice.</div>
            ) : isHero ? (
              <div className="flex items-center gap-2 flex-wrap">
                <PillButton variant="deep" size="sm" onClick={() => fileRef.current?.click()} disabled={busy === "invoice"}>
                  <span className="inline-flex items-center gap-1.5">{busy === "invoice" ? <Spinner size={14} /> : <ReceiptText size={14} />} Upload supplier invoice</span>
                </PillButton>
                <PillButton variant="secondary" size="sm" onClick={() => void useSampleInvoice()} disabled={busy === "invoice"}>
                  Use sample invoice
                </PillButton>
                <img
                  src="/sample-invoice.png"
                  alt="sample invoice"
                  title="Click to view the sample invoice"
                  onClick={() => setPreview("/sample-invoice.png")}
                  className="w-10 h-10 rounded object-cover border border-divider bg-white cursor-zoom-in hover:ring-2 hover:ring-surface-deep/40"
                />
                <span className="text-[12px] text-mute">IDP reads billed qty · unit price · amount from the scanned invoice</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <PillButton variant="deep" size="sm" onClick={() => void receiveEdiInvoice()} disabled={busy === "invoice"}>
                  <span className="inline-flex items-center gap-1.5">{busy === "invoice" ? <Spinner size={14} /> : <ReceiptText size={14} />} Supplier invoice arrived (EDI)</span>
                </PillButton>
                <span className="text-[12px] text-mute">structured EDI feed for PO {po?.poNumber} — billed qty · price · amount</span>
              </div>
            )}
          </Card>

          {/* Invoice — IDP fields from the scanned doc (hero) or the EDI feed */}
          {inv && (
            <Card label={isHero ? "Extracted invoice · IDP" : "Supplier invoice · EDI"} right={isHero ? <ModelBadge step="invoice_idp" /> : <span className="text-[11px] text-mute">structured feed</span>}>
              <div className="flex gap-4">
                {isHero && caseId && (
                  <button
                    type="button"
                    onClick={() => setPreview(`${edgeApi.base}/api/cases/${caseId}/invoice/image`)}
                    className="ui-pill shrink-0"
                    title="View the invoice document the IDP read"
                  >
                    <img
                      src={`${edgeApi.base}/api/cases/${caseId}/invoice/image`}
                      alt="invoice document"
                      className="w-20 h-24 rounded object-cover object-top border border-divider bg-white cursor-zoom-in hover:ring-2 hover:ring-surface-deep/40"
                    />
                  </button>
                )}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px] flex-1 self-center">
                  <div><span className="text-mute">Invoice · </span><span className="font-bold text-ink">{inv.id}</span></div>
                  <div><span className="text-mute">PO ref · </span>{inv.poNumber}</div>
                  <div><span className="text-mute">Billed qty · </span>{inv.billedQuantity}</div>
                  <div><span className="text-mute">Unit price · </span>{money(inv.unitPrice)}</div>
                  <div><span className="text-mute">Net amount · </span><span className="font-bold text-ink">{money(inv.amount)}</span></div>
                  <div><span className="text-mute">Supplier · </span>{inv.supplier}</div>
                </div>
              </div>
              {isHero && <p className="text-[11px] text-mute">↑ click the document to view what the IDP read these numbers from.</p>}
            </Card>
          )}

          {/* Step-by-step four-way match — each leg validated against its source of truth */}
          {inv && p2p && (
            gr && po && contract ? (
              <FourWayMatch p2p={p2p} busy={busy} onMatch={runMatch} onPay={pay} />
            ) : (
              <Card label="Four-way match" right={<ModelBadge step="match" />}>
                <div className="text-[12px] text-mute">Needs the posted goods receipt — approve the delivery on <span className="font-bold text-surface-deep">Edge receiving · live</span> first.</div>
              </Card>
            )
          )}
        </div>

        {/* Copilot — invoice persona, same agent loop */}
        <aside className="lg:sticky lg:top-4">
          <CopilotPanel
            caseId={caseId ?? ""}
            agent="invoice"
            chips={["Why is this invoice held?", "Is the supplier over-billing?", "What are the payment terms?", "Release the payment"]}
            onRelease={pay}
          />
        </aside>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setPreview(null)}>
          <img src={preview} alt="document" className="max-h-[90vh] max-w-[92vw] rounded-lg shadow-2xl bg-white" onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={() => setPreview(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 text-ink flex items-center justify-center hover:bg-white" aria-label="Close preview"><X size={18} /></button>
        </div>
      )}
    </div>
  );
}

