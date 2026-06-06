"use client";

import * as React from "react";
import { Maximize2, Minimize2, Check, X, CornerUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { LucideIcon } from "lucide-react";

export type WorkflowStep = {
  id: string;
  label: string;
  detail: string;
  tool?: string;
  icon?: LucideIcon;
  /** Branch terminals that fan out from this step (rendered at the end). */
  branches?: { id: string; label: string; tone: "approve" | "reject" | "neutral" }[];
};

type Props = {
  steps: WorkflowStep[];
  autoplay?: boolean;
  /** Orientation of the timeline rail. Horizontal is rarely used anymore
   *  but kept for API compatibility with consumers. */
  orientation?: "horizontal" | "vertical" | "auto";
  size?: "default" | "compact";
  onStepChange?: (step: WorkflowStep, index: number) => void;
  className?: string;
  /** Optional eyebrow shown in the card header ("KYC · 6 STEPS · 3 TERMINALS"). */
  header?: string;
  /** Optional subheader. Defaults to "Live workflow". */
  subheader?: string;
};

// Step dwell needs to cover the progress bar's 60ms start delay + 1500ms
// fill (see PROGRESS_FILL_MS) with ~400ms of "done" dwell before the
// parent rotates to the next step. That lands STEP_MS at 2000ms.
const STEP_MS = 2000;
const HOLD_MS = 2600;
const BUILD_STAGGER_MS = 220;

export function WorkflowVisualizer({
  steps,
  autoplay = true,
  orientation = "auto",
  size = "default",
  onStepChange,
  className,
  header,
  subheader,
}: Props) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [open, setOpen] = React.useState<WorkflowStep | null>(null);
  const [isVertical, setIsVertical] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(false);
  const [built, setBuilt] = React.useState<Set<number>>(new Set());
  const reduceMotionRef = React.useRef(false);

  // Responsive orientation — horizontal on very wide desktops if "auto",
  // always vertical on mobile. We've standardized on vertical for the
  // white-card layout since the timeline rail reads better vertically.
  React.useEffect(() => {
    if (orientation !== "auto") {
      setIsVertical(orientation === "vertical");
      return;
    }
    setIsVertical(true);
  }, [orientation]);

  React.useEffect(() => {
    reduceMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotionRef.current) {
      setBuilt(new Set(steps.map((_, i) => i)));
    }
  }, [steps]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  React.useEffect(() => {
    if (!inView || reduceMotionRef.current) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < steps.length; i++) {
      timers.push(
        setTimeout(() => {
          setBuilt((prev) => {
            const next = new Set(prev);
            next.add(i);
            return next;
          });
        }, i * BUILD_STAGGER_MS)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [inView, steps.length]);

  const allBuilt = built.size === steps.length;

  React.useEffect(() => {
    if (!autoplay || paused || !inView || !allBuilt) return;
    if (reduceMotionRef.current) return;
    const isLast = activeIndex === steps.length - 1;
    const delay = isLast ? HOLD_MS : STEP_MS;
    const id = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % steps.length);
    }, delay);
    return () => clearTimeout(id);
  }, [autoplay, paused, inView, allBuilt, activeIndex, steps.length]);

  React.useEffect(() => {
    const step = steps[activeIndex];
    if (step) onStepChange?.(step, activeIndex);
  }, [activeIndex, steps, onStepChange]);

  const lastStep = steps[steps.length - 1];
  const isOnBranchStep = activeIndex === steps.length - 1 && allBuilt;

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "relative rounded-xl bg-white border border-slate-200 shadow-card overflow-hidden",
          "ring-1 ring-white/40",
          className
        )}
        style={{ color: "var(--color-ink)" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.1em] font-medium text-slate-500">
              {header ?? `${steps.length} steps · live`}
            </span>
          </div>
          <span className="ml-auto text-[10px] uppercase tracking-[0.1em] text-slate-400 font-mono">
            {subheader ?? "bacumen · runtime"}
          </span>
        </div>

        {/* ─── Timeline body ──────────────────────────────────────────── */}
        <div className="relative px-5 py-4">
          {/* Rail container — spans between first and last dot centers.
              Both the dashed track and the progress fill live inside it
              so progress % maps to "how far between first and last dot". */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[36px] w-px"
            style={{
              // Each step row has ~72px natural height (py-3 + content);
              // first dot center ~26px down from timeline body top,
              // last dot center ~26px up from bottom. top/bottom values
              // approximate this so the rail visually terminates at the
              // dots rather than past them.
              top: "38px",
              bottom: "38px",
            }}
          >
            <div className="absolute inset-0 w-px bg-slate-200" />
            <div
              className="absolute left-0 top-0 w-[2px] -translate-x-[0.5px] bg-ink transition-[height] duration-[var(--t-4)] ease-[var(--ease-entrance)]"
              style={{
                height: allBuilt
                  ? `${(activeIndex / Math.max(steps.length - 1, 1)) * 100}%`
                  : "0%",
              }}
            />
          </div>

          <ol className="relative flex flex-col gap-1.5">
            {steps.map((step, i) => {
              const active = i === activeIndex && allBuilt;
              const completed = i < activeIndex && allBuilt;
              const visible = built.has(i);
              return (
                <StepRow
                  key={step.id}
                  step={step}
                  active={active}
                  completed={completed}
                  visible={visible}
                  onOpen={() => setOpen(step)}
                  size={size}
                />
              );
            })}
          </ol>
        </div>

        {/* ─── CTA bar ────────────────────────────────────────────────── */}
        {lastStep?.branches && lastStep.branches.length > 0 && (
          <BranchBar
            branches={lastStep.branches}
            highlight={isOnBranchStep}
            visible={allBuilt}
          />
        )}
      </div>

      {/* ─── Detail sheet (unchanged API, updated theme) ─────────────── */}
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right" className="sm:max-w-[480px]">
          <SheetHeader>
            {open?.tool && (
              <div className="text-mono text-ink-cta">{open.tool}</div>
            )}
            <SheetTitle>{open?.label}</SheetTitle>
            <SheetDescription>{open?.detail}</SheetDescription>
          </SheetHeader>
          <div className="rounded-xl border border-divider bg-cream p-4">
            <div className="text-mono text-muted mb-2">What runs here</div>
            <ul className="list-disc list-inside text-body-s text-ink space-y-1">
              <li>Policy-as-code check against the relevant pack</li>
              <li>Evidence captured to the audit trail with trace ID</li>
              <li>Escalation to a human reviewer if outside envelope</li>
            </ul>
          </div>
          <div className="rounded-xl border border-divider p-4">
            <div className="text-mono text-muted mb-2">Why this step matters</div>
            <p className="text-body-s text-ink/80">
              Every agent action passes through the runtime&apos;s policy
              layer. This step is auditable, explainable, and replayable —
              so your compliance team can see exactly why a decision was
              made, not just that it was made.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// A single row in the timeline
// ─────────────────────────────────────────────────────────────────────

function StepRow({
  step,
  active,
  completed,
  visible,
  onOpen,
  size,
}: {
  step: WorkflowStep;
  active: boolean;
  completed: boolean;
  visible: boolean;
  onOpen: () => void;
  size: "default" | "compact";
}) {
  const Icon = step.icon;

  return (
    <li
      className={cn(
        "relative transition-all ease-[var(--ease-spring-ish)]",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none"
      )}
      style={{ transitionDuration: "var(--t-3)" }}
    >
      <button
        type="button"
        aria-current={active ? "step" : undefined}
        aria-label={step.label}
        onClick={onOpen}
        className={cn(
          "group relative w-full text-left rounded-lg flex items-start gap-3 pl-7 pr-3 py-3 transition-colors",
          active
            ? "bg-slate-50"
            : completed
            ? "bg-transparent"
            : "bg-transparent hover:bg-slate-50/60"
        )}
      >
        {/* Dot on the rail — fixed 16px wrapper keeps the center pinned to
            rail-x regardless of which variant renders inside.
            left-8px inside a button with pl-7, origin is card content edge,
            card px-5 = 20px → dot center = 20 + 8 + 8 = 36 == rail-x. */}
        <span
          aria-hidden
          className="absolute left-[8px] top-[18px] h-4 w-4 grid place-items-center"
        >
          {active ? (
            <span className="h-3.5 w-3.5 rounded-full bg-white border-[2px] border-[var(--color-accent)] active-ring-light" />
          ) : completed ? (
            <span className="h-3 w-3 rounded-full bg-ink grid place-items-center">
              <Check className="h-[9px] w-[9px] text-white" strokeWidth={3.5} />
            </span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-white border border-slate-300" />
          )}
        </span>

        {/* Icon + content */}
        {Icon && (
          <div
            className={cn(
              "h-8 w-8 rounded-md grid place-items-center shrink-0 transition-colors duration-[var(--t-3)] mt-0.5",
              active
                ? "bg-ink text-white"
                : completed
                ? "bg-slate-100 text-ink"
                : "bg-slate-50 text-slate-400"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {step.tool && (
            <div
              className={cn(
                "text-[10px] uppercase tracking-[0.1em] font-medium truncate",
                active
                  ? "text-[var(--color-teal-600)]"
                  : completed
                  ? "text-slate-500"
                  : "text-slate-400"
              )}
            >
              {step.tool}
            </div>
          )}
          <div
            className={cn(
              "font-semibold leading-snug tracking-[-0.005em] mt-0.5",
              size === "compact" ? "text-[13px]" : "text-[14px]",
              active
                ? "text-ink"
                : completed
                ? "text-ink/90"
                : "text-slate-600"
            )}
          >
            {step.label}
          </div>
          <div
            className={cn(
              "mt-0.5 leading-[1.4]",
              size === "compact" ? "text-[11.5px]" : "text-[12.5px]",
              active || completed ? "text-slate-600" : "text-slate-400"
            )}
          >
            {step.detail}
          </div>

          {/* Active step expanded detail — only on active */}
          {active && (
            <ActiveDetail step={step} />
          )}
        </div>

        {/* Expand arrow on hover */}
        <span
          aria-hidden
          className={cn(
            "shrink-0 mt-1 text-slate-300 transition-all group-hover:text-slate-500",
            active || completed ? "opacity-100" : "opacity-60"
          )}
        >
          {active ? (
            <Minimize2 className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </span>
      </button>
    </li>
  );
}

// The little expanded "live" block under the active step.
//
// Progress bar fills 0 → 100% during the step's active window, and the
// "running" label flips to "done" once it lands at 100 — this prevents
// the step from advancing visually at 72% mid-stream. Timing is tuned
// against STEP_MS so the bar hits 100 with ~250-350ms of dwell before
// the parent autoplay rotates to the next step.
const PROGRESS_FILL_MS = 1500; // how long width 0 → 100 takes
const PROGRESS_START_DELAY_MS = 60; // tiny delay so CSS registers 0 first

function ActiveDetail({ step }: { step: WorkflowStep }) {
  const [pct, setPct] = React.useState(0);
  React.useEffect(() => {
    setPct(0);
    const id = setTimeout(() => setPct(100), PROGRESS_START_DELAY_MS);
    return () => clearTimeout(id);
  }, [step.id]);

  const done = pct >= 100;

  return (
    <div
      className="mt-2.5 rounded-md bg-white border border-slate-200 px-2.5 py-2 text-[11.5px]"
      style={{
        animation: `fadeUp var(--t-3) var(--ease-spring-ish) backwards`,
      }}
    >
      <div className="flex items-center justify-between text-slate-500 font-mono mb-1.5">
        <span className="inline-flex items-center gap-1">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors duration-[var(--t-3)]",
              done
                ? "bg-[var(--color-teal-600)]"
                : "bg-[var(--color-accent)] animate-pulse"
            )}
          />
          {done ? "done" : "running"}
        </span>
        <span className="tabular-nums">{Math.round(pct)}%</span>
      </div>
      <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-teal-600)] to-[var(--color-teal-light)] transition-[width]"
          style={{
            width: `${pct}%`,
            transitionDuration: `${PROGRESS_FILL_MS}ms`,
            transitionTimingFunction: "var(--ease-entrance)",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Branch CTA bar — replaces the old fan-out cards
// ─────────────────────────────────────────────────────────────────────

function BranchBar({
  branches,
  highlight,
  visible,
}: {
  branches: NonNullable<WorkflowStep["branches"]>;
  highlight: boolean;
  visible: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-stretch gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50/50 transition-opacity duration-[var(--t-4)]",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      {branches.map((b) => {
        const Icon =
          b.tone === "approve" ? Check : b.tone === "reject" ? X : CornerUpRight;
        return (
          <button
            key={b.id}
            type="button"
            tabIndex={-1}
            aria-hidden
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-md text-[12.5px] font-medium transition-all",
              b.tone === "approve" &&
                cn(
                  "bg-ink text-white",
                  highlight && "ring-2 ring-ink/15 ring-offset-1"
                ),
              b.tone === "reject" &&
                "bg-white border border-red-200 text-red-600 hover:bg-red-50",
              b.tone === "neutral" &&
                "bg-white border border-slate-200 text-ink hover:bg-slate-50"
            )}
          >
            <Icon
              className={cn(
                "h-3.5 w-3.5",
                b.tone === "approve" && "text-white"
              )}
              strokeWidth={2.5}
            />
            {b.label}
          </button>
        );
      })}
    </div>
  );
}
