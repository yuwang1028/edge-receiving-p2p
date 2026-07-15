import * as React from "react";
import { Scale, Check, RefreshCw, CloudOff, Sparkles, Trophy, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/state";
import { agentsById } from "@/data/agents";
import { TopRow } from "@/components/blocks/TopRow";
import { PillButton } from "@/components/blocks/PillButton";
import { StatusPill } from "@/components/blocks/StatusPill";
import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";
import { Spinner } from "@/components/ai/Spinner";
import { ModelBadge } from "@/components/ModelBadge";
import { HandoffOverlay } from "@/components/HandoffOverlay";
import { ThinkingOverlay, sleep } from "@/lib/thinking";
import { useTypewriter } from "@/lib/useTypewriter";
import { edgeApi, type PROut, type SourcingOut } from "@/lib/edgeApi";

/* Deterministic "why this vendor" — built from the scored bids (no model). */
function buildRecommendation(s: SourcingOut | null): string {
  if (!s || !s.bids.length) return "";
  const bids = [...s.bids].sort((a, b) => b.score - a.score);
  const win = bids.find((b) => b.recommended) ?? bids[0];
  const runner = bids.find((b) => b.supplier !== win.supplier);
  const money = (n: number) => "$" + Math.round(n).toLocaleString();
  let t = `Recommend ${win.supplier}. It tops the weighted score (price 45% · lead 25% · risk 15% · contract 15%) at ${money(win.unitPrice)}/unit, ${win.leadDays}-day lead, ${win.risk} risk${win.contracted ? ", on contract" : ""} — score ${win.score}/100.`;
  if (runner) {
    const bits: string[] = [];
    if (runner.unitPrice > win.unitPrice) bits.push(`${money(runner.unitPrice - win.unitPrice)}/unit pricier`);
    if (runner.leadDays > win.leadDays) bits.push(`${runner.leadDays - win.leadDays}d slower`);
    if (!runner.contracted && win.contracted) bits.push("off-contract");
    t += ` Next best is ${runner.supplier} (${runner.score})${bits.length ? " — " + bits.join(", ") : ""}.`;
  }
  return t;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Sourcing / Spot-buy Agent console — REAL (backend-driven).
 *
 * Takes an approved requisition and runs a DETERMINISTIC 3-bid comparison over
 * the approved supplier pool (price · lead · risk · contract), recommends a
 * winner, and a human awards it — fixing the supplier + price the PO will use.
 * Rules, no model (shown by the badge). Between PR processing and PO management.
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

const money = (n: number) => "$" + Math.round(n).toLocaleString();

export function SourcingConsole() {
  const agent = agentsById.sourcing;
  const [prs, setPrs] = React.useState<PROut[]>([]);
  const [selected, setSelected] = React.useState<PROut | null>(null);
  const [sourcing, setSourcing] = React.useState<SourcingOut | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [handingOff, setHandingOff] = React.useState<string | null>(null);
  const { focus, clearFocus, handoff } = useApp();
  const reco = buildRecommendation(sourcing);
  const recoTyped = useTypewriter(reco);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const all = await edgeApi.listPrs();
      setPrs(all.filter((p) => p.status !== "draft"));
    } catch (e) {
      setError(String(e));
    }
  }, []);
  React.useEffect(() => void load(), [load]);

  const pick = async (pr: PROut) => {
    setSelected(pr);
    setSourcing(null);
    try {
      setSourcing(await edgeApi.getSourcing(pr.id));
    } catch {
      /* no sourcing run yet — fine */
    }
  };

  // Auto-select the PR handed off from PR processing.
  React.useEffect(() => {
    if (focus?.prId && !selected) {
      const pr = prs.find((p) => p.id === focus.prId);
      if (pr) { void pick(pr); clearFocus(); }
    }
  }, [focus, prs, selected, clearFocus]);

  const run = async () => {
    if (!selected) return;
    setBusy("source");
    try {
      await sleep();
      const { sourcing: s } = await edgeApi.sourcePr(selected.id);
      setSourcing(s);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const award = async (supplier: string) => {
    if (!selected) return;
    setBusy("award");
    try {
      await sleep();
      const { sourcing: s } = await edgeApi.awardSourcing(selected.id, supplier);
      setSourcing(s);
      await load();
      // Hand off to PO management with this awarded requisition pre-selected.
      setHandingOff("PO management");
      setTimeout(() => handoff({ kind: "agent", id: "po" }, { prId: selected.id }), 850);
    } catch (e) {
      setError(String(e));
      setBusy(null);
    }
  };

  return (
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      {busy && !handingOff && <ThinkingOverlay />}
      {handingOff && <HandoffOverlay to={handingOff} />}
      <TopRow breadcrumb={{ label: "Agent workforce", chip: agent.menuLabel }} />

      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-white border border-divider px-5 py-3">
        <Scale size={18} className="text-surface-deep" />
        <span className="text-[14px] font-bold text-ink">{agent.name} · live</span>
        <span className="text-[12px] text-mute">approved requisition → 3-bid comparison → award</span>
        <ModelBadge step="sourcing" />
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
        {/* Worklist — approved requisitions to source */}
        <Card label="To source" right={<span className="text-[11px] text-mute">{prs.length}</span>}>
          {prs.length === 0 ? (
            <div className="text-[12px] text-mute">No approved requisitions — approve one on <span className="font-bold text-surface-deep">PR processing</span> first.</div>
          ) : (
            <ul className="space-y-1.5">
              {prs.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => void pick(p)} className={cn("w-full text-left rounded-md px-3 py-2 border", selected?.id === p.id ? "border-surface-deep bg-surface-mint/50" : "border-divider hover:bg-surface-fog")}>
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-bold text-ink truncate">{p.material}</span>
                      <span className={cn("ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap", p.status === "awarded" || p.status === "ordered" ? "bg-surface-mint text-surface-deep" : p.status === "sourced" ? "border border-surface-deep/30 text-surface-deep" : "bg-surface-fog text-mute")}>
                        {p.status === "awarded" ? "Awarded" : p.status === "ordered" ? "Ordered" : p.status === "sourced" ? "Ready to award" : "To source"}
                      </span>
                    </div>
                    <div className="text-[11px] text-mute">{p.quantity} {p.unit} · {p.category}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Bid comparison */}
        <div className="space-y-3 min-w-0">
          {!selected ? (
            <Card label="Bid comparison"><div className="text-[12px] text-mute">Select a requisition on the left.</div></Card>
          ) : (
            <Card
              label={`Bid comparison · ${selected.material}`}
              right={sourcing ? <StatusPill label={sourcing.status} kind={sourcing.status === "awarded" ? "active" : "neutral"} pulse /> : undefined}
            >
              <div className="flex items-center gap-2 text-[12px] text-mute">
                <span>{selected.quantity} {selected.unit} · {selected.category}</span>
                <PillButton variant="deep" size="sm" onClick={() => void run()} disabled={busy === "source"}>
                  <span className="inline-flex items-center gap-1.5">{busy === "source" ? <Spinner size={14} /> : <Sparkles size={14} />} {sourcing ? "Re-run sourcing" : "Run sourcing"}</span>
                </PillButton>
              </div>

              {sourcing && (
                <SpringIn>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="text-[10.5px] uppercase text-mute border-b border-divider">
                          <th className="text-left font-medium py-1.5">Supplier</th>
                          <th className="text-right font-medium">Unit</th>
                          <th className="text-right font-medium">Amount</th>
                          <th className="text-right font-medium">Lead</th>
                          <th className="text-left font-medium pl-3">Risk</th>
                          <th className="text-center font-medium">Contract</th>
                          <th className="text-right font-medium">Score</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {sourcing.bids.map((b) => {
                          const awarded = sourcing.awardedSupplier === b.supplier;
                          return (
                            <tr key={b.supplier} className={cn("border-b border-divider/60", b.recommended && "bg-surface-mint/40")}>
                              <td className="py-2 font-bold text-ink">
                                <span className="inline-flex items-center gap-1.5">{b.recommended && <Trophy size={12} className="text-surface-deep" />}{b.supplier}</span>
                              </td>
                              <td className="text-right">{money(b.unitPrice)}</td>
                              <td className="text-right font-medium text-ink">{money(b.amount)}</td>
                              <td className="text-right">{b.leadDays}d</td>
                              <td className="pl-3"><span className={cn("text-[11px]", b.risk === "low" ? "text-surface-deep" : b.risk === "high" ? "text-mark-red" : "text-mute")}>{b.risk}</span></td>
                              <td className="text-center">{b.contracted ? <ShieldCheck size={13} className="inline text-surface-deep" /> : <span className="text-mute">—</span>}</td>
                              <td className="text-right font-bold text-ink">{b.score}</td>
                              <td className="text-right pl-2">
                                {awarded ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-surface-deep"><Check size={12} /> awarded</span>
                                ) : (
                                  <button type="button" onClick={() => void award(b.supplier)} disabled={busy === "award"} className="ui-pill text-[11px] rounded border border-divider px-2 py-0.5 text-surface-deep hover:bg-surface-mint/60 disabled:opacity-50">
                                    Award
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-md border border-surface-deep/20 bg-surface-mint/25 px-4 py-3 mt-1">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-surface-deep font-bold mb-1"><Sparkles size={13} /> AI recommendation</div>
                    <p className="text-[12.5px] text-ink leading-relaxed">
                      {recoTyped.shown}
                      {!recoTyped.done && <span className="inline-block w-0.5 h-3.5 bg-surface-deep/70 ml-0.5 align-middle animate-pulse" />}
                    </p>
                  </div>

                  {sourcing.status === "awarded" ? (
                    <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-surface-deep mt-1"><Check size={14} /> Awarded to {sourcing.awardedSupplier} @ {money(sourcing.awardedPrice)} · ready for PO</div>
                  ) : (
                    <PillButton variant="deep" size="sm" onClick={() => void award("")} disabled={busy === "award"}>
                      <span className="inline-flex items-center gap-1.5">{busy === "award" ? <Spinner size={14} /> : <Trophy size={14} />} Award to {sourcing.recommendedSupplier} (recommended)</span>
                    </PillButton>
                  )}
                </SpringIn>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
