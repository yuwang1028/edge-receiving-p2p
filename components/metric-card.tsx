"use client";

import * as React from "react";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Sparkline } from "@/components/sparkline";

export type MetricCardProps = {
  /** e.g. "80%" / "< 8s" / "$120K" */
  value: string;
  /** Short label under the number */
  label: string;
  /** Small subline (optional) — e.g. "vs. Q4 baseline" */
  sublabel?: string;
  /** "+12%" or "-3.2pp" — tone inferred from leading sign */
  delta?: string;
  /** What the delta measures, e.g. "WoW" */
  deltaNote?: string;
  /** Small lucide icon in the top-left cell */
  icon?: LucideIcon;
  /** Provenance footnote — e.g. "FINTECH X · Q1 2026" */
  source?: string;
  /** Optional sparkline trend (6–24 numbers is ideal) */
  trend?: number[];
  /** Which direction is good? Default up. Affects delta color when sign matches. */
  goodDirection?: "up" | "down";
  /** Layout variant */
  tone?: "light" | "dark";
  className?: string;
};

/**
 * Untitled-UI-style metric card:
 *   [ icon ]           [ delta pill ]
 *   big-number  sublabel
 *   label
 *   ──────────────────────────────
 *   source   · · · · · ·  sparkline
 *
 * Plus Aceternity-style gradient hover border that tracks the cursor.
 */
export function MetricCard({
  value,
  label,
  sublabel,
  delta,
  deltaNote,
  icon: Icon,
  source,
  trend,
  goodDirection = "up",
  tone = "light",
  className,
}: MetricCardProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  // Aceternity-style: move a conic gradient behind the border that tracks the cursor.
  // We set CSS vars --mx/--my in px and use them in a pseudo-element via inline style.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  const deltaSign = (delta ?? "").trim().startsWith("-") ? "down" : "up";
  const deltaIsGood = deltaSign === goodDirection;
  const strokeColor = tone === "dark" ? "#93c5fd" : "#1d4ed8";

  return (
    <div
      ref={ref}
      className={cn(
        "group relative rounded-2xl p-6 flex flex-col gap-5 min-w-0 overflow-hidden",
        "transition-[transform,box-shadow,border-color] duration-[var(--t-3)] ease-[var(--ease-entrance)]",
        tone === "light"
          ? "bg-white border border-divider hover:-translate-y-0.5 hover:shadow-soft hover:border-ink/20"
          : "bg-navy-800/70 border border-cream/10 hover:border-cream/25",
        className
      )}
      style={
        {
          containerType: "inline-size",
          // Aceternity-style cursor spotlight (light mode only)
          backgroundImage:
            tone === "light"
              ? "radial-gradient(240px circle at var(--mx, 50%) var(--my, -20%), rgba(29, 78, 216,0.06), transparent 60%)"
              : undefined,
        } as React.CSSProperties
      }
    >
      {/* Top row — icon + delta */}
      <div className="flex items-center justify-between gap-3">
        {Icon ? (
          <div
            className={cn(
              "h-9 w-9 rounded-lg grid place-items-center",
              tone === "light"
                ? "bg-ink-cta/10 text-teal"
                : "bg-accent/15 text-accent"
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : (
          <div className="h-9 w-9" aria-hidden />
        )}

        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-1 h-6 px-2 rounded-full text-mono border tabular-nums",
              deltaIsGood
                ? tone === "light"
                  ? "bg-ink-cta/10 text-ink-cta border-ink-cta/25"
                  : "bg-accent/15 text-accent border-teal-light/30"
                : tone === "light"
                ? "bg-amber/15 text-ink border-amber/40"
                : "bg-amber/15 text-amber border-amber/40"
            )}
          >
            {deltaSign === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {delta}
            {deltaNote && (
              <span
                className={cn(
                  "ml-0.5",
                  tone === "light" ? "text-muted" : "text-cream/50"
                )}
              >
                {deltaNote}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Number + label */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-3">
          <span
            className={cn(
              "font-display font-bold leading-[0.95] tracking-[-0.04em]",
              "text-[clamp(2.25rem,18cqi,3.75rem)] whitespace-nowrap overflow-hidden",
              tone === "light" ? "text-ink" : "text-cream"
            )}
          >
            {value}
          </span>
          {sublabel && (
            <span
              className={cn(
                "text-body-s truncate",
                tone === "light" ? "text-muted" : "text-cream/50"
              )}
            >
              {sublabel}
            </span>
          )}
        </div>
        <p
          className={cn(
            "text-body-s leading-snug max-w-[28ch]",
            tone === "light" ? "text-ink/75" : "text-cream/70"
          )}
        >
          {label}
        </p>
      </div>

      {/* Bottom row — source + sparkline */}
      {(source || trend) && (
        <div
          className={cn(
            "mt-auto pt-5 flex items-center justify-between gap-3 border-t",
            tone === "light" ? "border-divider" : "border-cream/10"
          )}
        >
          {source ? (
            <span
              className={cn(
                "text-mono truncate",
                tone === "light" ? "text-muted" : "text-cream/45"
              )}
            >
              {source}
            </span>
          ) : (
            <span />
          )}
          {trend && trend.length >= 2 && (
            <Sparkline
              values={trend}
              width={96}
              height={28}
              stroke={strokeColor}
            />
          )}
        </div>
      )}
    </div>
  );
}
