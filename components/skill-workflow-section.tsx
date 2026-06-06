"use client";

import * as React from "react";
import { WorkflowVisualizer, type WorkflowStep } from "@/components/workflow-visualizer";
import { LiveArtifactPanel } from "@/components/live-artifact-panel";
import { stepIconFor } from "@/components/skill-icon";
import type { Skill } from "@/lib/skills";

export function SkillWorkflowSection({ skill }: { skill: Skill }) {
  // Hydrate icon functions on the client (keeps lib/skills.ts server-safe).
  const stepsWithIcons: WorkflowStep[] = React.useMemo(() => {
    return skill.steps.map((s, i) => {
      const base: WorkflowStep = {
        id: s.id,
        label: s.label,
        detail: s.detail,
        tool: s.tool,
        icon: stepIconFor(s.iconKey),
      };
      // Attach branches to the final step only
      if (i === skill.steps.length - 1 && skill.branches) {
        base.branches = skill.branches;
      }
      return base;
    });
  }, [skill]);

  return (
    <section className="relative section-dark radial-teal grid-overlay grain-overlay py-20 lg:py-28 overflow-hidden">
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="max-w-[640px] mb-12 lg:mb-16">
          <div className="text-mono text-accent/90 mb-3">
            The workflow · {skill.steps.length} steps
            {skill.branches ? ` · ${skill.branches.length} terminals` : ""}
          </div>
          <h2 className="text-display-m text-cream">
            One instruction. One auditable trace.
          </h2>
          <p className="text-body text-cream/70 mt-3 max-w-[52ch]">
            Every step runs on the Bacumen Runtime — policy-checked, tool-
            scoped, and explainable. The output on the right is the artifact
            the agent hands back.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-5">
            <WorkflowVisualizer
              steps={stepsWithIcons}
              orientation="vertical"
              header={`${skill.shortName} · ${skill.steps.length} steps${skill.branches ? ` · ${skill.branches.length} terminals` : ""}`}
              subheader="bacumen · runtime"
            />
          </div>
          <div className="lg:col-span-7">
            <LiveArtifactPanel artifact={skill.artifact} />
          </div>
        </div>
      </div>
    </section>
  );
}
