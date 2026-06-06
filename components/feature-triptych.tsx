import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Template-inspired "Safe. Composable. Governed." three-column feature section.
 * Each column has an abstract geometric line-art icon, a title, a description,
 * and a "Learn more" link. Pure CSS + inline SVG — no animation library needed.
 */

type Feature = {
  title: string;
  body: string;
  href: string;
  icon: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    title: "Safe",
    body:
      "Your data stays under your control. VPC-native deployment, SOC 2 controls, policy-as-code guardrails, and audit-grade traceability on every action.",
    href: "/platform#security",
    icon: <NestedDiamondsIcon />,
  },
  {
    title: "Composable",
    body:
      "Start with one Skill, add the next sprint. Run inside your cloud, on-premises, or in a Bacumen-managed Model Vault — the runtime is the same.",
    href: "/platform#deployment",
    icon: <OrbitIcon />,
  },
  {
    title: "Governed",
    body:
      "Every agent step is traced, reviewable, and reversible. Pin models, set eval gates, train on your proprietary data — no vendor lock-in.",
    href: "/platform#governance",
    icon: <GridMatrixIcon />,
  },
];

export function FeatureTriptych() {
  return (
    <section className="section-light py-24 lg:py-32" aria-labelledby="triptych-heading">
      <div className="max-w-[1520px] mx-auto px-6 lg:px-10">
        <h2
          id="triptych-heading"
          className="text-display-m lg:text-display-l text-ink leading-[1.02] tracking-[-0.02em] text-center mb-16 lg:mb-20"
          data-reveal="up"
        >
          Safe. Composable. Governed.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="flex flex-col gap-6"
              data-reveal="up"
              style={{ ["--reveal-delay" as string]: `${i * 120}ms` }}
            >
              <div
                className="h-20 w-20 text-ink"
                aria-hidden
              >
                {f.icon}
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-h1 text-ink tracking-[-0.015em]">
                  {f.title}
                </h3>
                <p className="text-body text-muted leading-relaxed max-w-[38ch]">
                  {f.body}
                </p>
                <Link
                  href={f.href}
                  className="ui-link mt-2 inline-flex text-body-s font-medium text-ink hover:text-teal transition-colors"
                >
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────── Abstract geometric icons (Template-inspired, original) ─────────── */

function NestedDiamondsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-full w-full", className)}
    >
      {/* Outer rotated square */}
      <rect x="14" y="14" width="52" height="52" transform="rotate(45 40 40)" />
      {/* Inner rotated square */}
      <rect x="24" y="24" width="32" height="32" transform="rotate(45 40 40)" />
      {/* Core diamond dot */}
      <rect x="34" y="34" width="12" height="12" transform="rotate(45 40 40)" />
      {/* Subtle center */}
      <circle cx="40" cy="40" r="1.5" fill="currentColor" />
    </svg>
  );
}

function OrbitIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-full w-full", className)}
    >
      {/* Sphere outline */}
      <circle cx="40" cy="40" r="28" />
      {/* Latitude lines */}
      <ellipse cx="40" cy="40" rx="28" ry="10" />
      <ellipse cx="40" cy="40" rx="28" ry="18" />
      {/* Diagonal orbit */}
      <ellipse
        cx="40"
        cy="40"
        rx="28"
        ry="14"
        transform="rotate(60 40 40)"
      />
      {/* Nodes */}
      <circle cx="18" cy="34" r="2.2" fill="currentColor" />
      <circle cx="62" cy="46" r="2.2" fill="currentColor" />
      <circle cx="40" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}

function GridMatrixIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      className={cn("h-full w-full", className)}
    >
      {/* Outer frame */}
      <rect x="8" y="8" width="64" height="64" />
      {/* Vertical divisions (non-uniform spacing — feels like a data grid) */}
      <line x1="24" y1="8" x2="24" y2="72" />
      <line x1="36" y1="8" x2="36" y2="72" />
      <line x1="52" y1="8" x2="52" y2="72" />
      <line x1="62" y1="8" x2="62" y2="72" />
      {/* Horizontal divisions */}
      <line x1="8" y1="22" x2="72" y2="22" />
      <line x1="8" y1="36" x2="72" y2="36" />
      <line x1="8" y1="50" x2="72" y2="50" />
      <line x1="8" y1="60" x2="72" y2="60" />
    </svg>
  );
}
