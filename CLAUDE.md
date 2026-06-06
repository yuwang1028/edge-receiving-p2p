# Bacumen Site Copy Rules

## No jargon anywhere visible to users

Every word that renders in the browser — pull quotes, headlines, table
cells, button labels, status chips, eyebrows, captions, tooltips, step
descriptions — must be readable by a literate business executive who
has never worked in compliance / accounting / HR ops / procurement.

Domain acronyms, regulatory abbreviations, vendor-specific shorthand,
and change-management jargon are forbidden in any user-visible string.
The audience reads in 30 seconds; an unfamiliar acronym kills 5 of
those seconds.

### Banned → use instead

| Banned | Use instead |
|---|---|
| IDV | identity check / ID check |
| AML | anti-money-laundering |
| SAR | suspicious-activity report (spelled out on first use) |
| PEP / PEP match | watchlist match |
| EDD | extra due diligence (or "deeper review") |
| GL / GL code | accounting code (or "ledger code") |
| HRIS | HR system |
| ATS | applicant tracking |
| I-9 / E-Verify | right-to-work check |
| ACA-compliant | health-benefits compliant |
| FCR / AHT / CSAT | spell out: first-call resolution / handle time / customer satisfaction |
| MSA | vendor contract |
| Hypercare | post-launch support |
| Cutover | go-live |
| KYC reviewer "touch-time" | reviewer time |

### Keep as-is (industry-default — exec understands)

KYC, HR, ERP, SOX, GDPR, SOC 2, OAuth, API, SaaS, AI, B2B, PoC.

### Vendor names

Persona, Refinitiv, NetSuite, Workday, Okta, Plaid etc. are fine on
**deep skill detail pages and policy YAML examples** but should NOT
appear in homepage hero copy, pull quotes, or stat-grid labels — there
the abstraction "your existing tools" / "your stack" is stronger.

### Vertical-scope rule (already in correction rules)

Hero copy must declare the multi-vertical platform identity. Single-
vertical metrics ("Cut KYC reviewer time 90%", "$5M saved") belong
below the fold in StatGrid + Case Study, never in the hero title.

### Caught-before-shipping

After any user-facing copy edit, sweep with:

```sh
grep -irnE "\b(IDV|AML|SAR|PEP|EDD|HRIS|ATS|FCR|AHT|CSAT|ACA|MSA|I-9|E-Verify|hypercare|cutover|touch-time)\b" \
  lib/ app/ components/ | grep -v node_modules
```

Hits in user-facing strings (`label:`, `title:`, `text:`, `tagline:`,
`pullQuote:`, `oneLiner:`, `headline:`, `eyebrow:`, JSX text content)
must be rewritten before commit. Hits inside policy YAML code blocks,
type literals, route paths, or test fixtures are fine.
