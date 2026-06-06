"use client";

import * as React from "react";
import {
  Database,
  Wrench,
  ShieldCheck,
  Gauge,
  UserCheck,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/cn";

const MODULES = [
  { icon: Database, name: "Memory" },
  { icon: Wrench, name: "Tools" },
  { icon: ShieldCheck, name: "Policy" },
  { icon: Gauge, name: "Evals" },
  { icon: UserCheck, name: "HITL" },
  { icon: Activity, name: "Outcome" },
];

export function RuntimeDiagram() {
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % MODULES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {MODULES.map((m, i) => {
        const Icon = m.icon;
        const isActive = i === active;
        return (
          <div
            key={m.name}
            className={cn(
              "rounded-xl border p-3 flex items-center gap-2.5 transition-all duration-[var(--t-3)]",
              isActive
                ? "border-teal bg-ink-cta/10 shadow-dark-glow"
                : "border-cream/10 bg-navy-800/40"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-accent" : "text-cream/50"
              )}
            />
            <span
              className={cn(
                "text-body-s",
                isActive ? "text-cream" : "text-cream/60"
              )}
            >
              {m.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
