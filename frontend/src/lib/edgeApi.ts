/**
 * Client for the local edge-runtime (backend/services/edge-runtime).
 * Base URL defaults to the dev port 8077; override with VITE_EDGE_API.
 * All shapes mirror the backend's camelCase JSON (and src/data/receiving.ts).
 */

const BASE: string =
  (import.meta.env.VITE_EDGE_API as string | undefined) ?? "http://localhost:8077";

export type ModeInfo = { id: string; label: string; sync: boolean; assist: string };
export type Health = {
  status: string;
  mode: string; // offline | cloud-sync | vertex (runtime-switchable)
  syncEnabled: boolean;
  vertexAssist: boolean;
  modes: ModeInfo[];
  deviceId: string;
  siteId: string;
  provider: string;
  confidenceThreshold: number;
};

export type EdgeCase = {
  id: string;
  poNumber: string;
  plant: string;
  title: string;
  summary: string;
  status: string;
  evaluation: Evaluation | null;
  createdAt: string | null;
  evidenceCount: number;
  evidence?: EvidenceItem[];
};

export type EvidenceItem = {
  id: string;
  kind: string;
  filename: string;
  uri: string;
  sha256: string;
  imageUrl: string;
  width: number | null;
  height: number | null;
  format: string;
  device: string;
  capturedAt: string;
};

export type ExtractedField = {
  label: string;
  value: string;
  confidence: number;
  source: string;
  flag: boolean;
};

export type Extraction = {
  provider: string;
  model: string;
  escalatedFrom: string;
  poNumber: string;
  supplier: string;
  material: string;
  detectedQuantity: number;
  unit: string;
  damagedCartons: number;
  damageSummary?: string;
  lotNumber: string;
  documentsFound: string[];
  documentsMissing: string[];
  confidence: number;
  fields: ExtractedField[];
};

export type MatchLine = {
  line: string;
  item: string;
  ordered: number;
  received: number;
  damaged: number;
  unit: string;
  status: string;
};

export type ExceptionCase = {
  id: string;
  type: string;
  severity: string;
  po: string;
  supplier: string;
  detected: string;
  damageSummary?: string;
  rootCause: string;
  impact: string;
  recommended: string[];
};

export type Evaluation = {
  poMatchScore: number;
  quantityVariance: number;
  damagedCartons: number;
  paymentExposure: number;
  decision: string;
  qualityHold: boolean;
  invoiceHold: boolean;
  matchLines: MatchLine[];
  exceptionCase: ExceptionCase | null;
  recommendedActions: string[];
  fields: ExtractedField[];
};

export type ApproveResult = {
  decisionId: string;
  caseId: string;
  humanDecision: string;
  approver: string;
  autoActions: string[];
  auditUri: string;
  syncEventId: string;
  sync?: { online: boolean; sent?: number; pending?: number };
  mode: string;
};

export type SyncQueue = {
  pending: number;
  events: { id: string; type: string; status: string; createdAt: string }[];
};

// ── P2P money loop (downstream of the receiving decision) ───────────────────
export type GoodsReceiptOut = {
  id: string; poNumber: string; decisionId: string;
  ordered: number; received: number; accepted: number; damaged: number; over: number;
  documentsMissing: string[];
};
export type InvoiceOut = {
  id: string; poNumber: string; supplier: string; billedQuantity: number;
  unitPrice: number; amount: number; currency: string; status: string;
};
export type MatchCheck = { name: string; ok: boolean; detail: string };
export type MatchOut = {
  id: string; status: string; checks: MatchCheck[];
  payableAmount: number; blockedAmount: number; recommended: string[];
};
export type PaymentOut = {
  id: string; status: string; releasedAmount: number; blockedAmount: number; decidedBy: string;
};
export type POOut2 = { poNumber: string; supplier: string; material: string; ordered: number; unit: string; unitPrice: number };
export type ContractOut = { unitPrice: number; currency: string; paymentTerms: string; priceTolerancePct: number; requiredDocuments: string[] };
export type P2PState = {
  caseId?: string;
  purchaseOrder: POOut2 | null;
  contract: ContractOut | null;
  goodsReceipt: GoodsReceiptOut | null;
  invoice: InvoiceOut | null;
  match: MatchOut | null;
  payment: PaymentOut | null;
};

// ── PR processing (upstream: NL need → compliant requisition via agent loop) ─
export type PROut = {
  id: string; rawRequest: string; requester: string; plant: string;
  material: string; materialCode: string; category: string;
  quantity: number; unit: string; estUnitPrice: number; estValue: number;
  budgetOk: boolean; prType: string; purchOrg: string; purchGroup: string;
  costCenter: string; glAccount: string;
  justification: string; reasoning: string; status: string;
};
export type MaterialRow = { material_code: string; name: string; category: string; unit: string; indicative_price: number };
export type CostCenterRow = { cost_center: string; description: string; plant: string; category: string };
export type GLRow = { gl: string; description: string; type: string; category: string };
export type PRCreateResult = {
  pr: PROut; source: string; confidence: number; flags: string[];
  masterData: { materials: MaterialRow[]; costCenters: CostCenterRow[]; glAccounts: GLRow[] };
  matchedCodes: { materialCode: string; costCenter: string; gl: string };
};

// ── Purchase orders (created by the PO agent from an awarded PR) ─────────────
export type POConfirmation = {
  confirmedQuantity: number; deliveryDays: number;
  documentsConfirmed: string[]; documentsPending: string[]; risk: string;
};
export type PORecord = {
  poNumber: string; supplier: string; material: string; expectedQuantity: number;
  unit: string; unitPrice: number; plant: string; requiredDocuments: string[];
  status: string; source: string; prId: string;
  poState: string; supplierEmail: string; confirmation: POConfirmation | null;
};

// ── Sourcing / spot buy (3-bid comparison; rules, no model) ─────────────────
export type Bid = {
  supplier: string; unitPrice: number; amount: number; leadDays: number;
  risk: string; contracted: boolean; score: number; recommended: boolean;
};
export type SourcingOut = {
  id: string; prId: string; category: string; quantity: number; bids: Bid[];
  recommendedSupplier: string; recommendedPrice: number; recommendedAmount: number;
  awardedSupplier: string; awardedPrice: number; awardedAmount: number;
  rationale: string; status: string;
};

// ── Engine map (which model/engine runs each step, by mode) ─────────────────
export type EngineStep = {
  step: string; label: string; engine: string; model: string | null;
  kind: "ai-extract" | "ai-assist" | "rules"; status: "live" | "planned"; note: string;
};
export type EnginesOut = { mode: string; syncEnabled: boolean; vertexRequired: boolean; steps: EngineStep[] };

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} — ${text}`);
  }
  return (await res.json()) as T;
}

export const edgeApi = {
  base: BASE,
  health: () => http<Health>("/health"),
  setMode: (mode: string) =>
    http<{ mode: string; syncEnabled: boolean }>("/api/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    }),
  listCases: () => http<EdgeCase[]>("/api/cases"),
  getCase: (id: string) => http<EdgeCase>(`/api/cases/${id}`),
  createCase: (poNumber: string) =>
    http<EdgeCase>("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poNumber }),
    }),
  uploadEvidence: (id: string, files: FileList | File[]) => {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    return http<{ caseId: string; evidence: EvidenceItem[] }>(
      `/api/cases/${id}/evidence`,
      { method: "POST", body: form },
    );
  },
  extract: (id: string) => http<Extraction>(`/api/cases/${id}/extract`, { method: "POST" }),
  evaluate: (id: string) => http<Evaluation>(`/api/cases/${id}/evaluate`, { method: "POST" }),
  approve: (id: string, body: { decision: string; approver: string }) =>
    http<ApproveResult>(`/api/cases/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  getAudit: (id: string) => http<Record<string, unknown>>(`/api/cases/${id}/audit`),
  getP2P: (id: string) => http<P2PState>(`/api/cases/${id}/p2p`),
  chat: (id: string, messages: { role: string; content: string }[], agent = "receiving") =>
    http<{ reply: string; proposedAction: { action: string; label: string } | null }>(
      `/api/cases/${id}/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, agent }),
      },
    ),
  uploadInvoice: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http<{ invoice: InvoiceOut; extracted: Record<string, unknown> }>(
      `/api/cases/${id}/invoice`,
      { method: "POST", body: form },
    );
  },
  annotateDamage: (id: string) =>
    http<{ count: number; model: string; boxedUrl: string }>(`/api/cases/${id}/damage/annotate`, { method: "POST" }),
  simulateInvoice: (id: string) =>
    http<{ invoice: InvoiceOut; source: string }>(`/api/cases/${id}/invoice/simulate`, { method: "POST" }),
  runMatch: (id: string) =>
    http<{ match: MatchOut; invoice: InvoiceOut; goodsReceipt: GoodsReceiptOut }>(
      `/api/cases/${id}/match`,
      { method: "POST" },
    ),
  pay: (id: string, decidedBy: string) =>
    http<{ payment: PaymentOut; invoice: InvoiceOut }>(`/api/cases/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decidedBy }),
    }),
  createPr: (request: string, requester = "Plant requester", plant = "Heidelberg") =>
    http<PRCreateResult>("/api/prs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request, requester, plant }),
    }),
  listPrs: () => http<PROut[]>("/api/prs"),
  deletePr: (id: string) => http<{ deleted: string }>(`/api/prs/${id}`, { method: "DELETE" }),
  sourcePr: (id: string) => http<{ sourcing: SourcingOut; prId: string }>(`/api/prs/${id}/source`, { method: "POST" }),
  getSourcing: (id: string) => http<SourcingOut>(`/api/prs/${id}/sourcing`),
  awardSourcing: (id: string, supplier = "") =>
    http<{ sourcing: SourcingOut; prId: string }>(`/api/prs/${id}/award`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplier }),
    }),
  listPos: () => http<PORecord[]>("/api/pos"),
  createPo: (prId: string) => http<{ po: PORecord; reused: boolean }>(`/api/prs/${prId}/po`, { method: "POST" }),
  getPoForPr: (prId: string) => http<PORecord>(`/api/prs/${prId}/po`),
  draftPoEmail: (po: string) => http<PORecord>(`/api/pos/${po}/draft-email`, { method: "POST" }),
  sendPo: (po: string) => http<PORecord>(`/api/pos/${po}/send`, { method: "POST" }),
  confirmPo: (po: string) => http<PORecord>(`/api/pos/${po}/confirm`, { method: "POST" }),
  getEngines: () => http<EnginesOut>("/api/engines"),
  approvePr: (id: string, approver = "Procurement lead") =>
    http<{ pr: PROut; approver: string }>(`/api/prs/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approver }),
    }),
  syncQueue: () => http<SyncQueue>("/api/sync/queue"),
  flushSync: () => http<{ online: boolean; pending: number; sent: number }>("/api/sync/flush", {
    method: "POST",
  }),
};
