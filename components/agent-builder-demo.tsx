"use client";

import * as React from "react";
import {
  Bot,
  ChevronDown,
  Settings2,
  SlidersHorizontal,
  Plus,
  Calendar,
  CornerDownRight,
  Play,
  Check,
  Folder,
  Cloud,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CursorEntity } from "@/components/cursor-entity";

/**
 * White-surface "Configure Agent" panel (Linear / Ramp product-shot style).
 *
 * Drives the following beats in order — identical cadence to the previous
 * dark-glass version, but redesigned as a product card that floats on
 * any parent section (dark hero, light stacked-scenes, dark workflow
 * section). The animation contract is unchanged: phase 0 → 4 exactly as
 * before; internally we extended with schedule + output reveal beats
 * that piggy-back off phases 3/4 so consumers don't need to change.
 *
 *  0. cursor lands on Description field
 *  1. Description text types in char-by-char
 *  2. cursor moves to Tools dropdown and "opens" it; 3 chips fade in
 *  3. cursor moves to Model select, picks "Command North Large";
 *     Schedule and Output rows reveal
 *  4. cursor retreats; "Saved 2s ago" pill pulses in
 *
 * Fully respects prefers-reduced-motion.
 */
export function AgentBuilderDemo({
  className,
}: {
  className?: string;
}) {
  const [phase, setPhase] = React.useState(0);
  const [desc, setDesc] = React.useState("");
  const [tools, setTools] = React.useState<string[]>([]);
  const [model, setModel] = React.useState("");
  const [toolsOpen, setToolsOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState({ x: 420, y: 52 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(false);
  const reduceMotionRef = React.useRef(false);

  const DESCRIPTION =
    "Summarize the previous quarter's financial performance every 3 months.";
  const TOOLS: { label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: "My Files", icon: Folder },
    { label: "NetSuite", icon: Briefcase },
    { label: "Google Drive", icon: Cloud },
  ];
  const MODEL = "Command North Large";

  React.useEffect(() => {
    reduceMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

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
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  React.useEffect(() => {
    if (!inView) return;
    if (reduceMotionRef.current) {
      setDesc(DESCRIPTION);
      setTools(TOOLS.map((t) => t.label));
      setModel(MODEL);
      setPhase(4);
      return;
    }

    let cancelled = false;

    async function run() {
      setDesc("");
      setTools([]);
      setModel("");
      setToolsOpen(false);
      setPhase(0);
      setCursor({ x: 420, y: 52 });
      await sleep(400);

      // Phase 1 — type description
      setCursor({ x: 240, y: 196 });
      await sleep(320);
      setPhase(1);
      for (let i = 1; i <= DESCRIPTION.length; i++) {
        if (cancelled) return;
        setDesc(DESCRIPTION.slice(0, i));
        await sleep(charDelay(DESCRIPTION[i - 1]));
      }
      await sleep(200);

      // Phase 2 — tools
      setCursor({ x: 360, y: 320 });
      await sleep(340);
      setToolsOpen(true);
      await sleep(180);
      setPhase(2);
      for (const t of TOOLS) {
        if (cancelled) return;
        await sleep(180);
        setTools((prev) => [...prev, t.label]);
      }
      await sleep(180);
      setToolsOpen(false);

      // Phase 3 — model + schedule + output
      setCursor({ x: 400, y: 504 });
      await sleep(340);
      setPhase(3);
      setModel(MODEL);
      await sleep(260);

      // Phase 4 — retreat + saved state
      setCursor({ x: 480, y: 44 });
      setPhase(4);
      await sleep(1800);

      if (!cancelled) run();
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [inView]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-xl bg-white border border-slate-200 shadow-card overflow-hidden",
        "ring-1 ring-white/40", // imperceptible on light bg, adds lift on dark bg
        className
      )}
      style={{ color: "var(--color-ink)" }}
    >
      {/* ─── Header bar ───────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white grid place-items-center">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-[0.98rem] leading-tight tracking-[-0.01em] text-ink truncate">
            Quarterly Financial Summaries
          </div>
          <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 mt-0.5">
            MY AGENT · v1
          </div>
        </div>

        {/* Saved pill — visible from phase 4 */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium",
            "transition-all duration-[var(--t-3)]",
            phase >= 4
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1 pointer-events-none"
          )}
        >
          <Check className="h-3 w-3" strokeWidth={2.5} />
          Saved
        </span>
      </div>

      {/* ─── Tabs ─────────────────────────────────────────────────────── */}
      <div className="px-5 pt-3 flex items-center gap-6 text-[12px] font-medium border-b border-slate-100 relative">
        <span className="relative inline-flex items-center gap-1.5 text-ink pb-2.5">
          <SlidersHorizontal className="h-3 w-3" />
          Configure
          <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-ink rounded-t" />
        </span>
        <span className="inline-flex items-center gap-1.5 text-slate-400 pb-2.5">
          <Settings2 className="h-3 w-3" />
          Advanced
        </span>
      </div>

      {/* ─── Body ─────────────────────────────────────────────────────── */}
      <div className="relative px-5 py-5 flex flex-col gap-4">
        {/* Description */}
        <Field label="Description" required>
          <div
            className={cn(
              "rounded-lg border bg-white px-3 py-2.5 min-h-[72px] text-[13px] leading-[1.45] text-ink/90 transition-colors duration-[var(--t-3)]",
              phase === 1
                ? "border-ink/40 ring-2 ring-ink/5"
                : desc
                ? "border-slate-200"
                : "border-slate-200"
            )}
          >
            {desc || (
              <span className="text-slate-400">Describe what this agent does…</span>
            )}
            {phase === 1 && <span className="caret-ink" />}
          </div>
        </Field>

        {/* Tools */}
        <Field label="Tools">
          <div
            className={cn(
              "rounded-lg border bg-white px-2.5 py-2 min-h-[40px] flex items-center gap-1.5 flex-wrap transition-all duration-[var(--t-3)]",
              phase === 2
                ? "border-ink/40 ring-2 ring-ink/5"
                : "border-slate-200"
            )}
          >
            {tools.length === 0 && (
              <span className="text-[13px] text-slate-400 px-1">
                Select tools…
              </span>
            )}
            {tools.map((t, i) => {
              const Icon = TOOLS.find((x) => x.label === t)?.icon ?? Folder;
              return (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 text-ink text-[12px] pl-2 pr-2.5 py-0.5 font-medium"
                  style={{
                    animation: `fadeUp var(--t-3) var(--ease-spring-ish) backwards`,
                    animationDelay: `${i * 40}ms`,
                  }}
                >
                  <Icon className="h-3 w-3 text-slate-500" />
                  {t}
                </span>
              );
            })}
            {tools.length > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 text-slate-500 text-[12px] px-2 py-0.5 hover:text-ink hover:border-slate-400 transition-colors"
                style={{
                  animation: `fadeUp var(--t-3) var(--ease-spring-ish) backwards`,
                  animationDelay: `${tools.length * 40}ms`,
                }}
              >
                <Plus className="h-3 w-3" />
                Add tool
              </span>
            )}
            <ChevronDown
              className={cn(
                "ml-auto h-3.5 w-3.5 text-slate-400 transition-transform duration-[var(--t-3)]",
                toolsOpen && "rotate-180"
              )}
            />
          </div>
        </Field>

        {/* Schedule — revealed from phase 3 */}
        <Reveal active={phase >= 3}>
          <Field label="Schedule" icon={Calendar}>
            <div className="flex items-center gap-0 text-[13px] text-ink rounded-lg border border-slate-200 bg-white divide-x divide-slate-200 overflow-hidden">
              <span className="px-3 py-2">Every 3 months</span>
              <span className="px-3 py-2 text-slate-600">First Monday</span>
              <span className="px-3 py-2 text-slate-600 font-mono tabular-nums text-[12px]">
                09:00 ET
              </span>
            </div>
          </Field>
        </Reveal>

        {/* Model */}
        <Field label="Model" required>
          <div
            className={cn(
              "rounded-lg border bg-white px-3 py-2.5 flex items-center justify-between transition-colors duration-[var(--t-3)]",
              phase === 3
                ? "border-ink/40 ring-2 ring-ink/5"
                : "border-slate-200"
            )}
          >
            <div className="min-w-0">
              <div
                className={cn(
                  "text-[13px] font-medium truncate",
                  model ? "text-ink" : "text-slate-400"
                )}
              >
                {model || "Select a model…"}
              </div>
              {model && (
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Optimized for financial reasoning · 128k context
                </div>
              )}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </div>
        </Field>

        {/* Output — revealed from phase 3 */}
        <Reveal active={phase >= 3} delay={90}>
          <Field label="Output" icon={CornerDownRight}>
            <div className="flex items-center gap-2 flex-wrap text-[12.5px]">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                CFO review inbox
              </span>
              <span className="text-slate-400">+</span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-ink font-mono text-[11.5px]">
                #finance-leadership
              </span>
            </div>
          </Field>
        </Reveal>
      </div>

      {/* ─── Footer / CTA ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-ink text-white text-[12.5px] font-medium h-8 px-3.5",
            "transition-all duration-[var(--t-3)]",
            phase >= 3
              ? "opacity-100"
              : "opacity-60"
          )}
        >
          Deploy agent
          <span className="text-white/60">·</span>
          <span className="text-white/60 font-mono text-[11px]">⏎</span>
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 text-ink text-[12.5px] font-medium h-8 px-3 bg-white hover:bg-slate-50 transition-colors"
        >
          <Play className="h-3 w-3" strokeWidth={2.5} />
          Test run
        </button>
        <span className="ml-auto text-[11px] text-slate-400 font-mono whitespace-nowrap hidden sm:inline-block">
          policy-checked
        </span>
      </div>

      <CursorEntity x={cursor.x} y={cursor.y} variant="ink" />

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
// Internals
// ─────────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] font-medium text-slate-500">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
        {required && <span className="text-slate-400">*</span>}
      </div>
      {children}
    </div>
  );
}

function Reveal({
  active,
  delay = 0,
  children,
}: {
  active: boolean;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "transition-all ease-[var(--ease-spring-ish)]",
        active
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-1.5 pointer-events-none"
      )}
      style={{
        transitionDuration: "var(--t-4)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function charDelay(ch?: string): number {
  if (!ch) return 6;
  if (",;:".includes(ch)) return 28;
  if (".!?".includes(ch)) return 48;
  if (ch === " ") return 4;
  return 5 + Math.random() * 6;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
