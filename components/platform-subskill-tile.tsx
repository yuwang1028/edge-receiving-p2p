"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { stepIconFor } from "@/components/skill-icon";
import type { SubSkill } from "@/lib/platform-subskills";
import type { ParentAccent } from "@/components/platform-skill-picker";

type Props = {
  subSkill: SubSkill;
  selected: boolean;
  dimmed?: boolean;
  accent: ParentAccent;
  onClick: () => void;
};

export function PlatformSubSkillTile({
  subSkill,
  selected,
  dimmed,
  accent,
  onClick,
}: Props) {
  const Icon = stepIconFor(subSkill.iconKey);
  // Auto-shrink label when it would wrap to 2 lines
  const len = subSkill.name.length;
  const labelSize = len > 22 ? "text-[12.5px]" : len > 17 ? "text-[13.5px]" : "text-[14px]";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "group relative isolate flex flex-col items-start gap-3 overflow-hidden rounded-xl border bg-white px-4 py-4 text-left",
        // Layered shadow — hairline + crisp drop
        "shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_1px_2px_0_rgba(33,33,33,0.04)]",
        "transition-[transform,border-color,background-color,box-shadow] duration-[var(--t-2)] ease-[var(--ease-entrance)]",
        "hover:-translate-y-[1px] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_2px_4px_0_rgba(33,33,33,0.05),0_10px_24px_-12px_rgba(33,33,33,0.16)]",
        "active:scale-[0.97] active:duration-75",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        selected
          ? cn(
              "border-2",
              accent.border,
              accent.bgSoft,
              accent.ringSoft,
            )
          : cn(
              "border-ink/[0.07]",
              accent.borderHover,
            ),
        !selected && dimmed && "opacity-55 hover:opacity-100",
      )}
    >
      {/* Hover-only soft accent corner glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-0 transition-opacity duration-[var(--t-3)] group-hover:opacity-100 [background-image:radial-gradient(60%_60%_at_100%_0%,rgba(37, 99, 235,0.06),transparent_70%)]"
      />
      <span
        aria-hidden
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl shrink-0",
          "bg-gradient-to-br from-ink-cta/[0.10] to-ink-cta/[0.02]",
          "ring-1 ring-ink/[0.05]",
          "shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset]",
          "transition-transform duration-[var(--t-2)] group-hover:scale-[1.04]",
        )}
      >
        {Icon ? <Icon className="h-[22px] w-[22px] text-ink-cta" strokeWidth={1.6} /> : null}
      </span>
      <span
        className={cn(
          "font-medium leading-snug text-ink line-clamp-2",
          labelSize,
        )}
      >
        {subSkill.name}
      </span>
    </button>
  );
}
