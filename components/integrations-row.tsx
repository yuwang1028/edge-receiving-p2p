import { BrandLogo } from "@/components/brand-logo";

/**
 * Row of real integration logos (fetched via logo.dev CDN by domain).
 * Replaces the previous "customer trust row" on the home page with an
 * "integrated with your existing systems" message.
 */
type LogoItem = { name: string; domain: string };

const LOGOS: LogoItem[] = [
  { name: "SAP", domain: "sap.com" },
  { name: "Oracle", domain: "oracle.com" },
  { name: "Microsoft Dynamics 365", domain: "microsoft.com" },
  { name: "Workday", domain: "workday.com" },
  { name: "NetSuite", domain: "netsuite.com" },
  { name: "Slack", domain: "slack.com" },
  { name: "Persona", domain: "withpersona.com" },
  { name: "Veriff", domain: "veriff.com" },
  { name: "Google Workspace", domain: "workspace.google.com" },
  { name: "Okta", domain: "okta.com" },
];

export function IntegrationsRow() {
  return (
    <section className="section-light border-y border-divider py-14 lg:py-16">
      <div className="max-w-[1520px] mx-auto px-6 lg:px-10 flex flex-col gap-10">
        {/* Eyebrow + headline */}
        <div className="flex flex-col gap-3 max-w-[64ch]" data-reveal="up">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            <p className="text-mono text-muted">
              INTEGRATED WITH YOUR STACK
            </p>
          </div>
          <h2 className="text-h2 lg:text-h1 text-ink leading-[1.25] tracking-[-0.015em] font-semibold">
            Integrated with your existing systems.
            <br />
            <span className="text-muted font-normal">
              Build AI Skills on top of your favorite software.
            </span>
          </h2>
        </div>

        {/* Real brand logos — 5 per row on desktop, wraps on mobile */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
          data-reveal="up"
          style={{ ["--reveal-delay" as string]: "120ms" }}
        >
          {LOGOS.map((l) => (
            <div
              key={l.name}
              className="h-[84px] rounded-xl border border-divider bg-white flex items-center justify-center gap-3 px-4 transition-all duration-200 hover:border-ink/20 hover:shadow-[0_8px_32px_-12px_rgba(10,31,68,0.08)]"
              title={l.name}
            >
              <BrandLogo
                name={l.name}
                domain={l.domain}
                size={32}
                className="rounded-md shrink-0"
              />
              <span className="text-body-s font-medium text-ink/75 tracking-[-0.005em] truncate">
                {l.name}
              </span>
            </div>
          ))}
        </div>

        <p className="text-body-s text-muted max-w-[72ch]">
          Ship into your VPC, single-sign-on, and audit logs from day one. New
          connectors added every sprint.
        </p>
      </div>
    </section>
  );
}
