import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { skillIconFor } from "@/components/skill-icon";
import type { Skill } from "@/lib/skills";

/**
 * SkillsLibraryCard — minimal card for the Skills index.
 *
 * Strips back to the essentials: icon mark, skill label, headline,
 * three numbers, an arrow. No status bars, no artifact previews,
 * no integration chips, no metadata footers — just the spine.
 */

export interface SkillsLibraryCardProps {
  skill: Skill;
  tone?: "deep" | "navy";
  className?: string;
}

const TONES = {
  deep: {
    surface: "bg-[#161618]",
    border: "border-white/[0.06]",
    borderHover: "group-hover:border-white/[0.14]",
    text: "text-white",
    mute: "text-white/55",
    iconTile:
      "bg-white/[0.04] ring-white/[0.08]",
    arrow: "bg-white/[0.04] ring-white/[0.10] text-white/70 group-hover:bg-white group-hover:ring-white group-hover:text-ink",
    divider: "border-white/[0.06]",
  },
  navy: {
    surface: "bg-[#101733]",
    border: "border-white/[0.07]",
    borderHover: "group-hover:border-white/[0.16]",
    text: "text-white",
    mute: "text-white/60",
    iconTile:
      "bg-white/[0.05] ring-white/[0.10]",
    arrow: "bg-white/[0.05] ring-white/[0.12] text-white/70 group-hover:bg-white group-hover:ring-white group-hover:text-ink",
    divider: "border-white/[0.08]",
  },
} as const;

export function SkillsLibraryCard({
  skill,
  tone = "deep",
  className,
}: SkillsLibraryCardProps) {
  const t = TONES[tone];
  const Icon = skillIconFor(skill.slug);

  return (
    <Link
      href={`/skills/${skill.slug}`}
      aria-label={`${skill.name} — ${skill.oneLiner}`}
      className={cn(
        "group relative flex h-full flex-col",
        "rounded-[20px] border",
        t.surface,
        t.border,
        t.borderHover,
        "no-underline overflow-hidden",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-[2px]",
        "hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]",
        "active:scale-[0.99] active:duration-75",
        className,
      )}
    >
      {/* Header — icon + label + arrow */}
      <div className="flex items-start justify-between gap-4 px-9 pt-9 md:px-10 md:pt-10">
        <div className="flex items-center gap-3.5">
          <div
            className={cn(
              "grid h-11 w-11 place-items-center rounded-xl ring-1",
              t.iconTile,
            )}
          >
            <Icon className="h-5 w-5 text-accent" aria-hidden />
          </div>
          <span
            className={cn(
              "font-mono text-[11px] uppercase tracking-[1.6px] font-medium",
              t.mute,
            )}
          >
            {skill.shortName}
          </span>
        </div>
        <div
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full ring-1",
            "transition-all duration-300 ease-out",
            t.arrow,
          )}
        >
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" aria-hidden />
        </div>
      </div>

      {/* Headline */}
      <h3
        className={cn(
          "mt-10 px-9 md:px-10 font-display font-normal",
          "text-[28px] md:text-[32px] leading-[1.15] tracking-[-0.5px]",
          "max-w-[20ch]",
          t.text,
        )}
      >
        {skill.oneLiner}
      </h3>

      {/* Three numbers — bare */}
      <div className="mt-auto grid grid-cols-3 gap-4 px-9 pt-12 pb-9 md:px-10 md:pb-10">
        {skill.bigNumbers.map((m, i) => (
          <div key={i} className="flex flex-col gap-2 min-w-0">
            <span
              className={cn(
                "font-display font-normal",
                "text-[26px] md:text-[28px] leading-[1] tracking-[-0.4px]",
                "tabular-nums",
                t.text,
              )}
            >
              {m.value}
            </span>
            <span
              className={cn(
                "font-sans text-[11.5px] leading-[15px] whitespace-nowrap",
                t.mute,
              )}
            >
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </Link>
  );
}
