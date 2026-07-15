import * as React from "react";
import { ClipboardList, Check, RefreshCw, CloudOff, Sparkles, FileText, ShieldCheck, AlertTriangle, ArrowLeft, ArrowRight, MessageSquare, Inbox, Trash2 } from "lucide-react";
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
import { EmailMessage, initialsOf } from "@/components/EmailMessage";
import { HandoffOverlay } from "@/components/HandoffOverlay";
import { ThinkingOverlay, sleep } from "@/lib/thinking";
import { useTypewriter } from "@/lib/useTypewriter";
import { edgeApi, type PROut, type PRCreateResult } from "@/lib/edgeApi";

/* ──────────────────────────────────────────────────────────────────────────
 * PR Processing Agent console — REAL, multi-step.
 *
 * A free-text need (email/note) is read by the PR agent loop and structured into
 * a coded requisition over THREE validated steps: extract the item → code it +
 * assign cost-center / G-L from ERP master data (shown as spreadsheets with the
 * matched rows highlighted) → review the complete PR. The agent only reads the
 * need and matches master data; it picks no supplier (that's sourcing).
 * ────────────────────────────────────────────────────────────────────────── */

const SAMPLES = [
  "Need 40 cartons of resin additive for Heidelberg, stock is below safety level",
  "Replace the worn No.2 double-backer corrugator belt before it fails",
  "Order 12 SKF roller bearings for the winder maintenance kit",
];
const CHIPS = ["Read", "Reason", "Draft", "Verify"];
const STEPS = [
  { title: "Item — what's needed", sub: "Extracting the item from the free-text note" },
  { title: "Coding & accounts", sub: "Matching cost center & G/L from master data" },
  { title: "Complete requisition", sub: "Review and approve" },
];

const money = (n: number) => "$" + Math.round(n).toLocaleString();

type IntakeMail = { from: string; address: string; subject: string; body: string };

/* The email channel ships a real inbound email the agent reads (free text, no
 * part number). The chat channel does NOT — it's a portal message. */
const SAMPLE_EMAIL: IntakeMail = {
  from: "Production planner · Heidelberg",
  address: "planner@heidelberg-plant.com",
  subject: "Resin additive top-up — Heidelberg",
  body:
    "We're running low on resin additive at Heidelberg — stock is below the safety level for the coating line.\n\n" +
    "Please raise a requisition for 40 cartons. Usual grade, sourced through the catalog, but I don't have the material number to hand.\n\n" +
    "Fairly urgent to avoid a line stop — happy to confirm any details.",
};

/* Chat / portal intake — when the request did NOT come from email. */
function ChatNote({ text, requester, sentAt }: { text: string; requester: string; sentAt: string }) {
  return (
    <div className="rounded-md border border-divider overflow-hidden bg-white">
      <div className="flex items-center gap-2 bg-surface-fog px-3 py-2 border-b border-divider text-[12px] text-ink">
        <MessageSquare size={14} className="text-surface-deep" /> Intake chat
      </div>
      <div className="p-3">
        <div className="flex items-start gap-2">
          <span className="w-7 h-7 rounded-full bg-surface-deep text-ink-inverse text-[10px] font-bold flex items-center justify-center shrink-0">{initialsOf(requester)}</span>
          <div className="rounded-2xl rounded-tl-sm bg-surface-mint/50 px-3 py-2 text-[12.5px] text-ink">{text}</div>
        </div>
        <div className="text-[10.5px] text-mute mt-1 ml-9">{requester}{sentAt && ` · ${sentAt}`}</div>
      </div>
    </div>
  );
}

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

function Field({ label, value, delay }: { label: string; value: React.ReactNode; delay?: number }) {
  const fill = delay !== undefined;
  return (
    <div className={cn(fill && "ai-stream")} style={fill ? { animationDelay: `${delay}ms` } : undefined}>
      <div className="text-[10px] uppercase tracking-[0.05em] text-mute mb-0.5">{label}</div>
      <div className="rounded-md border border-divider bg-surface-fog px-3 py-2 text-[13px] text-ink">{value}</div>
    </div>
  );
}

/* xlsx-style master-data sheet with the matched row highlighted */
function Sheet({ file, note, headers, rows, matchRow }: { file: string; note?: string; headers: string[]; rows: string[][]; matchRow: number }) {
  const cols = ["A", "B", "C", "D", "E"].slice(0, headers.length);
  return (
    <div className="rounded-md border border-divider overflow-hidden text-[11.5px]">
      <div className="flex items-center gap-2 bg-surface-mint/40 px-3 py-1.5 border-b border-divider">
        <span className="text-[9px] font-bold bg-surface-deep text-ink-inverse rounded px-1 py-0.5">X</span>
        <span className="font-bold text-ink">{file}</span>
        {note && <span className="ml-auto text-[10.5px] text-mute">{note}</span>}
      </div>
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-surface-fog text-[9px] text-mute">
            <th className="w-5 border border-divider/60 font-normal" />
            {cols.map((c) => <th key={c} className="border border-divider/60 font-normal py-0.5">{c}</th>)}
            <th className="w-16 border border-divider/60 font-normal" />
          </tr>
          <tr className="bg-surface-fog/60 text-[10.5px] text-ink">
            <td className="border border-divider/60 text-center text-mute">1</td>
            {headers.map((h) => <td key={h} className="border border-divider/60 px-2 py-1 font-bold">{h}</td>)}
            <td className="border border-divider/60" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={cn(i === matchRow && "bg-surface-mint/60")}>
              <td className="border border-divider/60 text-center text-mute text-[10px]">{i + 2}</td>
              {r.map((c, j) => (
                <td key={j} className={cn("border border-divider/60 px-2 py-1 text-ink whitespace-nowrap", i === matchRow && "font-bold")}>{c}</td>
              ))}
              <td className="border border-divider/60 text-center">
                {i === matchRow && (
                  <span className="text-[9px] font-bold text-ink-inverse bg-surface-deep rounded-full px-1.5 py-0.5 whitespace-nowrap">✓ used</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IntakeConsole() {
  const agent = agentsById.intake;
  const { handoff } = useApp();
  const [handingOff, setHandingOff] = React.useState<string | null>(null);
  const [need, setNeed] = React.useState("");
  const [phase, setPhase] = React.useState<"intake" | "processing" | "review">("intake");
  const [channel, setChannel] = React.useState<"chat" | "email">("chat");
  const [summary, setSummary] = React.useState("");
  const [sentAt, setSentAt] = React.useState("");
  const [chip, setChip] = React.useState(0);
  const [step, setStep] = React.useState(0);
  const [result, setResult] = React.useState<PRCreateResult | null>(null);
  const [prs, setPrs] = React.useState<PROut[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setPrs(await edgeApi.listPrs());
    } catch (e) {
      setError(String(e));
    }
  }, []);
  React.useEffect(() => void load(), [load]);

  // Agent-loop chip animation while processing.
  React.useEffect(() => {
    if (phase !== "processing") return;
    setChip(0);
    const t = setInterval(() => setChip((c) => Math.min(c + 1, CHIPS.length - 1)), 480);
    return () => clearInterval(t);
  }, [phase]);

  const process = async (request: string, ch: "chat" | "email") => {
    if (!request.trim()) return;
    setChannel(ch);
    setSummary(
      ch === "email"
        ? `An email just came in from ${SAMPLE_EMAIL.from} — ${request.split("\n")[0]} It's free text with no part number, so let me read it and structure it into a coded requisition.`
        : `A request came in through the intake chat — "${request.trim()}". No part number, so let me read it and code it into a structured requisition.`,
    );
    const now = new Date();
    setSentAt(`${now.toISOString().slice(0, 10)} · ${now.toTimeString().slice(0, 5)}`);
    setPhase("processing");
    try {
      const [res] = await Promise.all([
        edgeApi.createPr(request.trim(), ch === "email" ? SAMPLE_EMAIL.from : "Plant requester"),
        sleep(),
      ]);
      setResult(res);
      setStep(0);
      setPhase("review");
      await load();
    } catch (e) {
      setError(String(e));
      setPhase("intake");
    }
  };

  const proceed = async () => {
    setBusy("step");
    await sleep();
    setStep((s) => s + 1);
    setBusy(null);
  };

  const approve = async () => {
    if (!result) return;
    setBusy("approve");
    try {
      await sleep();
      const { pr } = await edgeApi.approvePr(result.pr.id);
      setResult((r) => (r ? { ...r, pr } : r));
      await load();
      // Hand off to Sourcing with this PR pre-selected (brief "handed off" beat).
      setHandingOff("Sourcing");
      setTimeout(() => handoff({ kind: "agent", id: "sourcing" }, { prId: pr.id }), 850);
    } catch (e) {
      setError(String(e));
      setBusy(null);
    }
  };

  const removePr = async (id: string) => {
    setBusy(`del:${id}`);
    try {
      await edgeApi.deletePr(id);
      setPrs((rows) => rows.filter((p) => p.id !== id));
      if (result?.pr.id === id) reset();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    setResult(null);
    setNeed("");
    setChannel("chat");
    setPhase("intake");
  };

  const pr = result?.pr;
  const md = result?.masterData;
  const mc = result?.matchedCodes;
  const typed = useTypewriter(summary);

  const header = (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-white border border-divider px-5 py-3">
      <ClipboardList size={18} className="text-surface-deep" />
      <span className="text-[14px] font-bold text-ink">{agent.name} · live</span>
      <ModelBadge step="pr_processing" />
      {phase !== "intake" && (
        <button type="button" onClick={reset} className="ui-pill inline-flex items-center gap-1.5 rounded-md border border-divider bg-white px-3 py-1.5 text-[12px] text-ink hover:bg-surface-fog">
          New requisition
        </button>
      )}
      <button type="button" onClick={() => void load()} className="ui-pill ml-auto inline-flex items-center gap-1.5 rounded-md border border-divider bg-white px-3 py-1.5 text-[12px] text-ink hover:bg-surface-fog">
        <RefreshCw size={13} /> Refresh
      </button>
    </div>
  );

  const errorBlock = error && (
    <div className="mt-3 rounded-md border border-mark-red/30 bg-surface-rose/30 px-5 py-4">
      <div className="flex items-center gap-2 text-[13px] font-bold text-mark-red"><CloudOff size={15} /> Edge-runtime not reachable</div>
      <p className="text-[12px] text-ink mt-1">{error}<br />Start it with <code className="bg-white px-1.5 py-0.5 rounded">PORT=8077 backend/scripts/run_edge_runtime.sh</code>, then <button className="underline font-medium" onClick={() => void load()}>retry</button>.</p>
    </div>
  );

  return (
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      {busy && !handingOff && <ThinkingOverlay />}
      {handingOff && <HandoffOverlay to={handingOff} />}
      <TopRow breadcrumb={{ label: "Agent workforce", chip: agent.menuLabel }} />
      {header}
      {errorBlock}

      {/* Streamed AI summary — typewriter */}
      {phase !== "intake" && summary && (
        <div className="mt-3 rounded-md bg-surface-mint/30 border border-surface-deep/15 px-5 py-3 flex items-start gap-2 text-[13px] text-ink leading-relaxed">
          <Sparkles size={16} className="text-surface-deep mt-0.5 shrink-0" />
          <span>{typed.shown}{!typed.done && <span className="inline-block w-[2px] h-[14px] bg-surface-deep/70 ml-0.5 align-middle animate-pulse" />}</span>
        </div>
      )}

      {/* INTAKE */}
      {phase === "intake" && (
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3 items-start">
          <Card
            label="New requisition · intake"
            right={
              <div className="inline-flex rounded-md border border-divider overflow-hidden text-[11px] font-bold">
                <button type="button" onClick={() => setChannel("chat")} className={cn("px-3 py-1 inline-flex items-center gap-1.5", channel === "chat" ? "bg-surface-deep text-ink-inverse" : "bg-white text-mute hover:bg-surface-fog")}>
                  <MessageSquare size={12} /> Chat
                </button>
                <button type="button" onClick={() => setChannel("email")} className={cn("px-3 py-1 border-l border-divider inline-flex items-center gap-1.5", channel === "email" ? "bg-surface-deep text-ink-inverse" : "bg-white text-mute hover:bg-surface-fog")}>
                  <Inbox size={12} /> Email
                </button>
              </div>
            }
          >
            {channel === "chat" ? (
              <>
                <textarea
                  value={need}
                  onChange={(e) => setNeed(e.target.value)}
                  rows={3}
                  placeholder="e.g. Need 40 cartons of resin additive for Heidelberg, stock below safety level"
                  className="w-full resize-none rounded-md border border-divider bg-surface-fog px-3 py-2 text-[13px] text-ink outline-none focus:ring-2 focus:ring-surface-deep/30"
                />
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLES.map((s) => (
                    <button key={s} type="button" onClick={() => setNeed(s)} className="text-[11px] text-surface-deep bg-surface-mint/60 hover:bg-surface-mint rounded-full px-2.5 py-1">
                      {s.length > 46 ? s.slice(0, 46) + "…" : s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <PillButton variant="deep" size="sm" onClick={() => void process(need, "chat")} disabled={!need.trim()}>
                    <span className="inline-flex items-center gap-1.5"><Sparkles size={14} /> Run PR processing</span>
                  </PillButton>
                  <span className="text-[11px] text-mute">a request typed into the intake chat — the agent codes it (no supplier; that's sourcing)</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px] text-mute">1 unread in the procurement intake mailbox — the agent reads the free-text email and codes it.</div>
                <EmailMessage subject={SAMPLE_EMAIL.subject} fromName={SAMPLE_EMAIL.from} fromAddress={SAMPLE_EMAIL.address} body={SAMPLE_EMAIL.body} />
                <div className="flex items-center gap-2">
                  <PillButton variant="deep" size="sm" onClick={() => void process(SAMPLE_EMAIL.body, "email")}>
                    <span className="inline-flex items-center gap-1.5"><Sparkles size={14} /> Process this email</span>
                  </PillButton>
                  <span className="text-[11px] text-mute">free text · no part number</span>
                </div>
              </>
            )}
          </Card>

          <aside className="lg:sticky lg:top-4">
            <Card label="Requisitions" right={<span className="text-[11px] text-mute">{prs.length}</span>}>
              {prs.length === 0 ? (
                <div className="text-[12px] text-mute">No requisitions yet — describe a need.</div>
              ) : (
                <ul className="space-y-1.5">
                  {prs.map((p) => (
                    <li key={p.id} className="group rounded-md px-3 py-2 bg-surface-fog/60">
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-bold text-ink truncate">{p.material}</span>
                        <span className={cn("ml-auto text-[10px] uppercase font-bold px-1.5 py-0.5 rounded", p.status === "draft" ? "bg-surface-fog text-mute" : "bg-surface-mint text-surface-deep")}>{p.status}</span>
                        <button
                          type="button"
                          onClick={() => void removePr(p.id)}
                          disabled={busy === `del:${p.id}`}
                          title="Delete requisition"
                          aria-label="Delete requisition"
                          className="shrink-0 text-mute/60 hover:text-mark-red opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-40"
                        >
                          {busy === `del:${p.id}` ? <Spinner size={13} /> : <Trash2 size={14} />}
                        </button>
                      </div>
                      <div className="text-[11px] text-mute">{p.quantity} {p.unit} · {money(p.estValue)} · {p.category}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </aside>
        </div>
      )}

      {/* PROCESSING — agent loop */}
      {phase === "processing" && (
        <div className="mt-3">
          <Card label="PR processing agent" right={<span className="text-[11px] text-mute inline-flex items-center gap-1.5"><Spinner size={12} /> working</span>}>
            <div className="h-1.5 rounded-full bg-surface-fog overflow-hidden">
              <div className="h-full bg-surface-deep transition-all duration-500" style={{ width: `${((chip + 1) / CHIPS.length) * 100}%` }} />
            </div>
            <div className="flex gap-1.5">
              {CHIPS.map((c, i) => (
                <span key={c} className={cn("text-[11px] font-bold rounded-full px-2.5 py-1 inline-flex items-center gap-1", i <= chip ? "bg-surface-mint text-surface-deep" : "bg-surface-fog text-mute")}>
                  {i < chip && <Check size={11} />}{c}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* REVIEW — wizard */}
      {phase === "review" && pr && (
        <SpringIn>
          <div className="mt-3 flex items-center gap-2 text-[13px] font-bold text-ink">
            <AIDot size={6} tone="deep" pulse />
            <span>{STEPS[step].sub}</span>
            <span className="ml-auto text-[11px] font-medium text-mute">{step + 1} / {STEPS.length}</span>
          </div>

          {step < 2 ? (
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,600px)] gap-3 items-start">
              {/* LEFT — work card */}
              <Card label={STEPS[step].title} right={<span className="text-[10.5px] text-mute">auto-filled · editable</span>}>
                {step === 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Material" value={`${pr.material} · ${pr.materialCode}`} delay={0} />
                    <Field label="Category" value={pr.category} delay={90} />
                    <Field label="Quantity" value={`${pr.quantity} ${pr.unit}`} delay={180} />
                    <Field label="UOM" value={pr.unit} delay={270} />
                    <Field label="Est. unit price" value={money(pr.estUnitPrice)} delay={360} />
                    <Field label="Est. value" value={money(pr.estValue)} delay={450} />
                    <div className="col-span-2"><Field label="Requisitioner" value={`${pr.requester} · ${pr.plant}`} delay={540} /></div>
                    <div className="col-span-2"><Field label="Justification" value={pr.justification} delay={630} /></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="PR type" value={pr.prType} />
                      <Field label="Requestor" value={pr.requester} />
                      <Field label="Purchasing org" value={pr.purchOrg} />
                      <Field label="Purchasing group" value={pr.purchGroup} />
                      <Field label="Cost center" value={pr.costCenter} />
                      <Field label="G/L account" value={pr.glAccount} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1", (result?.confidence ?? 0) >= 0.8 ? "bg-surface-mint text-surface-deep" : "bg-surface-rose/40 text-mark-red")}>
                        Confidence {Math.round((result?.confidence ?? 0) * 100)}%
                      </span>
                      {(result?.flags ?? []).map((f) => (
                        <span key={f} className="text-[11px] text-mark-red bg-surface-rose/30 rounded px-2 py-0.5 inline-flex items-center gap-1"><AlertTriangle size={11} /> {f}</span>
                      ))}
                      {(result?.flags ?? []).length === 0 && (
                        <span className="text-[11px] text-surface-deep inline-flex items-center gap-1"><ShieldCheck size={12} /> matched exactly against master data</span>
                      )}
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {step > 0 && (
                    <button type="button" onClick={() => setStep((s) => s - 1)} className="ui-pill inline-flex items-center gap-1 rounded-md border border-divider px-3 py-1.5 text-[12px] text-ink hover:bg-surface-fog">
                      <ArrowLeft size={13} /> Back
                    </button>
                  )}
                  <PillButton variant="deep" size="sm" onClick={() => void proceed()} disabled={!!busy}>
                    <span className="inline-flex items-center gap-1.5">Validate &amp; proceed <ArrowRight size={14} /></span>
                  </PillButton>
                </div>
              </Card>

              {/* RIGHT — source */}
              {step === 0 ? (
                <Card label={channel === "email" ? "Free-text PR · intake portal" : "Intake chat · portal"} right={<span className="text-[11px] text-mute">{sentAt}</span>}>
                  {channel === "email" ? (
                    <EmailMessage subject={SAMPLE_EMAIL.subject} fromName={SAMPLE_EMAIL.from} fromAddress={SAMPLE_EMAIL.address} body={SAMPLE_EMAIL.body} sentAt={sentAt} />
                  ) : (
                    <ChatNote text={pr.rawRequest} requester={pr.requester} sentAt={sentAt} />
                  )}
                  <p className="text-[11px] text-mute">Free text · no part number — the agent codes it against master data.</p>
                </Card>
              ) : (
                <Card label="Master data · matched">
                  <div className="space-y-2.5">
                    {md && mc && (
                      <>
                        <Sheet
                          file="materials.xlsx" note="material master"
                          headers={["Material", "Description", "Category", "Unit", ""]}
                          rows={md.materials.map((m) => [m.material_code, m.name, m.category, m.unit, money(m.indicative_price)])}
                          matchRow={md.materials.findIndex((m) => m.material_code === mc.materialCode)}
                        />
                        <Sheet
                          file="cost-centers.xlsx" note="plant + category"
                          headers={["Cost center", "Description", "Plant", ""]}
                          rows={md.costCenters.map((c) => [c.cost_center, c.description, c.plant, c.category])}
                          matchRow={md.costCenters.findIndex((c) => c.cost_center === mc.costCenter)}
                        />
                        <Sheet
                          file="gl-accounts.xlsx" note="by category"
                          headers={["G/L", "Description", "Type", ""]}
                          rows={md.glAccounts.map((g) => [g.gl, g.description, g.type, g.category || "—"])}
                          matchRow={md.glAccounts.findIndex((g) => g.gl === mc.gl)}
                        />
                      </>
                    )}
                    <p className="text-[11px] text-mute">Confidence {Math.round((result?.confidence ?? 0) * 100)}% — material, cost center and G/L matched against master data{(result?.flags ?? []).length ? `; the agent flags: ${result?.flags.join("; ")}` : "."}</p>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            /* STEP 3 — complete PR */
            <div className="mt-3">
              <Card label="Purchase requisition" right={<StatusPill label={pr.status} kind={pr.status === "draft" ? "neutral" : "active"} pulse />}>
                <div className="rounded-md border border-divider overflow-hidden">
                  <div className="flex items-center gap-2 bg-surface-fog px-4 py-2.5 border-b border-divider">
                    <FileText size={16} className="text-surface-deep" />
                    <span className="text-[13px] font-bold text-ink">Purchase Requisition</span>
                    <span className="text-[12px] text-mute">{pr.id}</span>
                    <span className="ml-auto text-[11px] text-mute">SAP MM · ME51N</span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-[12.5px]">
                      <div><div className="text-[10px] uppercase tracking-[0.05em] text-mute">Requester</div><div className="font-medium text-ink">{pr.requester}</div></div>
                      <div><div className="text-[10px] uppercase tracking-[0.05em] text-mute">Plant</div><div className="font-medium text-ink">{pr.plant}</div></div>
                      <div><div className="text-[10px] uppercase tracking-[0.05em] text-mute">PR type</div><div className="font-medium text-ink">{pr.prType}</div></div>
                      <div><div className="text-[10px] uppercase tracking-[0.05em] text-mute">Budget</div><div className={cn("font-medium inline-flex items-center gap-1", pr.budgetOk ? "text-surface-deep" : "text-mark-red")}>{pr.budgetOk ? <ShieldCheck size={13} /> : <AlertTriangle size={13} />}{pr.budgetOk ? "Within budget" : "Over budget"}</div></div>
                      <div><div className="text-[10px] uppercase tracking-[0.05em] text-mute">Purchasing org</div><div className="font-medium text-ink">{pr.purchOrg}</div></div>
                      <div><div className="text-[10px] uppercase tracking-[0.05em] text-mute">Purchasing group</div><div className="font-medium text-ink">{pr.purchGroup}</div></div>
                      <div><div className="text-[10px] uppercase tracking-[0.05em] text-mute">Cost center</div><div className="font-medium text-ink">{pr.costCenter}</div></div>
                      <div><div className="text-[10px] uppercase tracking-[0.05em] text-mute">G/L account</div><div className="font-medium text-ink">{pr.glAccount}</div></div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12.5px]">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-[0.04em] text-mute border-b border-divider">
                            <th className="text-left font-medium py-1.5 pr-2">Item</th>
                            <th className="text-left font-medium px-2">Material</th>
                            <th className="text-left font-medium px-2">Description</th>
                            <th className="text-right font-medium px-2">Qty</th>
                            <th className="text-left font-medium px-2">Unit</th>
                            <th className="text-right font-medium px-2">Est. price</th>
                            <th className="text-right font-medium pl-2">Est. value</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-divider/60">
                            <td className="py-2 pr-2 text-mute">10</td>
                            <td className="px-2 font-bold text-ink">{pr.materialCode}</td>
                            <td className="px-2 text-ink">{pr.material}</td>
                            <td className="px-2 text-right font-medium text-ink">{pr.quantity}</td>
                            <td className="px-2">{pr.unit}</td>
                            <td className="px-2 text-right">{money(pr.estUnitPrice)}</td>
                            <td className="pl-2 text-right font-bold text-ink">{money(pr.estValue)}</td>
                          </tr>
                          <tr>
                            <td colSpan={6} className="pt-2 text-right text-[11px] uppercase tracking-[0.04em] text-mute">Estimated total</td>
                            <td className="pt-2 text-right text-[14px] font-bold text-ink">{money(pr.estValue)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div><div className="text-[10px] uppercase tracking-[0.05em] text-mute">Justification</div><div className="text-[12.5px] text-ink">{pr.justification}</div></div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setStep(1)} className="ui-pill inline-flex items-center gap-1 rounded-md border border-divider px-3 py-1.5 text-[12px] text-ink hover:bg-surface-fog">
                    <ArrowLeft size={13} /> Back
                  </button>
                  {pr.status === "draft" ? (
                    <PillButton variant="deep" size="sm" onClick={() => void approve()} disabled={busy === "approve"}>
                      <span className="inline-flex items-center gap-1.5">{busy === "approve" ? <Spinner size={14} /> : <Check size={14} />} Approve → ready to source</span>
                    </PillButton>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-surface-deep"><Check size={14} /> Approved · handed to Sourcing</div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </SpringIn>
      )}
    </div>
  );
}
