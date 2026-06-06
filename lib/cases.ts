export type CaseStudy = {
  slug: string;
  customer: string;
  tagline: string;
  sector: string;
  skillUsed: string;
  pullQuote: string;
  speaker: string;
  metrics: { value: string; label: string }[];
  problem: string;
  solution: string;
  result: string;
};

export const cases: CaseStudy[] = [
  {
    slug: "fintech-x",
    customer: "Fintech X",
    tagline:
      "KYC queue down 90% across 3 markets in 60 days.",
    sector: "Consumer fintech · $2.1B AUM",
    skillUsed: "KYC",
    pullQuote:
      "Three analysts down to one. We kept every tool we had.",
    speaker: "VP of Compliance, Fintech X",
    metrics: [
      { value: "90%", label: "Reviewer time reduction" },
      { value: "$5M", label: "Annual cost saving in year 1" },
      { value: "< 8s", label: "Average case decision" },
    ],
    problem:
      "Fintech X had three markets launching in four months and a reviewer team that could process 80 cases per day. With identity checks from Persona and watchlist screening from ComplyAdvantage, the throughput blocker was human triage, not detection.",
    solution:
      "Bacumen's KYC Skill sat on top of the existing Persona and ComplyAdvantage pipes, evaluated each case against the compliance team's existing policy manual (codified as YAML), drafted approve/decline recommendations with citations, and routed only policy-exception cases to a human.",
    result:
      "Within 60 days, 78% of cases were auto-approved with a < 0.3% downstream fraud rate — below the prior human baseline. Analyst time shifted entirely to exception review and writing suspicious-activity reports, which the agent pre-populated.",
  },
  {
    slug: "digital-lender-y",
    customer: "Digital Lender Y",
    tagline:
      "Reconciled a 400-vendor expense ledger in two days instead of ten.",
    sector: "SMB lending · 250 employees",
    skillUsed: "Finance",
    pullQuote:
      "Our close used to end on day ten. Now it ends on day two, and the audit trail is better than anything we typed by hand.",
    speaker: "Controller, Digital Lender Y",
    metrics: [
      { value: "5×", label: "Faster month-end close" },
      { value: "99.3%", label: "Auto-categorization rate" },
      { value: "< 1%", label: "Re-classifications post-audit" },
    ],
    problem:
      "Ten-day close driven by vendor-reconciliation work across NetSuite, Ramp, and Plaid bank feeds. Controller team spent the last three days chasing exceptions in Slack.",
    solution:
      "Bacumen's Finance Skill ingested bank feeds and expense data, classified against the GL, flagged duplicates, and routed only policy-threshold items. Journal entries were written back to NetSuite with citations to source transactions.",
    result:
      "Close cycle compressed to two days. Re-classifications after audit fell below 1%. Controller team redeployed 1.5 FTE to FP&A.",
  },
  {
    slug: "crypto-exchange-z",
    customer: "Crypto Exchange Z",
    tagline:
      "Onboarded 300 engineers in one quarter with zero missed right-to-work deadlines.",
    sector: "Digital assets · 1,200 employees globally",
    skillUsed: "HR",
    pullQuote:
      "Hyper-growth broke our HR system workflow. Bacumen's HR Skill runs the onboarding instead of us chasing twelve tabs per hire.",
    speaker: "Head of People, Crypto Exchange Z",
    metrics: [
      { value: "75%", label: "Onboarding time reduction" },
      { value: "0", label: "Missed compliance deadlines" },
      { value: "4h", label: "Average time-to-productive" },
    ],
    problem:
      "Rapid-hire quarter meant the People Ops team was tab-surfing across Rippling, Okta, Greenhouse, and benefits portals. Right-to-work checks were tracked manually in a spreadsheet.",
    solution:
      "Bacumen's HR Skill orchestrated offer-to-day-1 across the full stack, ran right-to-work checks automatically, drafted benefits enrollments, and provisioned access packs per role.",
    result:
      "Onboarding time dropped 75%. Zero right-to-work deadline misses across the quarter. Day-1 plans delivered to employee, manager, and buddy on offer acceptance.",
  },
];

export function getCase(slug: string): CaseStudy | undefined {
  return cases.find((c) => c.slug === slug);
}
