/**
 * Dummy data backing the Goods Receipt Agent console — the inbound deliveries
 * queued at the dock, the four edge-camera captures for the live (flagged)
 * delivery, the fields the edge model extracts with confidence scores, the
 * open-PO lines it matches against, the damage it detects, and the exception
 * case it raises. The flagged BeltPro delivery is the live one that drives the
 * Edge-AI ceremony; the rest give the dock queue a realistic mill texture.
 */

export type DockDelivery = {
  id: string;
  supplier: string;
  /** Open PO the delivery is expected against. */
  po: string;
  /** Dock door it pulled into. */
  door: string;
  carrier: string;
  time: string;
  /** Pallets / cartons on the truck — texture for the row. */
  load: string;
  /** Number of edge captures taken. */
  shots: number;
  status: "scanning" | "exception" | "clean" | "waiting";
  /** Short read on what the agent found. */
  note: string;
  unread?: boolean;
  flagged?: boolean;
  /** Only the live delivery runs the Edge-AI ceremony. */
  actionable?: boolean;
};

export const dockQueue: DockDelivery[] = [
  {
    id: "rcv-belt",
    supplier: "BeltPro Industrial",
    po: "4500039217",
    door: "Dock 3",
    carrier: "Ryder · TRK-4471",
    time: "10:14",
    load: "2 pallets · 50 EA",
    shots: 4,
    status: "exception",
    note: "Short 4 · crushed corner detected on pallet 2",
    unread: true,
    flagged: true,
    actionable: true,
  },
  {
    id: "rcv-adh",
    supplier: "Memphis Chemical Co.",
    po: "4500039180",
    door: "Dock 1",
    carrier: "XPO · TRK-2210",
    time: "09:52",
    load: "8 drums · 1,600 KG",
    shots: 3,
    status: "clean",
    note: "Matched PO · receipt posted automatically",
  },
  {
    id: "rcv-flt",
    supplier: "Cedar Mills Packaging",
    po: "4500039203",
    door: "Dock 2",
    carrier: "Estes · TRK-8830",
    time: "09:31",
    load: "12 rolls · FLT-220",
    shots: 3,
    status: "clean",
    note: "Matched PO · receipt posted automatically",
  },
  {
    id: "rcv-blade",
    supplier: "Sharpline Tooling",
    po: "4500039195",
    door: "Dock 3",
    carrier: "FedEx Freight",
    time: "08:58",
    load: "1 carton · 12 EA",
    shots: 2,
    status: "waiting",
    note: "Photos uploading from dock phone…",
  },
];

/* ── Edge captures for the live BeltPro delivery ──────────────────────────── */

export type CaptureKind = "packing-list" | "box-label" | "pallet" | "damage";

export type DockCapture = {
  kind: CaptureKind;
  label: string;
  /** Chinese term the brief calls out, shown as a secondary tag. */
  zh?: string;
  caption: string;
  /** Drives the placeholder tile's tint / icon. */
  tone: "doc" | "label" | "pallet" | "damage";
};

export const liveCaptures: DockCapture[] = [
  {
    kind: "packing-list",
    label: "Packing list",
    zh: "装箱单",
    caption: "Sleeve on pallet 1 · OCR’d",
    tone: "doc",
  },
  {
    kind: "box-label",
    label: "Box label · shipping marks",
    zh: "箱唛",
    caption: "Carton 1 of 50 · barcode + marks",
    tone: "label",
  },
  {
    kind: "pallet",
    label: "Pallet overview",
    zh: "托盘",
    caption: "2 pallets · carton count",
    tone: "pallet",
  },
  {
    kind: "damage",
    label: "Damage photo",
    zh: "破损",
    caption: "Pallet 2 · crushed corner",
    tone: "damage",
  },
];

/* ── What the edge model extracts, with confidence ────────────────────────── */

export type ExtractedField = {
  label: string;
  value: string;
  confidence: number;
  /** Where it was read from. */
  source: string;
  /** True when the read disagrees with the PO. */
  flag?: boolean;
};

export const extractedFields: ExtractedField[] = [
  { label: "PO number", value: "4500039217", confidence: 0.99, source: "Packing list + box label" },
  { label: "Supplier", value: "BeltPro Industrial", confidence: 0.97, source: "Letterhead + shipping marks" },
  { label: "Item", value: "88-DBX · Double-backer belt", confidence: 0.98, source: "Packing list line 1" },
  { label: "Quantity received", value: "46 EA", confidence: 0.94, source: "Carton count · vision", flag: true },
  { label: "Lot number", value: "LOT-DBX-2607", confidence: 0.96, source: "Box label barcode" },
];

/* ── PO lines: ordered vs received ────────────────────────────────────────── */

export type MatchLine = {
  line: string;
  item: string;
  ordered: number;
  received: number;
  damaged: number;
  unit: string;
  status: "match" | "short" | "damaged" | "over";
};

export const matchLines: MatchLine[] = [
  {
    line: "10",
    item: "88-DBX · Double-backer belt",
    ordered: 50,
    received: 46,
    damaged: 4,
    unit: "EA",
    status: "short",
  },
];

/* ── The auto-generated exception case ────────────────────────────────────── */

export const exceptionCase = {
  id: "EXC-2207",
  type: "Short + damaged receipt",
  severity: "High",
  po: "4500039217",
  supplier: "BeltPro Industrial",
  detected: "10:14 · Dock 3 · edge camera",
  rootCause:
    "Truck delivered 50 EA but 4 units arrived with a crushed pallet corner — 46 usable, 4 rejected on damage.",
  impact:
    "$3,856 of $48,200 affected · production-critical part · maintenance window 2026-06-10 at risk.",
  recommended: [
    "Post goods receipt for 46 EA accepted",
    "Reject 4 damaged units back to BeltPro",
    "Open supplier claim + expedite 4 replacements",
    "Block the invoice four-way match to the received qty",
  ],
};

/* ── The extraction ceremony steps ────────────────────────────────────────── */

export const analysisSteps: string[] = [
  "Reading packing list — OCR",
  "Decoding box label & shipping marks (箱唛)",
  "Matching PO number — 4500039217",
  "Identifying supplier — BeltPro Industrial",
  "Extracting item · quantity · lot number",
  "Inspecting packaging for damage — vision model",
  "Comparing received against PO 4500039217",
];
