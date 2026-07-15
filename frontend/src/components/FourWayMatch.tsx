import * as React from "react";
import { Check, X, ArrowRight, ArrowLeft, Mail, Package, ClipboardCheck, ScrollText, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { PillButton } from "@/components/blocks/PillButton";
import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";
import { Spinner } from "@/components/ai/Spinner";
import { ThinkingOverlay, sleep } from "@/lib/thinking";
import type { P2PState } from "@/lib/edgeApi";

/* Step-by-step four-way match: each leg (invoice → PO → goods receipt → contract)
 * is validated against its SOURCE OF TRUTH (the SAP-style document on the right),
 * and the comparison table fills in a column at a time, ending in the verdict +
 * payment. Mirrors how AP actually reconciles — not a one-shot button. */

const money = (n: number) => "$" + Math.round(n).toLocaleString();
const money2 = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const LEGS = [
  { key: "invoice", title: "Reading the supplier invoice", icon: Mail },
  { key: "po", title: "Matching against the purchase order", icon: Package },
  { key: "gr", title: "Matching against the goods receipt", icon: ClipboardCheck },
  { key: "contract", title: "Confirming the contract price · four-way verdict", icon: ScrollText },
];

/* Mock supplier house-bank details for the AP payment run (per vendor). */
const BANK: Record<string, { bank: string; iban: string }> = {
  BASF: { bank: "Deutsche Bank", iban: "DE89 3704 0044 0532 0130 00" },
  "Mitsui Chemicals": { bank: "MUFG Bank", iban: "JP12 0005 0000 0012 3456 78" },
  Habasit: { bank: "UBS Switzerland", iban: "CH93 0076 2011 6238 5295 7" },
  Covestro: { bank: "Commerzbank", iban: "DE21 3004 0000 0532 0130 11" },
  Forbo: { bank: "Credit Suisse", iban: "CH56 0483 5012 3456 7800 9" },
};
const bankFor = (s: string) => BANK[s] ?? { bank: "HSBC", iban: "GB29 NWBK 6016 1331 9268 19" };

function Card({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="bg-white border border-divider rounded-md p-5 space-y-3">
      <header className="flex items-center gap-2">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] tracking-wider uppercase text-surface-deep font-medium">{label}</span>
        {right && <span className="ml-auto">{right}</span>}
      </header>
      {children}
    </article>
  );
}

/* ── SAP-style source-of-truth documents (chrome derived from real data) ── */
function SapDoc({ app, code, title, status, children }: { app: string; code: string; title: string; status: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-divider overflow-hidden">
      <div className="bg-surface-deep text-ink-inverse px-4 py-2.5 flex items-start gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-bold flex items-center gap-2">{code} <span className="text-[9px] uppercase bg-white/20 rounded px-1.5 py-0.5">{status}</span></div>
          <div className="text-[11px] opacity-80">{title}</div>
        </div>
        <span className="ml-auto text-[10px] opacity-70 text-right shrink-0">SAP MM · {app}</span>
      </div>
      <div className="p-4 space-y-3 text-[12px]">{children}</div>
    </div>
  );
}
function F({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9.5px] uppercase tracking-wider text-mute">{label}</div>
      <div className="rounded border border-divider bg-surface-fog px-2 py-1.5 text-ink">{value}</div>
    </div>
  );
}

export function FourWayMatch({ p2p, busy, onMatch, onPay }: {
  p2p: P2PState; busy: string | null;
  onMatch: () => Promise<void>; onPay: () => Promise<void>;
}) {
  const inv = p2p.invoice!;
  const po = p2p.purchaseOrder!;
  const gr = p2p.goodsReceipt!;
  const c = p2p.contract!;
  const m = p2p.match;
  const pmt = p2p.payment;
  const [step, setStep] = React.useState(0);
  const [thinking, setThinking] = React.useState(false);
  const [pf, setPf] = React.useState(() => {
    const b = bankFor(po.supplier);
    return {
      vendor: po.supplier,
      bank: b.bank,
      iban: b.iban,
      method: "SEPA credit transfer",
      incoterms: "FCA · supplier DC",
      terms: c.paymentTerms,
      dueDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
      remittance: inv.id,
      costCenter: "10021 · Production",
      gl: "600450 · Repairs & Maintenance",
    };
  });
  const setF = (k: keyof typeof pf, v: string) => setPf((p) => ({ ...p, [k]: v }));

  const accepted = gr?.accepted ?? 0;
  const billed = inv.billedQuantity;
  const tol = c.priceTolerancePct;
  const netInv = inv.amount;
  const netGr = +(accepted * inv.unitPrice).toFixed(2);

  const cols = ["INVOICE", "PO", "GR", "CONTRACT"]; // revealed up to step
  const shown = cols.slice(0, step + 1);
  const showMatch = step >= 1; // ✓/✗ per row from the moment a 2nd source is added
  const verdict = step >= 3; // full four-way verdict + payable/blocked

  // A row's mark reflects agreement across the sources revealed SO FAR:
  //  step1 invoice vs PO · step2 + goods receipt (accepted) · step3 + contract.
  const priceOkNow = Math.abs(inv.unitPrice - (step >= 3 ? c.unitPrice : po.unitPrice)) <= (step >= 3 ? c.unitPrice : po.unitPrice) * tol / 100;
  const qtyOkNow = billed <= (step >= 2 ? accepted : po.ordered);
  const rows: { label: string; cells: Record<string, string>; ok: boolean }[] = [
    { label: "Unit price (USD)", cells: { INVOICE: money2(inv.unitPrice), PO: money2(po.unitPrice), GR: "—", CONTRACT: money2(c.unitPrice) }, ok: priceOkNow },
    { label: `Quantity (${po.unit})`, cells: { INVOICE: String(billed), PO: String(po.ordered), GR: String(accepted), CONTRACT: "—" }, ok: qtyOkNow },
    { label: "Net value (USD)", cells: { INVOICE: money2(netInv), PO: money2(po.ordered * po.unitPrice), GR: money2(netGr), CONTRACT: "—" }, ok: qtyOkNow },
    { label: "Tax code", cells: { INVOICE: "U1", PO: "U1", GR: "—", CONTRACT: "U1" }, ok: true },
    { label: "Payment terms", cells: { INVOICE: c.paymentTerms, PO: "—", GR: "—", CONTRACT: c.paymentTerms }, ok: true },
  ];

  const advance = async () => {
    if (step === 2 && !m) {
      await onMatch(); // compute the verdict as we add the contract (parent shows its own thinking beat)
    } else {
      setThinking(true);
      await sleep();
      setThinking(false);
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  // Right-hand source of truth for the current leg.
  const source = (() => {
    if (step === 0)
      return (
        <SapDoc app="invoice" code={inv.id} title="Supplier invoice" status={inv.status}>
          <div className="grid grid-cols-2 gap-3">
            <F label="Supplier" value={inv.supplier} />
            <F label="PO reference" value={inv.poNumber} />
            <F label="Billed qty" value={`${billed} ${po.unit}`} />
            <F label="Unit price" value={money2(inv.unitPrice)} />
            <F label="Net value" value={money2(inv.amount)} />
            <F label="Terms" value={c.paymentTerms} />
          </div>
          <p className="text-[11px] text-mute">The supplier billed for what they shipped — reconciled below against PO, goods receipt and contract.</p>
        </SapDoc>
      );
    if (step === 1)
      return (
        <SapDoc app="ME23N" code={po.poNumber} title="Purchase order" status="open">
          <div className="grid grid-cols-2 gap-3">
            <F label="Vendor" value={po.supplier} />
            <F label="Material" value={po.material} />
            <F label="Order qty" value={`${po.ordered} ${po.unit}`} />
            <F label="Net price" value={`${money2(po.unitPrice)} / ${po.unit}`} />
            <F label="Terms" value={c.paymentTerms} />
          </div>
        </SapDoc>
      );
    if (step === 2)
      return (
        <SapDoc app="MIGO" code={`GR ${po.poNumber}`} title="Goods receipt · material document" status="posted">
          <div className="grid grid-cols-2 gap-3">
            <F label="Movement type" value="101 · GR goods receipt for PO" />
            <F label="PO reference" value={`${po.poNumber} · item 10`} />
            <F label="Ordered" value={`${gr.ordered} ${po.unit}`} />
            <F label="Received" value={`${gr.received} ${po.unit}`} />
            <F label="Accepted (unrestricted)" value={`${gr.accepted} ${po.unit}`} />
            <F label="Damaged / over" value={`${gr.damaged} damaged · ${gr.over} over`} />
          </div>
          {gr.documentsMissing.length > 0 && (
            <div className="text-[11px] text-mark-red">Documents missing: {gr.documentsMissing.join(", ")}</div>
          )}
          <p className="text-[11px] text-mute">Only {gr.accepted} {po.unit} were accepted into unrestricted stock — the basis for what can be paid.</p>
        </SapDoc>
      );
    return (
      <SapDoc app="ME33K" code="4600001207" title="Outline agreement · framework" status="active">
        <div className="grid grid-cols-2 gap-3">
          <F label="Vendor" value={po.supplier} />
          <F label="Agreement type" value="MK · Quantity contract" />
          <F label="Net contract price" value={`${money2(c.unitPrice)} / ${po.unit}`} />
          <F label="Price tolerance" value={`±${c.priceTolerancePct}%`} />
          <F label="Payment terms" value={c.paymentTerms} />
          <F label="Required docs" value={c.requiredDocuments.join(" · ")} />
        </div>
        <p className="text-[11px] text-mute">Contract price confirms the invoice unit price is on-agreement; the four-way verdict is below.</p>
      </SapDoc>
    );
  })();

  if (step >= 4) {
    return (
      <Card label="5 · Payment run" right={<span className="inline-flex items-center gap-1.5 text-[11px] text-mute"><Banknote size={12} /> AP · SAP F110</span>}>
        {!pmt ? (
          <SpringIn>
            <div className="space-y-3">
              <p className="text-[12px] text-mute">Auto-filled from the PO, contract and vendor master — review / edit, then release. Only the accepted goods are paid; the rest is blocked.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <PayField label="Vendor" value={pf.vendor} onChange={(v) => setF("vendor", v)} />
                <PayField label="House bank" value={pf.bank} onChange={(v) => setF("bank", v)} />
                <PayField label="IBAN" value={pf.iban} onChange={(v) => setF("iban", v)} />
                <PayField label="Payment method" value={pf.method} onChange={(v) => setF("method", v)} />
                <PayField label="Incoterms" value={pf.incoterms} onChange={(v) => setF("incoterms", v)} />
                <PayField label="Payment terms" value={pf.terms} onChange={(v) => setF("terms", v)} />
                <PayField label="Due date" type="date" value={pf.dueDate} onChange={(v) => setF("dueDate", v)} />
                <PayField label="Remittance ref" value={pf.remittance} onChange={(v) => setF("remittance", v)} />
                <PayField label="Cost center" value={pf.costCenter} onChange={(v) => setF("costCenter", v)} />
                <PayField label="G/L account" value={pf.gl} onChange={(v) => setF("gl", v)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Release to vendor" value={money(m?.payableAmount ?? 0)} />
                <Metric label="Block (prevent overpay)" value={money(m?.blockedAmount ?? 0)} tone={(m?.blockedAmount ?? 0) ? "warn" : "ok"} />
              </div>
              <PillButton variant="deep" size="sm" onClick={() => void onPay()} disabled={busy === "pay"}>
                <span className="inline-flex items-center gap-1.5">{busy === "pay" ? <Spinner size={14} /> : <Banknote size={14} />} Confirm payment · release {money(m?.payableAmount ?? 0)}</span>
              </PillButton>
            </div>
          </SpringIn>
        ) : (
          <SpringIn>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[12.5px] font-bold text-surface-deep"><Check size={15} strokeWidth={2.6} /> Payment {pmt.status} by {pmt.decidedBy}</div>
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Released to AP" value={money(pmt.releasedAmount)} />
                <Metric label="Blocked (prevented overpay)" value={money(pmt.blockedAmount)} tone={pmt.blockedAmount ? "warn" : "ok"} />
              </div>
            </div>
          </SpringIn>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {thinking && <ThinkingOverlay />}
      {/* checklist narrator */}
      <div className="space-y-1.5">
        {LEGS.map((leg, i) => (
          <div key={leg.key} className={cn("flex items-center gap-2 text-[12.5px]", i <= step ? "text-ink" : "text-mute")}>
            {i < step ? <Check size={14} className="text-surface-deep shrink-0" /> : i === step ? <Spinner size={13} /> : <span className="w-3.5 h-3.5 rounded-full border border-divider shrink-0" />}
            {leg.title}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,460px)] gap-3 items-start">
        {/* comparison table */}
        <Card label={verdict ? "Four-way match · verdict" : `Four-way match · adding the ${LEGS[step].key}`} right={<span className="text-[10.5px] text-mute">{step + 1} / 4</span>}>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-mute border-b border-divider">
                  <th className="text-left font-medium py-1.5 pr-2"> </th>
                  {shown.map((cl) => <th key={cl} className="text-right font-medium px-2">{cl}</th>)}
                  {showMatch && <th className="text-center font-medium pl-2">MATCH</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-divider/50">
                    <td className="py-2 pr-2 text-mute">{r.label}</td>
                    {shown.map((cl) => <td key={cl} className="px-2 text-right tabular-nums text-ink">{r.cells[cl]}</td>)}
                    {showMatch && (
                      <td className="pl-2 text-center">
                        <span className={cn("inline-flex w-4 h-4 rounded items-center justify-center", r.ok ? "bg-surface-mint text-surface-deep" : "bg-surface-rose text-mark-red")}>
                          {r.ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {verdict && m && (
            <div className={cn("rounded-md px-3 py-2 text-[12px] flex items-center gap-2", m.status === "hold" ? "bg-surface-rose/30 text-mark-red" : "bg-surface-mint/50 text-surface-deep")}>
              <span className={cn("w-1.5 h-1.5 rounded-full", m.status === "hold" ? "bg-mark-red" : "bg-surface-deep")} />
              {m.status === "hold"
                ? `${billed <= accepted ? "" : `Over-billed ${billed - accepted} ${po.unit} · ${money(m.blockedAmount)} blocked · `}${gr.documentsMissing.length ? `missing ${gr.documentsMissing.join(", ")}` : ""} — invoice held`
                : `All four agree · variance ${money2(0)} · clean`}
            </div>
          )}
          {verdict && m && (
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Payable (accepted goods)" value={money(m.payableAmount)} />
              <Metric label="Blocked" value={money(m.blockedAmount)} tone={m.blockedAmount ? "warn" : "ok"} />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="ui-pill inline-flex items-center gap-1 rounded-md border border-divider px-3 py-1.5 text-[12px] text-ink hover:bg-surface-fog">
                <ArrowLeft size={13} /> Back
              </button>
            )}
            <PillButton variant="deep" size="sm" onClick={() => void advance()} disabled={thinking || (step === 2 && busy === "match") || (step === 2 && !gr)}>
              <span className="inline-flex items-center gap-1.5">
                {thinking || (step === 2 && busy === "match") ? <Spinner size={14} /> : null}
                {step < 3 ? "Validate & proceed" : "Proceed to payment"} <ArrowRight size={14} />
              </span>
            </PillButton>
            {step === 2 && !gr && <span className="text-[11px] text-mute">needs the posted goods receipt</span>}
          </div>
        </Card>

        {/* source of truth */}
        <Card label="Source of truth">{source}</Card>
      </div>
    </div>
  );
}

function PayField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-[9.5px] uppercase tracking-wider text-mute">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded border border-divider bg-white px-2 py-1.5 text-[12.5px] text-ink outline-none focus:ring-2 focus:ring-surface-deep/30"
      />
    </label>
  );
}

function Metric({ label, value, tone = "ok" }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className={cn("rounded-md px-3 py-2.5 border", tone === "warn" ? "bg-surface-rose/30 border-mark-red/20" : "bg-surface-fog border-divider")}>
      <div className={cn("text-[18px] font-bold tabular-nums leading-none", tone === "warn" ? "text-mark-red" : "text-surface-deep")}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-mute mt-1">{label}</div>
    </div>
  );
}
