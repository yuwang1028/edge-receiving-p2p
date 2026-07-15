import * as React from "react";
import { BrainCircuit, Sparkles, Cog } from "lucide-react";
import { cn } from "@/lib/utils";
import { edgeApi, type EngineStep } from "@/lib/edgeApi";
import { useEdgeMode } from "@/lib/edgeMode";

/* Which engine/model runs a given step RIGHT NOW — rendered as a small chip so
 * the model-vs-rules boundary is visible everywhere. AI only extracts/assists;
 * the decisions (match, pay) are a deterministic rules engine — shown distinctly.
 * Keyed on the global mode: flip the sidebar switch and every badge re-reads. */

let cacheMode: string | null = null;
let cache: Promise<EngineStep[]> | null = null;
function loadSteps(mode: string): Promise<EngineStep[]> {
  if (cacheMode !== mode || !cache) {
    cacheMode = mode;
    cache = edgeApi.getEngines().then((e) => e.steps).catch(() => [] as EngineStep[]);
  }
  return cache;
}

const KIND = {
  "ai-extract": { cls: "border-surface-deep/25 bg-[color-mix(in_srgb,var(--surface-deep)_9%,white)] text-surface-deep", Icon: BrainCircuit },
  "ai-assist": { cls: "border-divider bg-surface-fog text-mute", Icon: Sparkles },
  rules: { cls: "border-surface-deep/15 bg-surface-mint/60 text-surface-deep", Icon: Cog },
} as const;

export function ModelBadge({ step, className }: { step: string; className?: string }) {
  const { mode } = useEdgeMode();
  const [s, setS] = React.useState<EngineStep | null>(null);
  React.useEffect(() => {
    let on = true;
    void loadSteps(mode).then((steps) => on && setS(steps.find((x) => x.step === step) ?? null));
    return () => {
      on = false;
    };
  }, [step, mode]);
  if (!s) return null;
  const { cls, Icon } = KIND[s.kind];
  return (
    <span
      title={s.note}
      className={cn("inline-flex items-center gap-1 text-[10.5px] font-medium border rounded-full px-2 py-0.5 whitespace-nowrap", cls, className)}
    >
      <Icon size={11} />
      {s.kind === "rules" ? "Rules · no model" : `${s.engine}${s.model ? ` · ${s.model}` : ""}`}
    </span>
  );
}
