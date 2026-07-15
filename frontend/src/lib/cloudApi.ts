/**
 * Client for the GCP control plane (backend/services/api) — the cross-site
 * cloud view. Base defaults to the local control plane on :8090; after the
 * Cloud Run deploy (P4.5) point VITE_CONTROL_PLANE at the Cloud Run URL.
 */

const BASE: string =
  (import.meta.env.VITE_CONTROL_PLANE as string | undefined) ?? "http://localhost:8090";

export type RiskResult = {
  quantity_variance?: number;
  damaged_cartons?: number;
  documents_missing?: string[];
  payment_exposure?: number;
  po_match_score?: number;
  quality_hold?: boolean;
  invoice_hold?: boolean;
};

export type CloudCase = {
  id: string;
  case_id?: string;
  po_number?: string;
  supplier?: string;
  site_id?: string;
  device_id?: string;
  status?: string;
  latest_decision_id?: string;
  risk_result?: RiskResult;
  updated_at?: string;
};

export type CloudDevice = {
  id: string;
  device_id?: string;
  site_id?: string;
  events_total?: number;
  last_seen?: string;
  last_decision_id?: string;
};

export type CloudDecision = {
  id: string;
  event_type?: string;
  edge_device_id?: string;
  site_id?: string;
  case_id?: string;
  decision_id?: string;
  generated_at?: string;
  local_processing?: boolean;
  evidence_hashes?: string[];
  extracted_fields?: Record<string, unknown>;
  risk_result?: RiskResult;
  decision?: Record<string, unknown>;
  received_at?: string;
};

async function http<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export const cloudApi = {
  base: BASE,
  health: () => http<{ status: string; service: string }>("/health"),
  listCases: () => http<CloudCase[]>("/cases"),
  listDevices: () => http<CloudDevice[]>("/devices"),
  getDecision: (id: string) => http<CloudDecision>(`/decisions/${id}`),
};
