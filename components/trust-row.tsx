import { BrandLogo } from "@/components/brand-logo";

/**
 * Customer trust row. Names are placeholders until real customer logos are
 * licensed for public use. `BrandLogo` falls back to a branded monogram
 * tile when `domain` is omitted, which reads as "anonymized customer".
 */
const CUSTOMERS = [
  { name: "Fintech X" },
  { name: "Digital Lender Y" },
  { name: "Crypto Exchange Z" },
  { name: "Northstar Bank" },
  { name: "Helix Capital" },
  { name: "Parallax Pay" },
];

export function TrustRow() {
  return (
    <section className="section-light border-y border-divider py-12">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          <p className="text-mono text-muted">
            TRUSTED BY TEAMS SHIPPING POLICY-AWARE AGENTS
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CUSTOMERS.map((c) => (
            <div
              key={c.name}
              className="h-14 rounded-xl border border-divider bg-white flex items-center gap-2 px-3 transition-colors hover:border-ink/20"
            >
              <BrandLogo name={c.name} size={28} className="rounded-md" />
              <span className="text-body-s font-semibold text-ink/70 tracking-[-0.005em] truncate">
                {c.name}
              </span>
            </div>
          ))}
        </div>

        <p className="text-body-s text-muted max-w-[64ch]">
          Backed by policy, eval, and audit-grade guardrails.
        </p>
      </div>
    </section>
  );
}
