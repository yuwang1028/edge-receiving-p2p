"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { listSkills, type Skill } from "@/lib/skills";
import {
  WorkflowVisualizer,
  type WorkflowStep,
} from "@/components/workflow-visualizer";
import { stepIconFor, skillIconFor } from "@/components/skill-icon";

/**
 * Template-style pinned stack, refined:
 *  - Scenes alternate light / dark / light / dark for visual rhythm
 *  - Each scene pins below nav with an increasing offset so completed
 *    scenes collect into a stacked "tab" formation
 *  - Copy + chrome colors flip based on scene palette
 */
export function SkillsStack() {
  const skills = listSkills();

  return (
    <section className="relative">
      {skills.map((skill, i) => (
        <SkillScene
          key={skill.slug}
          skill={skill}
          index={i}
          total={skills.length}
        />
      ))}
    </section>
  );
}

type Palette = "navy" | "white" | "cream" | "navy-deep";

function SkillScene({
  skill,
  index,
  total,
}: {
  skill: Skill;
  index: number;
  total: number;
}) {
  const steps: WorkflowStep[] = React.useMemo(
    () =>
      skill.steps.map((s, i) => ({
        id: s.id,
        label: s.label,
        detail: s.detail,
        tool: s.tool,
        icon: stepIconFor(s.iconKey),
        branches: i === skill.steps.length - 1 ? skill.branches : undefined,
      })),
    [skill]
  );

  const Icon = skillIconFor(skill.slug);
  const verb = SKILL_VERBS[skill.slug];

  // Alternating rhythm — navy / white / cream / navy-deep.
  const palette: Palette = (["navy", "white", "cream", "navy-deep"] as const)[index] ?? "navy";
  const isDark = palette === "navy" || palette === "navy-deep";

  const bg: Record<Palette, string> = {
    navy: "bg-navy",
    "navy-deep": "bg-navy-800",
    white: "bg-white",
    cream: "bg-cream",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        bg[palette],
        // Small rounded top on all but the first scene to add gentle rhythm
        index > 0 && "rounded-t-[32px] -mt-8 z-10",
        isDark
          ? "border-t border-cream/10"
          : "border-t border-ink/8"
      )}
    >
      {/* Category title bar */}
      <div
        className={cn(
          "flex items-center gap-3 px-6 lg:px-10 h-14 border-b",
          isDark ? "border-cream/10" : "border-ink/10"
        )}
      >
        <div
          className={cn(
            "h-7 w-7 rounded-md grid place-items-center",
            isDark
              ? "bg-accent/15 text-accent"
              : "bg-ink-cta/10 text-teal"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span
          className={cn(
            "text-mono",
            isDark ? "text-accent/90" : "text-ink-cta"
          )}
        >
          {skill.category}
        </span>
        <span
          className={cn(
            "ml-auto text-mono",
            isDark ? "text-cream/40" : "text-ink/40"
          )}
        >
          0{index + 1} / 0{total}
        </span>
      </div>

      {/* Scene body */}
      <div className="relative">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 pt-12 pb-24 lg:pt-20 lg:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Copy column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h2
              className={cn(
                "text-display-l lg:text-[clamp(3.5rem,7vw,6.25rem)] leading-[0.95] tracking-[-0.03em] font-display font-bold",
                isDark ? "text-cream" : "text-ink"
              )}
            >
              {verb}
            </h2>
            <p
              className={cn(
                "text-h3 max-w-[44ch] font-normal leading-snug",
                isDark ? "text-cream/75" : "text-ink/80"
              )}
            >
              {skill.oneLiner}
            </p>
            <p
              className={cn(
                "text-body max-w-[48ch]",
                isDark ? "text-cream/55" : "text-muted"
              )}
            >
              {skill.sub}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Link
                href={`/skills/${skill.slug}`}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-teal text-white font-medium hover:bg-teal-600 transition-colors shadow-soft"
              >
                Explore {skill.shortName}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                data-demo-trigger
                data-demo-source={`skills-stack-${skill.slug}`}
                data-demo-skill={skill.slug}
                className={cn(
                  "h-11 px-4 rounded-xl border text-body-s transition-colors",
                  isDark
                    ? "border-cream/20 text-cream hover:bg-cream/5"
                    : "border-ink/15 text-ink hover:bg-ink/5"
                )}
              >
                Request a demo
              </button>
            </div>

            {/* Integration chips */}
            <div
              className={cn(
                "flex flex-wrap items-center gap-1.5 mt-4 pt-6 border-t",
                isDark ? "border-cream/10" : "border-ink/10"
              )}
            >
              <span
                className={cn(
                  "text-mono mr-1",
                  isDark ? "text-cream/40" : "text-muted"
                )}
              >
                INTEGRATIONS
              </span>
              {skill.integrationChips.map((chip) => (
                <span
                  key={chip}
                  className={cn(
                    "h-6 px-2 rounded-full border text-body-s",
                    isDark
                      ? "border-cream/15 text-cream/80"
                      : "border-ink/15 text-ink/80"
                  )}
                >
                  {chip}
                </span>
              ))}
              <span
                className={cn(
                  "text-body-s",
                  isDark ? "text-cream/40" : "text-muted"
                )}
              >
                +{totalIntegrations(skill) - skill.integrationChips.length}{" "}
                more
              </span>
            </div>
          </div>

          {/* Visual column — workflow + branches */}
          <div className="lg:col-span-7 relative">
            <div
              aria-hidden
              className={cn(
                "absolute -inset-5 rounded-[28px] border pointer-events-none",
                isDark ? "border-cream/5" : "border-ink/5"
              )}
            />
            <div
              aria-hidden
              className={cn(
                "absolute -inset-2.5 rounded-[24px] border pointer-events-none",
                isDark ? "border-cream/10" : "border-ink/10"
              )}
            />
            <WorkflowVisualizer
              steps={steps}
              orientation="vertical"
              header={`${skill.shortName} · ${skill.steps.length} steps · ${skill.branches?.length ?? 0} terminals`}
              subheader="bacumen · runtime"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const SKILL_VERBS: Record<string, string> = {
  kyc: "Secure.",
  finance: "Close.",
  hr: "Onboard.",
  erp: "Run.",
};

function totalIntegrations(skill: Skill): number {
  return skill.integrations.reduce((acc, g) => acc + g.items.length, 0);
}
