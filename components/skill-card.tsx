"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Skill, SkillSlug } from "@/lib/skills";
import { skillIconFor } from "@/components/skill-icon";
import { BrandChip } from "@/components/brand-logo";
import { domainForBrand } from "@/lib/integrations";

/**
 * Per-skill icon tile color. Each skill gets a distinct accent so the
 * grid reads as a palette, not a monochrome block. Colors are hand-tuned
 * to feel professional on the Bacumen navy/teal canvas.
 */
const SKILL_TONE: Record<SkillSlug, { tile: string; icon: string }> = {
  kyc:     { tile: "bg-[#cffaf4]", icon: "text-[#00877a]" }, // teal — compliance
  finance: { tile: "bg-[#fef3c7]", icon: "text-[#92400e]" }, // amber — money
  hr:      { tile: "bg-[#ede9fe]", icon: "text-[#6d28d9]" }, // violet — people
  erp:     { tile: "bg-[#e0e7ff]", icon: "text-[#3730a3]" }, // indigo — operations
};

export function SkillCard({ skill }: { skill: Skill }) {
  const Icon = skillIconFor(skill.slug);
  const tone = SKILL_TONE[skill.slug];
  const [hovered, setHovered] = React.useState(false);

  // Compact preview — the first 3 workflow steps, pulsing through.
  const previewSteps = skill.steps.slice(0, 3);
  const [preview, setPreview] = React.useState(0);
  React.useEffect(() => {
    if (!hovered) return;
    const id = setInterval(() => setPreview((i) => (i + 1) % previewSteps.length), 900);
    return () => clearInterval(id);
  }, [hovered, previewSteps.length]);

  return (
    <Link
      href={`/skills/${skill.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPreview(0);
      }}
      className={cn(
        // h-full lets the grid row stretch all cards to the tallest one
        "group h-full flex flex-col gap-4 rounded-2xl border border-divider bg-white p-6 transition-all duration-[var(--t-3)] ease-[var(--ease-entrance)]",
        "hover:-translate-y-0.5 hover:shadow-soft hover:border-ink/15"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-lg grid place-items-center",
              tone.tile,
              tone.icon
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="text-mono text-muted">{skill.category}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[var(--t-3)]" />
      </div>

      <div>
        <div className="text-h2 text-ink mb-1">{skill.shortName}</div>
        <p className="text-body-s text-muted leading-relaxed">
          {skill.oneLiner}
        </p>
      </div>

      {/* Mini pipeline preview */}
      <div className="mt-auto flex items-center gap-2 pt-2">
        {previewSteps.map((step, i) => {
          const active = hovered && i === preview;
          const completed = hovered && i < preview;
          return (
            <div
              key={step.id}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-all duration-[var(--t-3)]",
                active
                  ? "bg-ink-cta"
                  : completed
                  ? "bg-ink-cta/40"
                  : "bg-divider"
              )}
            />
          );
        })}
        <span className="text-mono text-muted tabular-nums">
          {String(preview + 1).padStart(2, "0")}/{String(skill.steps.length).padStart(2, "0")}
        </span>
      </div>

      {/* Integration chips — real brand logos */}
      <div className="flex flex-wrap gap-1.5">
        {skill.integrationChips.map((chip) => (
          <BrandChip
            key={chip}
            name={chip}
            domain={domainForBrand(chip)}
            tone="light"
          />
        ))}
        <span className="h-7 px-2 rounded-full text-body-s text-muted inline-flex items-center">
          +{flatIntegrationCount(skill) - skill.integrationChips.length} more
        </span>
      </div>
    </Link>
  );
}

function flatIntegrationCount(skill: Skill): number {
  return skill.integrations.reduce((acc, g) => acc + g.items.length, 0);
}
