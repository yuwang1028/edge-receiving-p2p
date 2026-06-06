"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/cn";
import { skillIconFor } from "@/components/skill-icon";
import { listSubSkillsByParent } from "@/lib/platform-subskills";
import type { Skill } from "@/lib/skills";
import type { ParentAccent } from "@/components/platform-skill-picker";
import { PlatformSubSkillTile } from "@/components/platform-subskill-tile";

const PAGE_SIZE = 6;

type Props = {
  skill: Skill;
  accent: ParentAccent;
  collapsed: boolean;
  selectedSubSkillId: string | null;
  dimNonSelected: boolean;
  onPick: (id: string) => void;
  /** Called when the user clicks the card header — used to expand a
   *  collapsed card back into focus. Optional; if not provided the
   *  header is non-interactive. */
  onHeaderClick?: () => void;
};

export function PlatformParentCard({
  skill,
  accent,
  collapsed,
  selectedSubSkillId,
  dimNonSelected,
  onPick,
  onHeaderClick,
}: Props) {
  const Icon = skillIconFor(skill.slug);
  const subs = React.useMemo(
    () => listSubSkillsByParent(skill.slug),
    [skill.slug],
  );
  const totalPages = Math.max(1, Math.ceil(subs.length / PAGE_SIZE));
  const [page, setPage] = React.useState(0);

  // If selected sub-skill is on a different page, jump to it.
  React.useEffect(() => {
    if (!selectedSubSkillId) return;
    const idx = subs.findIndex((s) => s.id === selectedSubSkillId);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / PAGE_SIZE);
    setPage(targetPage);
  }, [selectedSubSkillId, subs]);

  const visible = subs.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const headerInteractive = collapsed && Boolean(onHeaderClick);

  return (
    <article
      className={cn(
        "group/card relative isolate overflow-hidden",
        "rounded-[var(--radius-lg)] border border-ink/[0.08] bg-white",
        // Layered shadow — hairline + soft inner highlight + outer drop
        "shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_1px_2px_0_rgba(33,33,33,0.04),0_8px_24px_-12px_rgba(33,33,33,0.10)]",
        "transition-[box-shadow,border-color,transform] duration-[var(--t-3)]",
        "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_2px_4px_0_rgba(33,33,33,0.05),0_18px_40px_-16px_rgba(33,33,33,0.16)]",
        "hover:border-ink/[0.14]",
      )}
    >
      {/* Top accent rail — live status anchor */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-cta/20 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-[0.7] [background-image:radial-gradient(120%_60%_at_100%_0%,rgba(37, 99, 235,0.04),transparent_55%)]"
      />

      <header
        role={headerInteractive ? "button" : undefined}
        tabIndex={headerInteractive ? 0 : undefined}
        onClick={headerInteractive ? onHeaderClick : undefined}
        onKeyDown={
          headerInteractive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onHeaderClick?.();
                }
              }
            : undefined
        }
        aria-expanded={headerInteractive ? !collapsed : undefined}
        className={cn(
          "relative z-10 flex items-center justify-between gap-3 px-5 pt-5 pb-4",
          headerInteractive &&
            "cursor-pointer select-none rounded-[var(--radius-lg)] hover:bg-cream/40 transition-[background-color] duration-[var(--t-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-cta/30",
        )}
      >
        <div className="flex items-center gap-4 min-w-0">
          <span
            aria-hidden
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-2xl shrink-0",
              "bg-gradient-to-br from-ink-cta/[0.10] to-ink-cta/[0.02]",
              "ring-1 ring-ink/[0.06]",
              "shadow-[0_1px_0_0_rgba(255,255,255,0.8)_inset]",
              "transition-transform duration-[var(--t-2)] group-hover/card:scale-[1.03]",
            )}
          >
            <Icon className="h-7 w-7 text-ink-cta" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="font-display text-[20px] leading-[1.15] tracking-[-0.3px] text-ink truncate">
                {skill.shortName}
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5",
                  "border border-emerald-500/20 bg-emerald-500/[0.06]",
                )}
              >
                <span className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.18)]" />
                <span className="font-mono text-[9.5px] uppercase tracking-[1.2px] font-medium text-emerald-700">
                  Live
                </span>
              </span>
            </div>
            {collapsed ? (
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[1.4px] text-mute truncate">
                {subs.length} sub-skills · click to expand
              </div>
            ) : (
              <div className="mt-1 text-body-s text-muted truncate max-w-[36ch]">
                {skill.oneLiner}
              </div>
            )}
          </div>
        </div>
        {!collapsed && totalPages > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="font-mono text-[10.5px] uppercase tracking-[1.4px] text-mute mr-1 tabular-nums">
              {page + 1}/{totalPages}
            </span>
            <PageArrow
              direction="prev"
              onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
              accent={accent}
            />
            <PageArrow
              direction="next"
              onClick={() => setPage((p) => (p + 1) % totalPages)}
              accent={accent}
            />
          </div>
        )}
        {collapsed && headerInteractive && (
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/[0.10] bg-white text-ink-cta shadow-[0_1px_2px_rgba(33,33,33,0.04)]"
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        )}
      </header>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="grid"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-ink/[0.06] px-5 pt-4 pb-5 bg-[linear-gradient(180deg,rgba(241, 245, 249,0.4)_0%,transparent_100%)]">
              <div
                key={`page-${page}`}
                className="grid grid-cols-3 gap-2.5"
              >
                {visible.map((sub) => (
                  <PlatformSubSkillTile
                    key={sub.id}
                    subSkill={sub}
                    selected={selectedSubSkillId === sub.id}
                    dimmed={
                      dimNonSelected && selectedSubSkillId !== sub.id
                    }
                    accent={accent}
                    onClick={() => onPick(sub.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function PageArrow({
  direction,
  onClick,
  accent,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  accent: ParentAccent;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        direction === "prev" ? "Previous skills" : "Next skills"
      }
      className={cn(
        "h-8 w-8 grid place-items-center rounded-lg border border-divider bg-white",
        "transition-[transform,border-color,background-color] duration-[var(--t-2)]",
        "hover:bg-cream",
        accent.borderHover,
        "active:scale-[0.92] active:duration-75",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
      )}
    >
      <Icon className="h-4 w-4 text-ink" />
    </button>
  );
}
