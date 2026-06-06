"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { Integration } from "@/lib/integrations";
import { listSkills } from "@/lib/skills";
import { BrandLogo } from "@/components/brand-logo";

const statusColor: Record<Integration["status"], string> = {
  live: "bg-ink-cta",
  beta: "bg-amber-500",
  roadmap: "bg-muted",
};

const statusLabel: Record<Integration["status"], string> = {
  live: "Live",
  beta: "Beta",
  roadmap: "Roadmap",
};

const skillNames = Object.fromEntries(
  listSkills().map((s) => [s.slug, s.shortName])
) as Record<string, string>;

export function IntegrationLogo({ integration }: { integration: Integration }) {
  return (
    <div
      className={cn(
        "group relative h-[120px] rounded-xl border border-divider bg-white overflow-hidden",
        "transition-all duration-[var(--t-3)] hover:shadow-soft hover:border-ink/15"
      )}
    >
      {/* Front face — real brand logo + small name underneath */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 transition-opacity duration-[var(--t-3)] group-hover:opacity-0">
        <BrandLogo
          name={integration.name}
          domain={integration.domain}
          size={44}
          className="rounded-md"
        />
        <span className="text-body-s text-ink/80 text-center leading-tight tracking-[-0.005em] max-w-full truncate">
          {integration.name}
        </span>
        <span
          aria-label={statusLabel[integration.status]}
          className={cn(
            "absolute bottom-2 right-2 h-2 w-2 rounded-full",
            statusColor[integration.status]
          )}
        />
      </div>

      {/* Hover face */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between bg-navy text-cream opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[var(--t-3)]">
        <div>
          <div className="text-mono text-accent/80 mb-1">
            {statusLabel[integration.status]}
          </div>
          <div className="text-body font-semibold">{integration.name}</div>
        </div>
        <div>
          <div className="text-mono text-cream/50 mb-1">Used by</div>
          <div className="flex flex-wrap gap-1">
            {integration.usedBy.map((s) => (
              <span
                key={s}
                className="px-1.5 py-0.5 rounded border border-ink-cta/30 text-body-s text-cream/90"
              >
                {skillNames[s] ?? s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
