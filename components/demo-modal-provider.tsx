"use client";

import * as React from "react";
import { RequestDemoModal } from "@/components/request-demo-modal";
import type { SkillSlug } from "@/lib/skills";

type OpenOpts = {
  /** Pre-select skill(s) of interest when opening. */
  skills?: SkillSlug[];
  /** Source tag for analytics (home-hero, skill-cta, pricing-enterprise, etc.). */
  source?: string;
};

type DemoCtx = {
  open: (opts?: OpenOpts) => void;
  close: () => void;
  isOpen: boolean;
  prefilledSkills: SkillSlug[];
  source: string;
};

const DemoModalContext = React.createContext<DemoCtx | null>(null);

export function useDemoModal(): DemoCtx {
  const ctx = React.useContext(DemoModalContext);
  if (!ctx) {
    throw new Error(
      "useDemoModal must be used within <DemoModalProvider>"
    );
  }
  return ctx;
}

export function DemoModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [prefilledSkills, setPrefilledSkills] = React.useState<SkillSlug[]>(
    []
  );
  const [source, setSource] = React.useState<string>("unknown");

  const open = React.useCallback((opts: OpenOpts = {}) => {
    setPrefilledSkills(opts.skills ?? []);
    setSource(opts.source ?? "unknown");
    setIsOpen(true);
  }, []);

  const close = React.useCallback(() => setIsOpen(false), []);

  // Global delegation: anything with data-demo-trigger opens the modal.
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest("[data-demo-trigger]");
      if (!trigger) return;
      e.preventDefault();
      const src = trigger.getAttribute("data-demo-source") ?? "cta";
      const skillAttr = trigger.getAttribute("data-demo-skill");
      const skills = skillAttr
        ? (skillAttr.split(",").map((s) => s.trim()).filter(Boolean) as SkillSlug[])
        : [];
      open({ skills, source: src });
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  return (
    <DemoModalContext.Provider
      value={{ open, close, isOpen, prefilledSkills, source }}
    >
      {children}
      <RequestDemoModal />
    </DemoModalContext.Provider>
  );
}
