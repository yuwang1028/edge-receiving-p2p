"use client";

import * as React from "react";
import {
  integrationCategories,
  integrations,
  type IntegrationCategory,
} from "@/lib/integrations";
import { IntegrationLogo } from "@/components/integration-logo";
import { cn } from "@/lib/cn";

export function IntegrationsGrid() {
  const [active, setActive] = React.useState<IntegrationCategory | "all">("all");

  const filtered = React.useMemo(
    () =>
      active === "all"
        ? integrations
        : integrations.filter((i) => i.category === active),
    [active]
  );

  return (
    <div>
      <div
        className="flex flex-wrap gap-1.5 mb-8"
        role="tablist"
        aria-label="Filter integrations by category"
      >
        {integrationCategories.map((c) => {
          const isActive = c.key === active;
          return (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "h-9 px-3 rounded-full border text-body-s transition-all duration-[var(--t-2)]",
                isActive
                  ? "bg-ink text-white border-ink"
                  : "bg-white text-ink border-divider hover:border-ink/40"
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((integration) => (
          <IntegrationLogo key={integration.slug} integration={integration} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-body-s text-muted py-12 text-center">
          No integrations in this category yet.
        </div>
      )}
    </div>
  );
}
