import * as React from "react";
import { Cloud, CloudOff, RefreshCw, Cpu, ShieldAlert, X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TopRow } from "@/components/blocks/TopRow";
import { AIDot } from "@/components/ai/AIDot";
import { Spinner } from "@/components/ai/Spinner";
import {
  cloudApi,
  type CloudCase,
  type CloudDevice,
  type CloudDecision,
} from "@/lib/cloudApi";

/* ──────────────────────────────────────────────────────────────────────────
 * Control tower — the CLOUD view. Reads the GCP control plane (Firestore via
 * the control-plane API): cross-site rollup of synced receiving decisions,
 * device fleet, and per-decision audit detail. This is the governance picture:
 * raw images stayed on the edge; only these structured events reached the cloud.
 * ────────────────────────────────────────────────────────────────────────── */

function isException(c: CloudCase): boolean {
  const r = c.risk_result || {};
  return (
    (c.status && c.status !== "accept" && c.status !== "approved-clean") ||
    !!r.invoice_hold ||
    !!r.quality_hold ||
    !!(r.quantity_variance && r.quantity_variance !== 0) ||
    !!(r.damaged_cartons && r.damaged_cartons > 0)
  ) as boolean;
}

function KPI({ label, value, tone = "deep" }: { label: string; value: string; tone?: "deep" | "warn" }) {
  return (
    <div className="bg-white border border-divider rounded-md px-4 py-3">
      <div className={cn("text-[22px] font-bold tabular-nums leading-none", tone === "warn" ? "text-mark-red" : "text-surface-deep")}>{value}</div>
      <div className="text-[10.5px] uppercase tracking-[0.06em] text-mute mt-1.5">{label}</div>
    </div>
  );
}

function money(n: number): string {
  return "$" + Math.round(n).toLocaleString();
}

export function CloudControlTower() {
  const [cases, setCases] = React.useState<CloudCase[]>([]);
  const [devices, setDevices] = React.useState<CloudDevice[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [detail, setDetail] = React.useState<CloudDecision | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, d] = await Promise.all([cloudApi.listCases(), cloudApi.listDevices()]);
      setCases(c);
      setDevices(d);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openDecision = async (c: CloudCase) => {
    if (!c.latest_decision_id) return;
    try {
      setDetail(await cloudApi.getDecision(c.latest_decision_id));
    } catch (e) {
      setError(String(e));
    }
  };

  const sites = new Set(cases.map((c) => c.site_id).filter(Boolean));
  const exceptions = cases.filter(isException);
  const exposure = cases.reduce((s, c) => s + (c.risk_result?.payment_exposure || 0), 0);

  return (
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <TopRow breadcrumb={{ label: "Control tower", chip: "Cloud" }} />

      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-white border border-divider px-5 py-3">
        <Cloud size={18} className="text-surface-deep" />
        <span className="text-[14px] font-bold text-ink">GCP control plane · cross-site rollup</span>
        <span className="text-[11px] text-mute">{cloudApi.base}</span>
        <button
          type="button"
          onClick={() => void load()}
          className="ui-pill ml-auto inline-flex items-center gap-1.5 rounded-md border border-divider bg-white px-3 py-1.5 text-[12px] text-ink hover:bg-surface-fog"
        >
          {loading ? <Spinner size={13} /> : <RefreshCw size={13} />} Refresh
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-mark-red/30 bg-surface-rose/30 px-5 py-4">
          <div className="flex items-center gap-2 text-[13px] font-bold text-mark-red">
            <CloudOff size={15} /> Control plane not reachable
          </div>
          <p className="text-[12px] text-ink mt-1 leading-snug">
            {error}
            <br />
            Start it with <code className="bg-white px-1.5 py-0.5 rounded">backend/scripts/run_control_plane.sh</code>{" "}
            (or set <code className="bg-white px-1.5 py-0.5 rounded">VITE_CONTROL_PLANE</code> to your Cloud Run URL).
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KPI label="Sites" value={String(sites.size)} />
        <KPI label="Devices" value={String(devices.length)} />
        <KPI label="Synced cases" value={String(cases.length)} />
        <KPI label="Exceptions" value={String(exceptions.length)} tone={exceptions.length ? "warn" : "deep"} />
        <KPI label="Payment exposure" value={money(exposure)} tone={exposure ? "warn" : "deep"} />
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 items-start">
        {/* Cases */}
        <article className="bg-white border border-divider rounded-md overflow-hidden">
          <header className="px-4 py-3 border-b border-divider flex items-center gap-2">
            <AIDot size={6} tone="deep" pulse />
            <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">Synced receiving decisions</span>
            <span className="ml-auto text-[11px] text-mute">click a row for the audit event</span>
          </header>
          {cases.length === 0 && !error ? (
            <div className="px-4 py-10 text-center text-[13px] text-mute">
              No synced cases yet — approve a case on the edge (it auto-syncs when online).
            </div>
          ) : (
            <table className="w-full text-[12.5px]">
              <thead className="bg-surface-fog text-[10.5px] uppercase tracking-[0.04em] text-mute">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Site</th>
                  <th className="px-3 py-2 text-left font-medium">PO</th>
                  <th className="px-3 py-2 text-left font-medium">Supplier</th>
                  <th className="px-3 py-2 text-right font-medium">Variance</th>
                  <th className="px-3 py-2 text-right font-medium">Damaged</th>
                  <th className="px-3 py-2 text-right font-medium">Exposure</th>
                  <th className="px-3 py-2 text-left font-medium">Holds</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => {
                  const r = c.risk_result || {};
                  const exc = isException(c);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => void openDecision(c)}
                      className="border-t border-divider cursor-pointer hover:bg-surface-mint/30"
                    >
                      <td className="px-3 py-2">{c.site_id || "—"}</td>
                      <td className="px-3 py-2 font-bold text-ink">{c.po_number || "—"}</td>
                      <td className="px-3 py-2">{c.supplier || "—"}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", r.quantity_variance ? "text-mark-red font-bold" : "text-mute")}>
                        {r.quantity_variance ? `${r.quantity_variance > 0 ? "+" : ""}${r.quantity_variance}` : "0"}
                      </td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", r.damaged_cartons ? "text-mark-red" : "text-mute")}>{r.damaged_cartons || 0}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", r.payment_exposure ? "text-mark-red" : "text-mute")}>{r.payment_exposure ? money(r.payment_exposure) : "—"}</td>
                      <td className="px-3 py-2">
                        <span className="flex gap-1">
                          {r.quality_hold && <span className="text-[9px] uppercase font-bold bg-surface-rose text-mark-red px-1.5 py-0.5 rounded">QC</span>}
                          {r.invoice_hold && <span className="text-[9px] uppercase font-bold bg-surface-rose text-mark-red px-1.5 py-0.5 rounded">INV</span>}
                          {!r.quality_hold && !r.invoice_hold && <span className="text-mute">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn("text-[9.5px] uppercase font-bold px-1.5 py-0.5 rounded", exc ? "bg-surface-rose text-mark-red" : "bg-surface-mint text-surface-deep")}>
                          {c.status || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </article>

        {/* Devices */}
        <article className="bg-white border border-divider rounded-md overflow-hidden">
          <header className="px-4 py-3 border-b border-divider flex items-center gap-2">
            <AIDot size={6} tone="deep" pulse />
            <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">Edge fleet</span>
          </header>
          {devices.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-mute">No devices yet</div>
          ) : (
            <div>
              {devices.map((d) => (
                <div key={d.id} className="flex items-center gap-2.5 px-4 py-3 border-b border-divider last:border-b-0">
                  <span className="w-8 h-8 rounded-md bg-surface-fog text-surface-deep flex items-center justify-center shrink-0">
                    <Cpu size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-bold text-ink truncate">{d.device_id || d.id}</div>
                    <div className="text-[11px] text-mute flex items-center gap-1"><Building2 size={11} /> {d.site_id || "—"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-bold text-surface-deep tabular-nums">{d.events_total ?? 0}</div>
                    <div className="text-[10px] text-mute">events</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      {/* Decision detail */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setDetail(null)}>
          <div className="ai-spring w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <header className="px-5 py-4 border-b border-divider flex items-center gap-2 sticky top-0 bg-white">
              <ShieldAlert size={16} className="text-mark-red" />
              <h2 className="text-[15px] font-bold text-ink">Audit event · {detail.decision_id}</h2>
              <button type="button" onClick={() => setDetail(null)} className="ui-pill ml-auto w-8 h-8 rounded-full text-mute hover:text-ink flex items-center justify-center" aria-label="Close">
                <X size={16} />
              </button>
            </header>
            <div className="px-5 py-4 space-y-3 text-[12.5px]">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div><span className="text-mute">Site · </span>{detail.site_id}</div>
                <div><span className="text-mute">Device · </span>{detail.edge_device_id}</div>
                <div><span className="text-mute">Case · </span>{detail.case_id}</div>
                <div><span className="text-mute">Local processing · </span>{String(detail.local_processing)}</div>
              </div>
              <Section title="Extracted fields"><Pre obj={detail.extracted_fields} /></Section>
              <Section title="Risk result"><Pre obj={detail.risk_result} /></Section>
              <Section title="Decision"><Pre obj={detail.decision} /></Section>
              <Section title={`Evidence hashes (${detail.evidence_hashes?.length || 0}) — images stayed on the device`}>
                <div className="font-mono text-[10.5px] text-mute break-all space-y-0.5">
                  {(detail.evidence_hashes || []).map((h) => <div key={h}>{h}</div>)}
                </div>
              </Section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-divider overflow-hidden">
      <div className="px-3 py-1.5 bg-surface-fog text-[10.5px] uppercase tracking-[0.05em] font-bold text-surface-deep">{title}</div>
      <div className="px-3 py-2">{children}</div>
    </div>
  );
}

function Pre({ obj }: { obj: unknown }) {
  return <pre className="text-[11px] text-ink whitespace-pre-wrap break-all">{JSON.stringify(obj ?? {}, null, 2)}</pre>;
}
