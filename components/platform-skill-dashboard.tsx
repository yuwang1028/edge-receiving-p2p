"use client";

import * as React from "react";
import { TrendingUp, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/sparkline";
import { stepIconFor } from "@/components/skill-icon";
import type { SubSkill, SubSkillStat, SubSkillStatus } from "@/lib/platform-subskills";
import type { ParentAccent } from "@/components/platform-skill-picker";

type Props = {
  subSkill: SubSkill;
  parentName: string;
  accent: ParentAccent;
  onRequestDemo: () => void;
};

export function PlatformSkillDashboard({
  subSkill,
  parentName,
  accent,
  onRequestDemo,
}: Props) {
  const Icon = stepIconFor(subSkill.iconKey);
  return (
    <div className="flex h-full flex-col gap-4">
      {/* Top — title + accent dot */}
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shrink-0",
            accent.gradFrom,
            accent.gradTo,
            accent.text,
          )}
        >
          {Icon ? <Icon className="h-6 w-6" strokeWidth={1.7} /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <div className={cn("text-mono mb-1", accent.text)}>
            {parentName.toUpperCase()}
          </div>
          <h3 className="text-h2 text-ink leading-tight truncate">
            {subSkill.name}
          </h3>
          <p className="mt-1 text-body-s text-muted">
            {subSkill.description}
          </p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        {subSkill.stats.map((stat, idx) => (
          <DashboardStat
            key={idx}
            stat={stat}
            accent={accent}
            icon={idx === 0 ? Activity : TrendingUp}
          />
        ))}
      </div>

      {/* Worklist */}
      <div className="flex-1 overflow-hidden rounded-[var(--radius-lg)] border border-divider bg-white">
        <div className="flex items-center justify-between border-b border-divider px-4 py-2.5">
          <div className="text-mono text-muted">LIVE WORKLIST</div>
          <div className="text-body-s text-muted tabular-nums">
            {subSkill.worklist.length} items
          </div>
        </div>
        <ol className="divide-y divide-divider">
          {subSkill.worklist.map((item, idx) => (
            <WorklistRow
              key={item.id}
              index={idx + 1}
              label={item.label}
              status={item.status}
              accent={accent}
            />
          ))}
        </ol>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-body-s text-muted max-w-[44ch]">
          See this skill on your enterprise system.
        </p>
        <Button
          size="lg"
          onClick={onRequestDemo}
          className="active:scale-[0.96] active:duration-75"
        >
          Request demo
        </Button>
      </div>
    </div>
  );
}

function DashboardStat({
  stat,
  accent,
  icon: Icon,
}: {
  stat: SubSkillStat;
  accent: ParentAccent;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const reduce = useReducedMotion();
  const sign = stat.deltaPct == null ? null : stat.deltaPct >= 0 ? "up" : "down";
  return (
    <div className="rounded-[var(--radius-lg)] border border-divider bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span
          aria-hidden
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br",
            accent.gradFrom,
            accent.gradTo,
            accent.text,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        {sign && (
          <span
            className={cn(
              "inline-flex items-center gap-1 h-6 px-2 rounded-full text-mono border tabular-nums",
              sign === "up"
                ? "bg-ink-cta/10 text-ink-cta border-ink-cta/25"
                : "bg-accent/15 text-ink border-accent/40",
            )}
          >
            {sign === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(stat.deltaPct ?? 0)}%
          </span>
        )}
      </div>
      <div>
        <motion.div
          key={stat.value}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="text-display-m text-ink leading-[0.95] tracking-[-0.03em] tabular-nums"
        >
          {stat.value}
        </motion.div>
        <div className="text-body-s text-muted mt-1">{stat.label}</div>
      </div>
      <Sparkline
        values={stat.spark}
        width={160}
        height={28}
        stroke="var(--color-ink-cta)"
      />
    </div>
  );
}

function WorklistRow({
  index,
  label,
  status,
  accent,
}: {
  index: number;
  label: string;
  status: SubSkillStatus;
  accent: ParentAccent;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <span
          aria-hidden
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-mono shrink-0",
            status === "done"
              ? "bg-ink-cta/10 text-ink-cta"
              : status === "running"
                ? cn(accent.bgSoft, accent.text)
                : "bg-cream text-muted border border-divider",
          )}
        >
          {status === "done" ? "✓" : index}
        </span>
        <span className="truncate text-body-s text-ink">{label}</span>
      </div>
      <StatusPill status={status} />
    </li>
  );
}

function StatusPill({ status }: { status: SubSkillStatus }) {
  const cfg = {
    done: { label: "Done", cls: "bg-ink-cta/10 text-ink-cta border-ink-cta/25" },
    running: {
      label: "Running",
      cls: "bg-accent/15 text-ink border-accent/40 platform-pulse",
    },
    queued: {
      label: "Queued",
      cls: "bg-cream text-muted border-divider",
    },
  } as const;
  const c = cfg[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-6 px-2 rounded-full text-mono border tabular-nums shrink-0",
        c.cls,
      )}
    >
      {status === "running" && (
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
      )}
      {c.label}
    </span>
  );
}
