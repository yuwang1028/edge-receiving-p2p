"use client";

import * as React from "react";
import {
  ShieldCheck,
  Search,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A dense, credible Bacumen product-UI mock. v2 — tightened.
 *
 * Layout:
 *   - thin top bar: icon + title on left, single LIVE pill on right
 *   - compact toolbar: applicant chip + agents indicator
 *   - 2-col body: queue (left, 380px) | detail (right, flex)
 *   - detail: title + status pill, checks table, 2 meter cards
 */
export function OperatorConsole() {
  const [selected, setSelected] = React.useState(0);

  React.useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => {
      setSelected((i) => (i + 1) % CASES.length);
    }, 4800);
    return () => clearInterval(id);
  }, []);

  const active = CASES[selected]!;

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-cream/10 overflow-hidden",
        "bg-navy-800/80 backdrop-blur-md",
        "shadow-[inset_0_1px_0_rgba(248,250,251,0.06),0_32px_80px_-24px_rgba(0,0,0,0.5)]"
      )}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 h-12 border-b border-cream/10 bg-navy/40">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-accent/15 text-accent grid place-items-center">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <span className="text-body-s font-semibold text-cream">
            KYC Console
          </span>
        </div>
        <span className="inline-flex items-center gap-2 h-7 px-2.5 rounded-full border border-accent/40 bg-ink-cta/10 text-mono text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          LIVE · 87.6% RESOLVED
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-cream/10">
        <div className="flex items-center gap-1.5 h-7 px-2 rounded-md bg-cream/5 border border-cream/10 text-cream/80">
          <Search className="h-3 w-3" />
          <span className="text-mono">APPLICANT</span>
          <span className="text-body-s text-cream/55">#A-4821</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-mono text-cream/40">AGENTS</span>
          <span className="text-body-s text-cream tabular-nums">6 / 6</span>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr]">
        {/* Queue */}
        <div className="border-b md:border-b-0 md:border-r border-cream/10 bg-navy/20">
          <div className="px-5 py-2.5 flex items-center justify-between text-mono text-cream/45 border-b border-cream/5">
            <span>CASE QUEUE</span>
            <span>{CASES.length} pending</span>
          </div>
          <ul>
            {CASES.map((c, i) => (
              <li
                key={c.id}
                onMouseEnter={() => setSelected(i)}
                className={cn(
                  "relative grid grid-cols-[auto_1fr_auto] items-center gap-3 pl-5 pr-4 py-3 border-t border-cream/5 cursor-pointer transition-colors",
                  i === selected
                    ? "bg-cream/[0.04]"
                    : "hover:bg-cream/[0.02]"
                )}
              >
                {/* Left teal bar for selected row */}
                {i === selected && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-accent"
                  />
                )}
                <StatusDot status={c.status} />
                <div className="min-w-0">
                  <div className="text-body-s text-cream truncate">
                    #{c.id} · {c.country}
                  </div>
                  <div className="text-mono text-cream/45 truncate">
                    {c.summary}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-body font-semibold tabular-nums text-cream">
                    {c.score.toFixed(2)}
                  </div>
                  <div className="text-mono text-cream/30 leading-tight">
                    {c.age}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Detail */}
        <div className="p-5 flex flex-col gap-5">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-mono text-accent/80 mb-1.5 truncate">
                TRACE · bcm-kyc-{active.id.toLowerCase()}
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-[1.5rem] leading-[1.15] text-cream font-semibold tracking-[-0.015em]">
                  {active.country} applicant
                </h3>
                <StatusPill status={active.status} />
              </div>
              <div className="text-body-s text-cream/55 mt-1.5">
                {active.summary}
              </div>
            </div>
            <button className="shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-md bg-ink-cta text-white font-medium text-body-s hover:bg-accent transition-colors">
              Open
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Checks */}
          <div className="rounded-xl border border-cream/10 overflow-hidden">
            <div className="grid grid-cols-[1.3fr_1fr_auto] px-3.5 py-2 border-b border-cream/10 text-mono text-cream/45 bg-navy/40">
              <div>SIGNAL</div>
              <div>VALUE</div>
              <div>RULE</div>
            </div>
            {active.checks.map((check, ci) => (
              <div
                key={ci}
                className={cn(
                  "grid grid-cols-[1.3fr_1fr_auto] items-center px-3.5 py-3 text-body-s border-b border-cream/5 last:border-b-0",
                  ci % 2 === 1 && "bg-cream/[0.02]"
                )}
              >
                <div className="text-cream/80">{check.signal}</div>
                <div className="text-cream tabular-nums">{check.value}</div>
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 h-6 pl-1.5 pr-2.5 rounded-full text-mono",
                      check.pass
                        ? "bg-ink-cta/10 text-accent border border-ink-cta/25"
                        : "bg-amber/10 text-amber border border-amber/30"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        check.pass ? "bg-accent" : "bg-amber"
                      )}
                    />
                    {check.rule}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Meters — 2 cards only */}
          <div className="grid grid-cols-2 gap-3">
            <MeterCard
              label="CONFIDENCE"
              value={active.confidence}
              accent="teal"
              threshold={0.92}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
            />
            <MeterCard
              label="RISK"
              value={active.risk}
              accent={active.risk > 0.5 ? "amber" : "teal"}
              threshold={0.5}
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================
// Helpers
// ==============================

function StatusDot({ status }: { status: Case["status"] }) {
  const map: Record<Case["status"], string> = {
    approved: "bg-ink-cta",
    review: "bg-amber",
    flagged: "bg-amber",
    pending: "bg-cream/40",
  };
  return (
    <span
      aria-label={status}
      className={cn("h-1.5 w-1.5 rounded-full shrink-0", map[status])}
    />
  );
}

function StatusPill({ status }: { status: Case["status"] }) {
  const map: Record<
    Case["status"],
    { label: string; className: string }
  > = {
    approved: {
      label: "PASS",
      className: "bg-ink-cta/10 text-accent border-teal/30",
    },
    review: {
      label: "REVIEW",
      className: "bg-amber/10 text-amber border-amber/30",
    },
    flagged: {
      label: "FLAGGED",
      className: "bg-amber/15 text-amber border-amber/40",
    },
    pending: {
      label: "PENDING",
      className: "bg-cream/10 text-cream/70 border-cream/20",
    },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center h-6 px-2 rounded-full text-mono border",
        s.className
      )}
    >
      {s.label}
    </span>
  );
}

function MeterCard({
  label,
  value,
  accent,
  threshold,
  icon,
}: {
  label: string;
  value: number;
  accent: "teal" | "amber";
  threshold: number;
  icon: React.ReactNode;
}) {
  const pct = Math.round(value * 100);
  const thPct = Math.round(threshold * 100);
  return (
    <div className="rounded-xl border border-cream/10 bg-navy/40 p-4">
      <div className="flex items-center gap-1.5 text-mono text-cream/50">
        <span
          className={accent === "teal" ? "text-accent" : "text-amber"}
        >
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-[2rem] leading-none font-display font-bold text-cream tabular-nums tracking-[-0.02em]">
          {pct}
        </span>
        <span className="text-body-s text-cream/40">%</span>
      </div>
      <div className="mt-3 relative h-1.5 rounded-full bg-cream/10 overflow-hidden">
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 rounded-full transition-[width]",
            accent === "teal"
              ? "bg-gradient-to-r from-teal-light to-teal"
              : "bg-gradient-to-r from-amber to-amber-light"
          )}
          style={{ width: `${pct}%`, transitionDuration: "var(--t-4)" }}
        />
        {/* Threshold tick */}
        <span
          aria-hidden
          className="absolute top-[-3px] bottom-[-3px] w-px bg-cream/40"
          style={{ left: `${thPct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-mono text-cream/35">
        <span>0</span>
        <span>threshold {thPct}</span>
        <span>100</span>
      </div>
    </div>
  );
}

// ==============================
// Mock data
// ==============================

type Case = {
  id: string;
  country: string;
  summary: string;
  score: number;
  age: string;
  status: "approved" | "review" | "flagged" | "pending";
  confidence: number;
  policyCoverage: number;
  risk: number;
  checks: { signal: string; value: string; pass: boolean; rule: string }[];
};

const CASES: Case[] = [
  {
    id: "A4821",
    country: "Brazil",
    summary: "IDV Persona · weak PEP match 0.62",
    score: 0.94,
    age: "2s",
    status: "approved",
    confidence: 0.94,
    policyCoverage: 1.0,
    risk: 0.32,
    checks: [
      { signal: "Doc confidence", value: "0.94", pass: true, rule: "≥ 0.92" },
      { signal: "Selfie match", value: "0.91", pass: true, rule: "≥ 0.88" },
      { signal: "Sanctions (Refinitiv)", value: "no match", pass: true, rule: "pass" },
      { signal: "PEP (ComplyAdvantage)", value: "weak 0.62", pass: true, rule: "< 0.75" },
      { signal: "Country risk", value: "medium", pass: true, rule: "EDD" },
    ],
  },
  {
    id: "A4823",
    country: "Singapore",
    summary: "IDV Onfido · clean screen",
    score: 0.98,
    age: "14s",
    status: "approved",
    confidence: 0.98,
    policyCoverage: 1.0,
    risk: 0.12,
    checks: [
      { signal: "Doc confidence", value: "0.98", pass: true, rule: "≥ 0.92" },
      { signal: "Selfie match", value: "0.96", pass: true, rule: "≥ 0.88" },
      { signal: "Sanctions (Dow Jones)", value: "no match", pass: true, rule: "pass" },
      { signal: "PEP (LexisNexis)", value: "no match", pass: true, rule: "< 0.75" },
      { signal: "Country risk", value: "low", pass: true, rule: "standard" },
    ],
  },
  {
    id: "A4828",
    country: "Nigeria",
    summary: "IDV Sumsub · address anomaly",
    score: 0.71,
    age: "42s",
    status: "review",
    confidence: 0.78,
    policyCoverage: 0.9,
    risk: 0.64,
    checks: [
      { signal: "Doc confidence", value: "0.89", pass: false, rule: "≥ 0.92" },
      { signal: "Selfie match", value: "0.94", pass: true, rule: "≥ 0.88" },
      { signal: "Sanctions (Refinitiv)", value: "no match", pass: true, rule: "pass" },
      { signal: "PEP (Dow Jones)", value: "weak 0.48", pass: true, rule: "< 0.75" },
      { signal: "Address anomaly", value: "detected", pass: false, rule: "manual" },
    ],
  },
  {
    id: "A4830",
    country: "Germany",
    summary: "IDV Jumio · straightforward pass",
    score: 0.97,
    age: "1m",
    status: "approved",
    confidence: 0.97,
    policyCoverage: 1.0,
    risk: 0.14,
    checks: [
      { signal: "Doc confidence", value: "0.97", pass: true, rule: "≥ 0.92" },
      { signal: "Selfie match", value: "0.95", pass: true, rule: "≥ 0.88" },
      { signal: "Sanctions (Refinitiv)", value: "no match", pass: true, rule: "pass" },
      { signal: "PEP (ComplyAdvantage)", value: "no match", pass: true, rule: "< 0.75" },
      { signal: "Country risk", value: "low", pass: true, rule: "standard" },
    ],
  },
  {
    id: "A4832",
    country: "UAE",
    summary: "Veriff · sanctions partial hit",
    score: 0.42,
    age: "1m",
    status: "flagged",
    confidence: 0.62,
    policyCoverage: 0.7,
    risk: 0.82,
    checks: [
      { signal: "Doc confidence", value: "0.93", pass: true, rule: "≥ 0.92" },
      { signal: "Selfie match", value: "0.90", pass: true, rule: "≥ 0.88" },
      { signal: "Sanctions (Refinitiv)", value: "partial 0.81", pass: false, rule: "escalate" },
      { signal: "PEP (LexisNexis)", value: "strong 0.88", pass: false, rule: "< 0.75" },
      { signal: "Country risk", value: "high", pass: false, rule: "EDD + human" },
    ],
  },
  {
    id: "A4834",
    country: "Canada",
    summary: "IDV Persona · weak PEP 0.55",
    score: 0.91,
    age: "2m",
    status: "approved",
    confidence: 0.91,
    policyCoverage: 1.0,
    risk: 0.22,
    checks: [
      { signal: "Doc confidence", value: "0.95", pass: true, rule: "≥ 0.92" },
      { signal: "Selfie match", value: "0.88", pass: true, rule: "≥ 0.88" },
      { signal: "Sanctions (Dow Jones)", value: "no match", pass: true, rule: "pass" },
      { signal: "PEP (ComplyAdvantage)", value: "weak 0.55", pass: true, rule: "< 0.75" },
      { signal: "Country risk", value: "low", pass: true, rule: "standard" },
    ],
  },
  {
    id: "A4835",
    country: "Mexico",
    summary: "IDV Onfido · PoA pending",
    score: 0.66,
    age: "3m",
    status: "pending",
    confidence: 0.66,
    policyCoverage: 0.6,
    risk: 0.4,
    checks: [
      { signal: "Doc confidence", value: "0.94", pass: true, rule: "≥ 0.92" },
      { signal: "Selfie match", value: "0.92", pass: true, rule: "≥ 0.88" },
      { signal: "Proof of address", value: "missing", pass: false, rule: "required" },
      { signal: "Sanctions (Refinitiv)", value: "no match", pass: true, rule: "pass" },
      { signal: "Country risk", value: "medium", pass: true, rule: "standard EDD" },
    ],
  },
  {
    id: "A4837",
    country: "UK",
    summary: "IDV Sumsub · clean",
    score: 0.96,
    age: "4m",
    status: "approved",
    confidence: 0.96,
    policyCoverage: 1.0,
    risk: 0.16,
    checks: [
      { signal: "Doc confidence", value: "0.96", pass: true, rule: "≥ 0.92" },
      { signal: "Selfie match", value: "0.94", pass: true, rule: "≥ 0.88" },
      { signal: "Sanctions (Refinitiv)", value: "no match", pass: true, rule: "pass" },
      { signal: "PEP (LexisNexis)", value: "no match", pass: true, rule: "< 0.75" },
      { signal: "Country risk", value: "low", pass: true, rule: "standard" },
    ],
  },
];
