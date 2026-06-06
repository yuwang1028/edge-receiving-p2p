"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Sparkles } from "lucide-react";
import { AgentBuilderDemo } from "@/components/agent-builder-demo";
import { WorkflowVisualizer, type WorkflowStep } from "@/components/workflow-visualizer";
import { LiveArtifactPanel } from "@/components/live-artifact-panel";
import { stepIconFor } from "@/components/skill-icon";
import { listSkills } from "@/lib/skills";

/**
 * Scroll-spine layout inspired by Decagon's "Build / Test / Scale" story:
 *  - Thin vertical line runs down the whole section
 *  - Three numbered orbs sit on the line (1 / 2 / 3)
 *  - Each phase alternates sides (copy left | visual right, then visual left | copy right)
 *  - Each phase has its own accent tint (teal → teal-light → cream)
 *  - The verb in each title gets a gradient; rest stays plain
 *  - Sticky pin effect is REMOVED (too janky on mobile, replaced by a pinned center spine)
 */
export function StackedScenes() {
  const kyc = listSkills().find((s) => s.slug === "kyc")!;
  const kycSteps: WorkflowStep[] = kyc.steps.map((s, i) => ({
    id: s.id,
    label: s.label,
    detail: s.detail,
    tool: s.tool,
    icon: stepIconFor(s.iconKey),
    branches: i === kyc.steps.length - 1 ? kyc.branches : undefined,
  }));

  const scenes: Scene[] = [
    {
      verb: "Describe",
      title: "your agent",
      accent: "violet",
      body: "Natural-language instructions, not flowcharts. Pick the tools it can use. Pick the model. Every field is policy-checked before the agent is allowed to act.",
      right: <AgentBuilderDemo />,
    },
    {
      verb: "Orchestrate",
      title: "the runtime",
      accent: "teal",
      body: "The Runtime wires each step as a tool call with its own policy envelope. Branches fan out to Approve, Escalate, or Decline — every path auditable.",
      right: (
        <WorkflowVisualizer
          steps={kycSteps}
          orientation="vertical"
          header="KYC · 6 steps · 3 terminals"
          subheader="bacumen · runtime"
        />
      ),
    },
    {
      verb: "Execute",
      title: "with audit",
      accent: "lime",
      body: "The agent hands back an auditable artifact. Reasoning in plain English. Policy citations. Trace ID. Drafted for the reviewer — not a blob of JSON.",
      right: <LiveArtifactPanel artifact={kyc.artifact} />,
    },
  ];

  return (
    <section className="relative section-light overflow-hidden">
      {/* Intro */}
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 pt-20 lg:pt-28 pb-10 lg:pb-14">
        <div className="max-w-[680px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-divider bg-white px-3 py-1 text-mono text-muted mb-6">
            <Sparkles className="h-3.5 w-3.5 text-teal" />
            COMPLETE, UNIFIED PLATFORM
          </div>
          <h2 className="text-display-m lg:text-display-l text-ink leading-[1.05] tracking-[-0.015em]">
            <GradientVerb accent="violet">Describe.</GradientVerb>{" "}
            <GradientVerb accent="teal">Orchestrate.</GradientVerb>{" "}
            <GradientVerb accent="lime">Execute.</GradientVerb>
          </h2>
          <p className="text-body text-muted mt-5 max-w-[56ch]">
            Three steps, one runtime. Scroll to watch an agent get described in
            English, wired into a policy-aware workflow, and hand back a real
            audit-ready artifact.
          </p>
        </div>
      </div>

      {/* The spine */}
      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-10 pb-24 lg:pb-32">
        {/* center vertical line (hidden on mobile) */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[44px] lg:left-1/2 top-0 bottom-0 w-px"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent 0%, rgba(15,23,42,0.14) 8%, rgba(15,23,42,0.14) 92%, transparent 100%)",
          }}
        />

        <div className="flex flex-col gap-24 lg:gap-40">
          {scenes.map((scene, i) => (
            <SceneRow key={scene.verb} scene={scene} index={i} total={scenes.length} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Scene row — alternates which column the copy vs visual sits in,
// with a numbered orb on the center spine between them.
// ============================================================

type AccentKey = "teal" | "violet" | "lime";

type Scene = {
  verb: string;
  title: string;
  body: string;
  accent: AccentKey;
  right: React.ReactNode;
};

function SceneRow({
  scene,
  index,
}: {
  scene: Scene;
  index: number;
  total: number;
}) {
  // Alternate sides: scene 0 → copy on left; scene 1 → copy on right; scene 2 → copy on left
  const copyLeft = index % 2 === 0;
  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-16">
      {/* Numbered orb on the spine */}
      <SpineOrb n={index + 1} accent={scene.accent} />

      {/* COPY */}
      <div
        className={cn(
          "lg:col-span-5 relative z-10",
          copyLeft ? "lg:col-start-1" : "lg:col-start-8"
        )}
      >
        <h3 className="text-display-m lg:text-display-l text-ink leading-[1.05] tracking-[-0.02em] max-w-[14ch]">
          <GradientVerb accent={scene.accent}>{scene.verb}</GradientVerb>{" "}
          <span className="text-ink/90 font-normal">{scene.title}</span>
        </h3>
        <p className="text-body text-muted mt-5 max-w-[48ch]">{scene.body}</p>
      </div>

      {/* VISUAL */}
      <div
        className={cn(
          "lg:col-span-6 relative z-10",
          copyLeft ? "lg:col-start-7" : "lg:col-start-1 lg:row-start-1"
        )}
      >
        <ChromeFrame accent={scene.accent}>{scene.right}</ChromeFrame>
      </div>
    </div>
  );
}

// ============================================================
// Numbered orb on the spine (Decagon-style)
// ============================================================

function SpineOrb({ n, accent }: { n: number; accent: AccentKey }) {
  const palette: Record<AccentKey, { from: string; to: string; glow: string }> = {
    violet: {
      from: "from-[#A78BFA]",
      to: "to-[#6366F1]",
      glow: "shadow-[0_0_40px_rgba(139,116,250,0.45)]",
    },
    teal: {
      from: "from-[#2563eb]",
      to: "to-[#007264]",
      glow: "shadow-[0_0_40px_rgba(37, 99, 235,0.5)]",
    },
    lime: {
      from: "from-[#D9F99D]",
      to: "to-[#65A30D]",
      glow: "shadow-[0_0_40px_rgba(190,242,100,0.35)]",
    },
  };
  const p = palette[accent];
  return (
    <div
      aria-hidden
      className={cn(
        "hidden lg:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2",
        "h-12 w-12 rounded-full items-center justify-center z-20",
        "bg-gradient-to-br",
        p.from,
        p.to,
        p.glow
      )}
    >
      <span className="text-cream font-display text-h2 tracking-[-0.02em]">
        {n}
      </span>
      <span className="absolute inset-0 rounded-full border border-white/20" />
    </div>
  );
}

// ============================================================
// GradientVerb — the verb gets the accent gradient; rest stays plain
// ============================================================

function GradientVerb({
  accent,
  children,
}: {
  accent: AccentKey;
  children: React.ReactNode;
}) {
  // Darker endpoints so the gradient stays legible on a white section.
  const map: Record<AccentKey, string> = {
    violet: "from-[#8B5CF6] via-[#7C3AED] to-[#5B21B6]",
    teal:   "from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a]",
    lime:   "from-[#84CC16] via-[#65A30D] to-[#3F6212]",
  };
  return (
    <span
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent font-semibold",
        map[accent]
      )}
    >
      {children}
    </span>
  );
}

// ============================================================
// ChromeFrame — layered glow + stacked-card depth behind each visual
// ============================================================

function ChromeFrame({
  accent,
  children,
}: {
  accent: AccentKey;
  children: React.ReactNode;
}) {
  const tint: Record<AccentKey, string> = {
    violet: "bg-[radial-gradient(circle_at_30%_30%,rgba(139,116,250,0.18),transparent_60%)]",
    teal: "bg-[radial-gradient(circle_at_70%_30%,rgba(37, 99, 235,0.18),transparent_60%)]",
    lime: "bg-[radial-gradient(circle_at_30%_80%,rgba(190,242,100,0.14),transparent_60%)]",
  };
  return (
    <div className="relative">
      {/* ambient tint */}
      <div
        aria-hidden
        className={cn(
          "absolute -inset-12 pointer-events-none blur-2xl opacity-90",
          tint[accent]
        )}
      />
      {/* parallax-looking chrome rings — ink on white for subtle depth */}
      <div
        aria-hidden
        className="absolute -inset-5 rounded-[28px] border border-ink/5 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -inset-2.5 rounded-[24px] border border-ink/10 pointer-events-none"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

