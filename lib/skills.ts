export type SkillSlug = "kyc" | "finance" | "hr" | "erp";

export type WorkflowStep = {
  id: string;
  label: string;
  detail: string;
  tool?: string;
  /** Icon resolved by slug via components/skill-icon.tsx (keeps lib/ server-safe). */
  iconKey?: StepIconKey;
};

export type StepIconKey =
  | "inbox"
  | "fingerprint"
  | "radar"
  | "shield"
  | "gavel"
  | "archive"
  | "receipt"
  | "database"
  | "tag"
  | "scale"
  | "check"
  | "send"
  | "briefcase"
  | "server"
  | "verified"
  | "heart"
  | "key"
  | "calendar"
  | "clipboard"
  | "layers"
  | "route";

export type Branch = {
  id: string;
  label: string;
  tone: "approve" | "reject" | "neutral";
};

export type IntegrationGroup = {
  group: string;
  items: string[];
};

export type ArtifactBlock =
  | { type: "paragraph"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "list"; items: string[] };

export type Artifact = {
  eyebrow: string;      // mono, e.g. "CREATED NOW"
  title: string;        // doc title
  blocks: ArtifactBlock[];
};

export type Skill = {
  slug: SkillSlug;
  name: string;
  shortName: string;            // for nav/menu
  category: string;             // shown in mono eyebrow
  oneLiner: string;             // for cards + nav
  headline: string;             // hero h1
  sub: string;                  // hero sub
  bigNumbers: { value: string; label: string }[];
  steps: WorkflowStep[];
  integrations: IntegrationGroup[];
  integrationChips: string[];   // short list for card footer
  before: string[];             // 4 lines
  after: string[];              // 4 lines
  policyYamlPreview: string;    // ~20 lines
  artifact: Artifact;           // LiveArtifactPanel content
  /** Terminal branches (Approve / Reject / Escalate) fanning off the last workflow step. */
  branches?: Branch[];
};

export const skills: Skill[] = [
  // ───────────────────────────── KYC ─────────────────────────────
  {
    slug: "kyc",
    name: "KYC Skill",
    shortName: "KYC",
    category: "SKILL · COMPLIANCE",
    oneLiner:
      "Reviewer time down 90%. Keep every tool you have.",
    headline:
      "Cut KYC reviewer time by 90%. Keep every tool you have.",
    sub: "Bacumen's KYC Skill sits on Persona, Alloy, Onfido, Sumsub, and your watchlist of choice. It triages cases, drafts decisions, writes suspicious-activity reports, and escalates exceptions — with every action policy-checked and audit-logged.",
    bigNumbers: [
      { value: "$5M", label: "Cost saved, year 1" },
      { value: "80%", label: "Alert reduction" },
      { value: "< 8s", label: "Avg case decision" },
    ],
    steps: [
      {
        id: "submit",
        label: "Customer submits docs",
        detail: "Document, selfie, address, optional PoA.",
        tool: "Customer app",
        iconKey: "inbox",
      },
      {
        id: "idv",
        label: "Identity check runs",
        detail: "Persona / Onfido / Sumsub / Jumio.",
        tool: "Identity provider",
        iconKey: "fingerprint",
      },
      {
        id: "screen",
        label: "Sanctions & watchlist screen",
        detail: "Refinitiv / Dow Jones / ComplyAdvantage.",
        tool: "Watchlist",
        iconKey: "radar",
      },
      {
        id: "policy",
        label: "Agent evaluates policy",
        detail: "Policy-as-code: country risk, watchlist match, anomalies.",
        tool: "Bacumen Runtime",
        iconKey: "shield",
      },
      {
        id: "decide",
        label: "Decision drafted",
        detail:
          "approve / reject / escalate + reasoning + evidence.",
        tool: "Bacumen Skill",
        iconKey: "gavel",
      },
      {
        id: "audit",
        label: "Audit trail + report",
        detail:
          "Immutable trace; suspicious-activity report drafted for analyst review.",
        tool: "Bacumen Runtime",
        iconKey: "archive",
      },
    ],
    branches: [
      { id: "approve", label: "Auto-approve", tone: "approve" },
      { id: "escalate", label: "Escalate", tone: "neutral" },
      { id: "reject", label: "Decline", tone: "reject" },
    ],
    integrations: [
      {
        group: "Orchestrators",
        items: ["Persona", "Alloy"],
      },
      {
        group: "Identity verification",
        items: ["Onfido", "Jumio", "Sumsub", "Veriff"],
      },
      {
        group: "Sanctions & watchlist",
        items: [
          "Refinitiv",
          "Dow Jones",
          "ComplyAdvantage",
          "LexisNexis",
        ],
      },
      {
        group: "Anti-money-laundering monitoring",
        items: ["Unit21", "Hawk", "Sardine"],
      },
    ],
    integrationChips: ["Persona", "Onfido", "Refinitiv"],
    before: [
      "60-hour weekly reviewer queue",
      "18% false-positive rate",
      "3-day report drafting backlog",
      "Evidence scattered across screens",
    ],
    after: [
      "6-hour queue, analyst-led exceptions only",
      "4% false-positive rate after policy tuning",
      "Reports drafted in minutes with citations",
      "One immutable trace per case",
    ],
    policyYamlPreview: `# kyc/policies/onboarding.yaml
version: 2.4.1
owner: compliance-team

country_risk:
  high:
    - IR
    - KP
    - SY
    - CU
  require_edd_for:
    - ["HK", "RU"]

pep_screen:
  providers: [refinitiv, comply_advantage]
  action_on_match: escalate
  allow_auto_decline_if: never

thresholds:
  doc_confidence: 0.92
  selfie_match:   0.88

escalation:
  any_of:
    - country_in: high
    - pep_match: true
    - doc_confidence_below: 0.92
`,
    artifact: {
      eyebrow: "DECISION · CASE 7F2A1C",
      title: "APPROVE — onboard with extra review",
      blocks: [
        {
          type: "paragraph",
          text: "All policy thresholds met. One weak watchlist match dismissed below the 0.75 cutoff. Trace: bcm-kyc-7f2a1c.",
        },
        {
          type: "table",
          headers: ["Signal", "Value", "Threshold"],
          rows: [
            ["Doc confidence", "0.94", "≥ 0.92 ✓"],
            ["Selfie match", "0.91", "≥ 0.88 ✓"],
            ["Sanctions screen", "clear", "pass ✓"],
            ["Watchlist match", "0.62", "< 0.75 ✓"],
            ["Country risk", "medium", "extra review"],
          ],
        },
      ],
    },
  },

  // ───────────────────────────── Finance ─────────────────────────────
  {
    slug: "finance",
    name: "Finance Skill",
    shortName: "Finance",
    category: "SKILL · FINANCE",
    oneLiner: "Close the books while you sleep.",
    headline: "Close the books while you sleep.",
    sub: "Bacumen's Finance Skill reconciles transactions, categorizes journal entries, and routes approvals across QuickBooks, NetSuite, Sage Intacct, and Xero.",
    bigNumbers: [
      { value: "5×", label: "Faster month-end close" },
      { value: "6", label: "Core integrations" },
      { value: "99.3%", label: "Auto-categorized" },
    ],
    steps: [
      {
        id: "ingest",
        label: "Transaction ingested",
        detail: "Bank feed, invoice inbox, or expense platform.",
        tool: "Plaid / Ramp",
        iconKey: "receipt",
      },
      {
        id: "pull",
        label: "Adapter pulls context",
        detail: "QuickBooks / NetSuite / Sage / Xero.",
        tool: "GL adapter",
        iconKey: "database",
      },
      {
        id: "classify",
        label: "Agent classifies + maps GL",
        detail: "Vendor, category, department, project tag.",
        tool: "Bacumen Skill",
        iconKey: "tag",
      },
      {
        id: "reconcile",
        label: "Reconcile vs ledger",
        detail: "Detect duplicates, mismatches, outliers.",
        tool: "Bacumen Runtime",
        iconKey: "scale",
      },
      {
        id: "approve",
        label: "Approval routed",
        detail: "HITL for > threshold or anomaly.",
        tool: "Bacumen Runtime",
        iconKey: "check",
      },
      {
        id: "post",
        label: "Journal entry posted",
        detail: "Write back to GL; notify Controller.",
        tool: "NetSuite",
        iconKey: "send",
      },
    ],
    branches: [
      { id: "auto-post", label: "Auto-post", tone: "approve" },
      { id: "hitl", label: "Controller review", tone: "neutral" },
    ],
    integrations: [
      {
        group: "Accounting",
        items: ["QuickBooks", "NetSuite", "Sage Intacct", "Xero"],
      },
      { group: "Bank data", items: ["Plaid", "Finicity"] },
      { group: "Expense", items: ["Brex", "Ramp", "Expensify"] },
    ],
    integrationChips: ["NetSuite", "Ramp", "Plaid"],
    before: [
      "10-day close, engineering still in reconciliation",
      "3 FTEs chasing vendor exceptions",
      "6% re-classifications after audit",
      "Opaque audit trail of Slack and email",
    ],
    after: [
      "2-day close with live dashboard",
      "0.5 FTE oversight for anomalies only",
      "< 1% re-classifications",
      "Every JE cites source + policy applied",
    ],
    policyYamlPreview: `# finance/policies/close.yaml
version: 1.7.0
owner: controller

auto_post_if:
  amount_under: 5000
  vendor_known: true
  duplicate_score_below: 0.15

escalate_if:
  any_of:
    - amount_over: 25000
    - vendor_new: true
    - gl_confidence_below: 0.9

approvers:
  ap:     [controller, cfo]
  accrual:[controller]
  fx:     [treasurer, cfo]
`,
    artifact: {
      eyebrow: "JOURNAL ENTRY · A194E2",
      title: "AUTO-POST — November SaaS & hosting",
      blocks: [
        {
          type: "paragraph",
          text: "14 lines reconciled against NetSuite. 2 duplicates caught and dropped. Within auto-post policy. Trace: bcm-fin-a194e2.",
        },
        {
          type: "table",
          headers: ["Account", "Memo", "Debit", "Credit"],
          rows: [
            ["6150 · SaaS", "Datadog — Nov", "$9,420", ""],
            ["6150 · SaaS", "Segment — Nov", "$3,180", ""],
            ["6410 · Hosting", "AWS — Nov", "$61,204", ""],
            ["1020 · Cash", "BoA #4421", "", "$73,804"],
          ],
        },
      ],
    },
  },

  // ───────────────────────────── HR ─────────────────────────────
  {
    slug: "hr",
    name: "HR Skill",
    shortName: "HR",
    category: "SKILL · PEOPLE OPS",
    oneLiner: "Onboard, offboard, and run payroll without hand-offs.",
    headline: "Onboard, offboard, and run payroll without the hand-offs.",
    sub: "Bacumen's HR Skill orchestrates offers, right-to-work checks, benefits, provisioning, and payroll runs across Workday, Rippling, Gusto, Paylocity, ADP, and BambooHR.",
    bigNumbers: [
      { value: "75%", label: "Onboarding time saved" },
      { value: "20", label: "HR systems connected" },
      { value: "0", label: "Missed deadlines, pilot" },
    ],
    steps: [
      {
        id: "offer",
        label: "Offer accepted in hiring system",
        detail: "Greenhouse / Ashby / Lever.",
        tool: "Greenhouse",
        iconKey: "briefcase",
      },
      {
        id: "hris",
        label: "Agent creates HR record",
        detail: "Workday / Rippling / Gusto / BambooHR.",
        tool: "Rippling",
        iconKey: "server",
      },
      {
        id: "verify",
        label: "Right-to-work check auto-run",
        detail: "Federal + state checks; exception surfaced.",
        tool: "Bacumen Runtime",
        iconKey: "verified",
      },
      {
        id: "benefits",
        label: "Benefits enrollment drafted",
        detail: "Health-benefits compliant; policy pack applied.",
        tool: "Bacumen Skill",
        iconKey: "heart",
      },
      {
        id: "provision",
        label: "IT + access provisioning",
        detail: "Okta / Google / GitHub / Slack.",
        tool: "Okta",
        iconKey: "key",
      },
      {
        id: "day1",
        label: "Day-1 plan delivered",
        detail: "To employee + manager + buddy.",
        tool: "Slack",
        iconKey: "calendar",
      },
    ],
    branches: [
      { id: "ready", label: "Ready Day-1", tone: "approve" },
      { id: "exception", label: "Exception", tone: "neutral" },
    ],
    integrations: [
      {
        group: "HR & Payroll",
        items: [
          "Workday",
          "Rippling",
          "Gusto",
          "Paylocity",
          "ADP",
          "BambooHR",
        ],
      },
      { group: "Hiring", items: ["Greenhouse", "Ashby", "Lever"] },
      { group: "IT", items: ["Okta", "Google Workspace", "Slack"] },
    ],
    integrationChips: ["Rippling", "Okta", "Greenhouse"],
    before: [
      "12 screens per new hire",
      "4-day onboarding queue",
      "Ad-hoc right-to-work chasing",
      "Day-1 plan in someone's notebook",
    ],
    after: [
      "One natural-language instruction",
      "4-hour onboarding, compliance by default",
      "Every federal check traced and timestamped",
      "Day-1 plan delivered before the laptop",
    ],
    policyYamlPreview: `# hr/policies/onboarding.yaml
version: 3.1.0
owner: people-ops

required_before_day_one:
  - offer_signed
  - i9_complete
  - benefits_enrolled
  - laptop_shipped

access_defaults_by_role:
  engineer: [github, okta, slack, notion, sentry]
  sales:    [salesforce, gong, slack, notion]
  ops:      [okta, slack, notion]

escalate_if:
  any_of:
    - i9_status: "exception"
    - ship_eta_after: start_date - 2d
`,
    artifact: {
      eyebrow: "DAY-1 PLAN · NEW ENGINEER",
      title: "READY DAY-1 — Mon Nov 17",
      blocks: [
        {
          type: "paragraph",
          text: "Right-to-work cleared. Benefits enrolled. Laptop shipped. Access pack applied. Trace: bcm-hr-c4e9b0.",
        },
        {
          type: "table",
          headers: ["Time", "Session", "Owner"],
          rows: [
            ["09:00", "Welcome + laptop setup", "IT buddy"],
            ["10:00", "Team intro + roadmap", "Manager"],
            ["11:30", "Security walkthrough", "People ops"],
            ["14:00", "First-ticket pairing", "Tech lead"],
          ],
        },
        {
          type: "list",
          items: [
            "Access granted across 5 tools",
            "Benefits acknowledged",
            "Manager + buddy notified",
          ],
        },
      ],
    },
  },

  // ───────────────────────────── ERP ─────────────────────────────
  {
    slug: "erp",
    name: "ERP Skill",
    shortName: "ERP",
    category: "SKILL · OPERATIONS",
    oneLiner:
      "Run SAP, Oracle, Dynamics — without the screens.",
    headline:
      "Run procurement, orders, and approvals on top of SAP, Oracle, and Dynamics — without the screens.",
    sub: "Bacumen's ERP Skill validates, classifies, and routes transactions through the approval chains your policies demand — with full audit trail and explainable decisions.",
    bigNumbers: [
      { value: "60%", label: "Faster PO cycle time" },
      { value: "3", label: "ERPs supported" },
      { value: "100%", label: "Auditable" },
    ],
    steps: [
      {
        id: "enter",
        label: "Request enters ERP",
        detail: "SAP / Oracle / Dynamics 365.",
        tool: "SAP S/4HANA",
        iconKey: "inbox",
      },
      {
        id: "validate",
        label: "Agent validates + classifies",
        detail: "Line items, GL codes, tax, vendor master.",
        tool: "Bacumen Skill",
        iconKey: "clipboard",
      },
      {
        id: "fetch",
        label: "Adapter fetches context",
        detail: "Inventory, vendor history, contract terms.",
        tool: "Coupa + Ironclad",
        iconKey: "layers",
      },
      {
        id: "policy",
        label: "Policy check",
        detail: "Approval chain, budget, delegation limits.",
        tool: "Bacumen Runtime",
        iconKey: "shield",
      },
      {
        id: "draft",
        label: "Decision drafted + routed",
        detail: "HITL if outside policy envelope.",
        tool: "Bacumen Runtime",
        iconKey: "route",
      },
      {
        id: "post",
        label: "Transaction posted",
        detail: "Downstream systems notified; notes logged.",
        tool: "SAP + Slack",
        iconKey: "send",
      },
    ],
    branches: [
      { id: "auto-approve", label: "Within policy", tone: "approve" },
      { id: "hitl", label: "HITL approval", tone: "neutral" },
      { id: "block", label: "Blocked", tone: "reject" },
    ],
    integrations: [
      {
        group: "ERP",
        items: ["SAP", "Oracle", "Microsoft Dynamics 365"],
      },
      { group: "Procurement", items: ["Coupa", "Ariba"] },
      { group: "Contract", items: ["Ironclad", "DocuSign CLM"] },
      { group: "Master data", items: ["Informatica", "Stibo"] },
    ],
    integrationChips: ["SAP", "Coupa", "Ironclad"],
    before: [
      "14-day PO cycle average",
      "5 hand-offs between systems",
      "Reconciliation spreadsheets circulating",
      "Approvers chasing context",
    ],
    after: [
      "5-day PO cycle, policy-aware routing",
      "2 hand-offs, the rest automated",
      "Zero spreadsheets — live trace UI",
      "Approvers see context, not just amounts",
    ],
    policyYamlPreview: `# erp/policies/procurement.yaml
version: 4.0.2
owner: head-of-procurement

approval_chain:
  under_10k:   [manager]
  under_50k:   [manager, director]
  under_250k:  [manager, director, vp]
  over_250k:   [manager, director, vp, cfo]

block_if:
  any_of:
    - vendor_not_in_master: true
    - contract_expired: true
    - budget_remaining_below: 0

delegation:
  vacation_fallback_to: manager.peer
`,
    artifact: {
      eyebrow: "PO · 3D71FA · $132,000",
      title: "ROUTING TO VP — within policy",
      blocks: [
        {
          type: "paragraph",
          text: "Vendor verified. Contract terms matched. Within budget. Approval chain: Manager → Director → VP. Trace: bcm-erp-3d71fa.",
        },
        {
          type: "table",
          headers: ["Line", "Description", "GL", "Amount"],
          rows: [
            ["1", "Premium support — 12mo", "6410", "$84,000"],
            ["2", "Dedicated TAM", "6410", "$36,000"],
            ["3", "Overage pool", "6410", "$12,000"],
          ],
        },
      ],
    },
  },
];

export function getSkill(slug: string): Skill | undefined {
  return skills.find((s) => s.slug === slug);
}

export function listSkills(): Skill[] {
  return skills;
}

export const skillSlugs: SkillSlug[] = skills.map((s) => s.slug);
