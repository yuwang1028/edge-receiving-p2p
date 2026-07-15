import * as React from "react";
import { FileText, Check, Circle, RefreshCw, CloudOff, Sparkles, PackageCheck, Database, Mail, AlertTriangle, Truck, ArrowRight, X, Eye, MailCheck, FileType2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/state";
import { agentsById } from "@/data/agents";
import { TopRow } from "@/components/blocks/TopRow";
import { PillButton } from "@/components/blocks/PillButton";
import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";
import { Spinner } from "@/components/ai/Spinner";
import { ModelBadge } from "@/components/ModelBadge";
import { HandoffOverlay } from "@/components/HandoffOverlay";
import { ThinkingOverlay, sleep } from "@/lib/thinking";
import { EmailMessage } from "@/components/EmailMessage";
import { useTypewriter } from "@/lib/useTypewriter";
import { edgeApi, type PROut, type PORecord } from "@/lib/edgeApi";

/* Split the drafted PO email string ("To: …\nSubject: …\n\n<body>") into fields. */
function parsePoEmail(raw: string): { to: string; subject: string; body: string } {
  const to = raw.match(/^To:\s*(.*)$/m)?.[1]?.trim() ?? "";
  const subject = raw.match(/^Subject:\s*(.*)$/m)?.[1]?.trim() ?? "Purchase order";
  const body = raw.split(/\n\n/).slice(1).join("\n\n").trim();
  return { to, subject, body };
}

/* ──────────────────────────────────────────────────────────────────────────
 * PO Management Agent console — REAL (backend-driven).
 *
 * The last upstream node. The agent turns an AWARDED requisition into a real PO
 * (+ framework contract) in the 'ERP', drafts the supplier confirmation email,
 * captures the supplier's reply, and produces the EXPECTED-receiving controls the
 * edge device will verify. Deterministic (rules). Lifecycle:
 *   po_created → email_drafted → email_sent → supplier_confirmed
 * A document the supplier promises 'separately' becomes a pre-receiving risk.
 * ────────────────────────────────────────────────────────────────────────── */

const RANK: Record<string, number> = { po_created: 1, email_drafted: 2, email_sent: 3, supplier_confirmed: 4 };
const STATUS: Record<string, string> = {
  po_created: "awaiting email", email_drafted: "ready to send",
  email_sent: "awaiting supplier confirmation", supplier_confirmed: "confirmed · awaiting goods",
};

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
const slugOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const invNoOf = (po: PORecord) => `INV-${(po.supplier.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "SUP")}-${po.poNumber.slice(-4)}`;

/* Rendered supplier-invoice document — the previewable "PDF" attached to the
 * supplier's reply (built from PO data; no real file needed). */
function InvoiceDoc({ po }: { po: PORecord }) {
  const amount = po.unitPrice * po.expectedQuantity;
  return (
    <div className="bg-white w-[560px] max-w-[92vw] rounded-lg shadow-2xl overflow-hidden text-ink" onClick={(e) => e.stopPropagation()}>
      <div className="bg-surface-deep text-ink-inverse px-6 py-4 flex items-center justify-between">
        <div><div className="text-[18px] font-bold tracking-wide">{po.supplier}</div><div className="text-[11px] opacity-80">Accounts Receivable</div></div>
        <div className="text-[14px] font-bold">SUPPLIER INVOICE</div>
      </div>
      <div className="px-6 py-5 space-y-4 text-[12.5px]">
        <div className="grid grid-cols-3 gap-3">
          <div><div className="text-[10px] uppercase tracking-wider text-mute">Invoice no</div><div className="font-bold text-[15px]">{invNoOf(po)}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-mute">PO number</div><div className="font-bold text-[15px]">{po.poNumber}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-mute">Terms</div><div className="font-bold">Net 30</div></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><div className="text-[10px] uppercase tracking-wider text-mute">Supplier</div><div>{po.supplier}</div></div>
          <div><div className="text-[10px] uppercase tracking-wider text-mute">Bill to</div><div>{po.plant} plant · Accounts Payable</div></div>
        </div>
        <table className="w-full text-[12px] border-t border-divider pt-2">
          <thead><tr className="text-[10px] uppercase tracking-wider text-mute"><th className="text-left py-1.5">Material</th><th className="text-right">Qty</th><th className="text-right">Unit price</th><th className="text-right">Amount</th></tr></thead>
          <tbody>
            <tr className="border-t border-divider/60"><td className="py-2 font-medium">{po.material}</td><td className="text-right">{po.expectedQuantity} {po.unit}</td><td className="text-right">{money(po.unitPrice)}</td><td className="text-right font-bold">{money(amount)}</td></tr>
          </tbody>
        </table>
        <div className="ml-auto w-48 space-y-1">
          <div className="flex justify-between text-mute"><span>Subtotal</span><span>{money(amount)}</span></div>
          <div className="flex justify-between text-mute"><span>Tax (U1)</span><span>$0</span></div>
          <div className="flex justify-between font-bold text-[14px] border-t border-divider pt-1"><span>Total due</span><span>{money(amount)}</span></div>
        </div>
        <div className="text-[11px] text-mute border-t border-divider pt-2">Remit to {po.supplier} · IBAN DE00 0000 0000 0000 · ref {invNoOf(po)} · demo invoice</div>
      </div>
    </div>
  );
}

function Step({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-2 text-[12.5px]", done ? "text-ink" : "text-mute")}>
      {done ? <Check size={14} className="text-surface-deep shrink-0" /> : <Circle size={13} className="shrink-0" />}
      {children}
    </li>
  );
}

export function POConsole() {
  const agent = agentsById.po;
  const { go, handoff, focus, clearFocus } = useApp();
  const [prs, setPrs] = React.useState<PROut[]>([]);
  const [pos, setPos] = React.useState<PORecord[]>([]);
  const [selected, setSelected] = React.useState<PROut | null>(null);
  const [po, setPo] = React.useState<PORecord | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [mail, setMail] = React.useState<"draft" | "reply" | null>(null);
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [handingOff, setHandingOff] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const [allPrs, allPos] = await Promise.all([edgeApi.listPrs(), edgeApi.listPos()]);
      setPrs(allPrs.filter((p) => p.status === "awarded" || p.status === "ordered"));
      setPos(allPos);
    } catch (e) {
      setError(String(e));
    }
  }, []);
  React.useEffect(() => void load(), [load]);

  const pick = async (pr: PROut) => {
    setSelected(pr);
    setPo(null);
    try {
      setPo(await edgeApi.getPoForPr(pr.id));
    } catch {
      /* no PO yet */
    }
  };

  // Auto-select the awarded requisition handed off from Sourcing.
  React.useEffect(() => {
    if (focus?.prId && !selected) {
      const pr = prs.find((p) => p.id === focus.prId);
      if (pr) { void pick(pr); clearFocus(); }
    }
  }, [focus, prs, selected, clearFocus]);

  const act = async (key: string, fn: () => Promise<PORecord>) => {
    setBusy(key);
    try {
      await sleep();
      setPo(await fn());
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };
  const create = () => selected && act("po", () => edgeApi.createPo(selected.id).then((r) => r.po));

  // Email flow runs in a centered modal: draft → send → supplier reply (invoice).
  const openDraft = async () => {
    if (!po) return;
    setBusy("draft");
    await sleep();
    try {
      const cur = po.poState === "po_created" ? await edgeApi.draftPoEmail(po.poNumber) : po;
      setPo(cur);
      await load();
      setMail("draft");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };
  const sendReply = async () => {
    if (!po) return;
    setBusy("send");
    try {
      await sleep();
      await edgeApi.sendPo(po.poNumber);
      const updated = await edgeApi.confirmPo(po.poNumber);
      setPo(updated);
      await load();
      setMail("reply");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };
  const continueMatch = async () => {
    if (!po) return;
    setBusy("continue");
    try {
      await sleep();
      // Open the delivery for receiving; the invoice is processed by AP (Invoice
      // resolution) AFTER the goods receipt, so it bills the delivered quantity.
      const c = await edgeApi.createCase(po.poNumber);
      setMail(null);
      setHandingOff("Edge receiving");
      setTimeout(() => handoff({ kind: "edge-live" }, { caseId: c.id }), 850);
    } catch (e) {
      setError(String(e));
      setBusy(null);
    }
  };

  const openReceiving = async () => {
    if (!po) return;
    setBusy("receiving");
    try {
      await sleep();
      await edgeApi.createCase(po.poNumber);
      go({ kind: "edge-live" });
    } catch (e) {
      setError(String(e));
      setBusy(null);
    }
  };

  const r = po ? RANK[po.poState] ?? 1 : 0;
  const poFor = (prId: string) => pos.find((p) => p.prId === prId);
  const prLabel = (pr: PROut) => {
    const p = poFor(pr.id);
    if (!p) return { text: "To order", cls: "bg-surface-fog text-mute" };
    if (p.poState === "supplier_confirmed") return { text: "Confirmed", cls: "bg-surface-mint text-surface-deep" };
    if (p.poState === "email_sent") return { text: "Sent", cls: "border border-surface-deep/30 text-surface-deep" };
    return { text: "Ready to send", cls: "border border-surface-deep/30 text-surface-deep" };
  };
  const conf = po?.confirmation;
  const draft = parsePoEmail(po?.supplierEmail || "");
  const draftTyped = useTypewriter(mail === "draft" ? draft.body : "");

  return (
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      {busy && !handingOff && busy !== "continue" && (
        <ThinkingOverlay label={busy === "send" ? "Waiting for supplier reply" : undefined} />
      )}
      {handingOff && <HandoffOverlay to={handingOff} />}
      <TopRow breadcrumb={{ label: "Agent workforce", chip: agent.menuLabel }} />

      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-white border border-divider px-5 py-3">
        <FileText size={18} className="text-surface-deep" />
        <span className="text-[14px] font-bold text-ink">{agent.name} · live</span>
        <span className="text-[12px] text-mute">awarded requisition → purchase order → supplier confirmation → receiving</span>
        <ModelBadge step="po" />
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

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-3 items-start">
        {/* Worklist */}
        <Card label="Purchase pipeline" right={<span className="text-[11px] text-mute">{prs.length}</span>}>
          {prs.length === 0 ? (
            <div className="text-[12px] text-mute">No awarded requisitions — award one on <span className="font-bold text-surface-deep">Sourcing</span> first.</div>
          ) : (
            <ul className="space-y-1.5">
              {prs.map((p) => {
                const lab = prLabel(p);
                return (
                  <li key={p.id}>
                    <button type="button" onClick={() => void pick(p)} className={cn("w-full text-left rounded-md px-3 py-2 border", selected?.id === p.id ? "border-surface-deep bg-surface-mint/50" : "border-divider hover:bg-surface-fog")}>
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-bold text-ink truncate">{p.material}</span>
                        <span className={cn("ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap", lab.cls)}>{lab.text}</span>
                      </div>
                      <div className="text-[11px] text-mute">{p.quantity} {p.unit} · {p.category}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-3 min-w-0">
          {!selected ? (
            <Card label="Purchase order"><div className="text-[12px] text-mute">Select an awarded requisition on the left.</div></Card>
          ) : !po ? (
            <Card label={`Purchase order · ${selected.material}`}>
              <div className="flex items-center gap-2">
                <PillButton variant="deep" size="sm" onClick={() => void create()} disabled={busy === "po"}>
                  <span className="inline-flex items-center gap-1.5">{busy === "po" ? <Spinner size={14} /> : <Sparkles size={14} />} Create PO</span>
                </PillButton>
                <span className="text-[11px] text-mute">PO number · required docs · contract terms = rules</span>
              </div>
            </Card>
          ) : (
            <>
              {/* 1 · PO card */}
              <SpringIn>
                <Card label="Purchase order" right={<span className="text-[11px] font-bold text-surface-deep">{STATUS[po.poState]}</span>}>
                  <div className="flex items-start gap-3 rounded-md bg-surface-fog px-3 py-3">
                    <span className="w-9 h-9 rounded-md bg-white border border-divider text-surface-deep flex items-center justify-center shrink-0"><PackageCheck size={17} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-ink">PO {po.poNumber} · {po.supplier}</div>
                      <div className="text-[12px] text-mute">{po.expectedQuantity} {po.unit} · {po.material} · {po.plant}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[15px] font-bold text-ink">{money(po.unitPrice * po.expectedQuantity)}</div>
                      <div className="text-[11px] text-mute">@ {money(po.unitPrice)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px]">
                    <div><span className="text-mute">Terms · </span>Net 30</div>
                    <div><span className="text-mute">Created by · </span><span className="font-bold text-surface-deep">{po.source === "po-agent" ? "PO management agent" : "ERP"}</span></div>
                    <div><span className="text-mute">Receiving tolerance · </span>±2% (quantity)</div>
                    <div><span className="text-mute">Origin · </span>awarded requisition</div>
                    <div className="col-span-2"><span className="text-mute">Required at receiving · </span>{po.requiredDocuments.join(" · ")}</div>
                  </div>
                  <p className="text-[11px] text-surface-deep bg-surface-mint/40 rounded px-2 py-1.5">This PO defines the expected receiving controls the edge device will verify.</p>
                </Card>
              </SpringIn>

              {/* 2 · Agent actions */}
              <Card label="Agent actions">
                <ul className="space-y-1.5">
                  <Step done={r >= 1}>Created PO {po.poNumber} in ERP</Step>
                  <Step done={r >= 1}>Attached receiving requirements</Step>
                  <Step done={r >= 2}>Drafted supplier confirmation email</Step>
                  <Step done={r >= 3}>Sent to supplier</Step>
                  <Step done={r >= 4}>Supplier confirmed</Step>
                </ul>
                <PillButton variant="deep" size="sm" onClick={() => (po.poState === "supplier_confirmed" ? setMail("reply") : void openDraft())} disabled={busy === "draft"}>
                  <span className="inline-flex items-center gap-1.5">
                    {busy === "draft" ? <Spinner size={14} /> : <Mail size={14} />}
                    {po.poState === "po_created" ? "Draft supplier email" : po.poState === "supplier_confirmed" ? "View invoice email" : "Open supplier email"}
                  </span>
                </PillButton>
              </Card>

              {/* 3 · Supplier email draft */}
              {r >= 2 && (
                <SpringIn>
                  <Card label="Supplier email draft" right={r >= 3 ? <span className="inline-flex items-center gap-1 text-[11px] text-surface-deep font-bold"><Check size={12} /> sent</span> : <button type="button" onClick={() => setMail("draft")} className="text-[11px] text-surface-deep underline">open</button>}>
                    <pre className="whitespace-pre-wrap break-words text-[12px] text-ink bg-surface-fog rounded-md p-3 border border-divider">{po.supplierEmail}</pre>
                  </Card>
                </SpringIn>
              )}

              {/* 4 · Supplier response */}
              {r >= 3 && (
                <SpringIn>
                  <Card label="Supplier response">
                    {po.poState === "email_sent" ? (
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-mute"><span className="w-1.5 h-1.5 rounded-full bg-surface-deep animate-pulse" /> Waiting for supplier confirmation</span>
                    ) : conf ? (
                      <div className="space-y-2">
                        <div className="text-[12.5px] text-ink font-bold">{po.supplier} confirmed PO {po.poNumber}</div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px]">
                          <div><span className="text-mute">Quantity · </span>{conf.confirmedQuantity} {po.unit}</div>
                          <div><span className="text-mute">Delivery · </span>{conf.deliveryDays} days</div>
                        </div>
                        <ul className="space-y-1">
                          {conf.documentsConfirmed.map((d) => (
                            <li key={d} className="flex items-center gap-2 text-[12.5px] text-ink"><Check size={13} className="text-surface-deep" /> {d}</li>
                          ))}
                          {conf.documentsPending.map((d) => (
                            <li key={d} className="flex items-center gap-2 text-[12.5px] text-mute"><Circle size={12} /> {d} <span className="text-[11px]">— follows separately</span></li>
                          ))}
                        </ul>
                        {conf.risk && (
                          <div className="flex items-start gap-2 rounded-md border border-mark-red/30 bg-surface-rose/30 px-3 py-2 text-[12px] text-mark-red">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <div><span className="font-bold">Pre-receiving risk · </span>{conf.risk}</div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </Card>
                </SpringIn>
              )}

              {/* 5 · Receiving controls */}
              {r >= 4 && (
                <SpringIn>
                  <Card label="Receiving controls generated" right={<span className="inline-flex items-center gap-1.5 text-[11px] text-mute"><Truck size={12} /> expected truth</span>}>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px]">
                      <div><span className="text-mute">PO · </span>{po.poNumber}</div>
                      <div><span className="text-mute">Supplier · </span>{po.supplier}</div>
                      <div><span className="text-mute">Material · </span>{po.material}</div>
                      <div><span className="text-mute">Quantity · </span>{po.expectedQuantity} {po.unit} (±2%)</div>
                      <div className="col-span-2"><span className="text-mute">Required documents · </span>{po.requiredDocuments.join(" · ")}</div>
                      {conf && <div className="col-span-2"><span className="text-mute">Expected delivery · </span>{conf.deliveryDays} days</div>}
                    </div>
                    <p className="text-[11px] text-mute">The edge device verifies the delivery against these controls — quantity beyond tolerance or a missing document raises a receiving exception.</p>
                    <PillButton variant="deep" size="sm" onClick={() => void openReceiving()} disabled={busy === "receiving"}>
                      <span className="inline-flex items-center gap-1.5">{busy === "receiving" ? <Spinner size={14} /> : <ArrowRight size={14} />} Open edge receiving workspace</span>
                    </PillButton>
                  </Card>
                </SpringIn>
              )}

              {/* ERP register */}
              <Card label="Purchase orders · ERP" right={<span className="inline-flex items-center gap-1.5 text-[11px] text-mute"><Database size={12} /> {pos.length}</span>}>
                <ul className="divide-y divide-divider/60">
                  {pos.map((p) => (
                    <li key={p.poNumber} className="flex items-center gap-3 py-2">
                      <span className="text-[12.5px] font-bold text-ink w-24">{p.poNumber}</span>
                      <span className="text-[12px] text-ink flex-1 truncate">{p.supplier} · {p.expectedQuantity} {p.unit} {p.material}</span>
                      <span className="text-[12px] text-mute">{money(p.unitPrice * p.expectedQuantity)}</span>
                      <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded", p.source === "po-agent" ? "bg-surface-mint text-surface-deep" : "bg-surface-fog text-mute")}>{p.source === "po-agent" ? "agent" : "erp"}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Supplier email — centered modal: draft → send → reply (invoice) */}
      {mail && po && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setMail(null)}>
          <div className="w-[640px] max-w-[94vw] max-h-[88vh] overflow-auto rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {mail === "draft" ? (
              <>
                <div className="flex items-center gap-2 px-6 pt-5 pb-3">
                  <Mail size={18} className="text-surface-deep" />
                  <span className="text-[11px] uppercase tracking-wider text-surface-deep font-bold">Supplier email · agent draft</span>
                  {!draftTyped.done && <span className="text-[11px] text-mute inline-flex items-center gap-1"><Spinner size={11} /> drafting…</span>}
                  <button type="button" onClick={() => setMail(null)} className="ml-auto text-mute hover:text-ink"><X size={18} /></button>
                </div>
                <div className="px-6">
                  <EmailMessage
                    variant="draft"
                    subject={draft.subject}
                    fromName="Procurement Operations"
                    fromAddress="procurement@northgate.example"
                    to={draft.to}
                    body={draftTyped.shown}
                    caret={!draftTyped.done}
                  />
                </div>
                <div className="px-6 py-4">
                  <PillButton variant="deep" onClick={() => void sendReply()} disabled={busy === "send" || !draftTyped.done}>
                    <span className="inline-flex items-center gap-1.5">{busy === "send" ? <Spinner size={15} /> : <ArrowRight size={15} />} Send PO and request confirmation</span>
                  </PillButton>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 px-6 pt-5 pb-3">
                  <span className="w-9 h-9 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center shrink-0"><MailCheck size={18} /></span>
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-surface-deep font-bold">Email received</div>
                    <div className="text-[15px] font-bold text-ink">{po.supplier} · AR sent the invoice</div>
                  </div>
                  <button type="button" onClick={() => setMail(null)} className="ml-auto text-mute hover:text-ink"><X size={18} /></button>
                </div>
                <div className="px-6 space-y-3">
                  <div className="rounded-lg bg-surface-fog/70 border border-divider p-4 text-[12.5px] space-y-2">
                    <div className="grid grid-cols-[64px_1fr] gap-y-1.5">
                      <span className="text-mute">From</span><span><span className="font-bold text-ink">{po.supplier} · AR</span> <span className="text-mute">ar@{slugOf(po.supplier)}.com</span></span>
                      <span className="text-mute">Subject</span><span className="font-bold text-ink">Invoice {invNoOf(po)} · PO {po.poNumber} · {po.material}</span>
                      <span className="text-mute">Received</span><span className="text-mute">Outlook · just now</span>
                    </div>
                    <div className="border-t border-divider pt-2 space-y-2 text-ink leading-relaxed">
                      <p>Please find attached our invoice {invNoOf(po)} for the {po.material.toLowerCase()} shipped against your PO {po.poNumber}.</p>
                      <p>{po.expectedQuantity} {po.unit} · {money(po.unitPrice * po.expectedQuantity)} net · Net 30 · tax code U1.</p>
                      <p>Thank you for your business — remit per the terms on the invoice.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setPdfOpen(true)} className="w-full flex items-center gap-3 rounded-lg border border-divider p-3 hover:bg-surface-fog text-left">
                    <span className="w-9 h-9 rounded-md bg-surface-rose/50 text-mark-red flex items-center justify-center shrink-0"><FileType2 size={18} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-bold text-ink">{invNoOf(po)}_{slugOf(po.supplier)}-invoice.pdf</div>
                      <div className="text-[11px] text-mute">PDF · click to preview the invoice</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[12px] text-surface-deep font-bold"><Eye size={14} /> Preview</span>
                  </button>
                </div>
                <div className="px-6 py-4">
                  {busy === "continue" ? (
                    <div className="flex flex-col items-center justify-center gap-2.5 py-5">
                      <Spinner size={28} />
                      <span className="text-[13.5px] font-bold text-ink">Uploading invoice to system…</span>
                      <span className="text-[11.5px] text-mute">Filing {invNoOf(po)} against PO {po.poNumber}</span>
                    </div>
                  ) : (
                    <>
                      <PillButton variant="deep" onClick={() => void continueMatch()}>
                        <span className="inline-flex items-center gap-1.5"><Check size={15} /> Confirm &amp; upload invoice</span>
                      </PillButton>
                      <p className="text-[11px] text-mute mt-2">Goods are received at the dock first; AP runs the four-way match in Invoice resolution.</p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Invoice PDF preview */}
      {pdfOpen && po && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6" onClick={() => setPdfOpen(false)}>
          <div className="relative">
            <InvoiceDoc po={po} />
            <button type="button" onClick={() => setPdfOpen(false)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center shadow-lg"><X size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
