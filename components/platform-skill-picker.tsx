"use client";

import * as React from "react";
import { Sparkles, ArrowLeft, Wand2 } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { listSkills, type Skill, type SkillSlug } from "@/lib/skills";
import { getSubSkill } from "@/lib/platform-subskills";
import { DemoForm } from "@/components/demo-form";
import { PlatformParentCard } from "@/components/platform-parent-card";
import { PlatformEmptyState } from "@/components/platform-empty-state";
import { PlatformSkillDashboard } from "@/components/platform-skill-dashboard";

export type ParentAccent = {
  bg: string;
  bgSoft: string;
  border: string;
  borderHover: string;
  text: string;
  gradFrom: string;
  gradTo: string;
  ringSoft: string;
};

/*
 * PARENT_ACCENT — template-style monochrome with single warm-orange
 * accent across all 4 parents. Selected state is ink-cta (template
 * primary CTA color) for visual consistency with the rest of the site.
 * Per-parent color differentiation is dropped — the parent name +
 * icon carry identity, not the chrome.
 */
const PARENT_ACCENT: Record<SkillSlug, ParentAccent> = {
  kyc: {
    bg: "bg-ink-cta",
    bgSoft: "bg-ink-cta/[0.06]",
    border: "border-ink-cta",
    borderHover: "hover:border-ink-cta/40",
    text: "text-ink-cta",
    gradFrom: "from-ink-cta/15",
    gradTo: "to-ink-cta/[0.02]",
    ringSoft: "ring-ink-cta/10",
  },
  finance: {
    bg: "bg-ink-cta",
    bgSoft: "bg-ink-cta/[0.06]",
    border: "border-ink-cta",
    borderHover: "hover:border-ink-cta/40",
    text: "text-ink-cta",
    gradFrom: "from-ink-cta/15",
    gradTo: "to-ink-cta/[0.02]",
    ringSoft: "ring-ink-cta/10",
  },
  hr: {
    bg: "bg-ink-cta",
    bgSoft: "bg-ink-cta/[0.06]",
    border: "border-ink-cta",
    borderHover: "hover:border-ink-cta/40",
    text: "text-ink-cta",
    gradFrom: "from-ink-cta/15",
    gradTo: "to-ink-cta/[0.02]",
    ringSoft: "ring-ink-cta/10",
  },
  erp: {
    bg: "bg-ink-cta",
    bgSoft: "bg-ink-cta/[0.06]",
    border: "border-ink-cta",
    borderHover: "hover:border-ink-cta/40",
    text: "text-ink-cta",
    gradFrom: "from-ink-cta/15",
    gradTo: "to-ink-cta/[0.02]",
    ringSoft: "ring-ink-cta/10",
  },
};

const PARENT_ORDER: SkillSlug[] = ["kyc", "finance", "hr", "erp"];

type Mode = "browse" | "demo";

const landingContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const landingItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export function PlatformSkillPicker() {
  const skills = React.useMemo(() => {
    const map = new Map(listSkills().map((s) => [s.slug, s] as const));
    return PARENT_ORDER.map((slug) => map.get(slug)!).filter(Boolean) as Skill[];
  }, []);

  const [selectedSubSkillId, setSelectedSubSkillId] = React.useState<string | null>(null);
  const [filterParent, setFilterParent] = React.useState<SkillSlug | null>(null);
  const [mode, setMode] = React.useState<Mode>("browse");
  const [demoSubmitted, setDemoSubmitted] = React.useState(false);

  const selectedSub = selectedSubSkillId ? getSubSkill(selectedSubSkillId) : undefined;
  const selectedParent = selectedSub
    ? skills.find((s) => s.slug === selectedSub.parent)
    : undefined;
  const selectedAccent = selectedSub ? PARENT_ACCENT[selectedSub.parent] : null;

  const reset = React.useCallback(() => {
    setSelectedSubSkillId(null);
    setFilterParent(null);
    setMode("browse");
    setDemoSubmitted(false);
  }, []);

  return (
    <section className="bg-cream">
      <motion.div
        className="mx-auto max-w-[1320px] px-6 lg:px-10 pt-[96px] pb-10 lg:pt-[112px] lg:pb-12"
        variants={landingContainer}
        initial="hidden"
        animate="show"
      >
        {/* Header strip */}
        <motion.div
          variants={landingItem}
          className={cn(
            "rounded-[var(--radius-lg)] border border-divider px-6 py-6 lg:px-8 lg:py-7 mb-6",
            "bg-[linear-gradient(135deg,#eff6ff_0%,#f1f5f9_55%,#f8fafb_100%)]",
            "shadow-soft",
          )}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="text-mono text-ink-cta mb-2">THE BACUMEN PLATFORM</div>
              <h1 className="text-display-m text-ink leading-[1.05] tracking-[-0.02em]">
                Pick a Skill. Activate it on your stack.
              </h1>
              <p className="mt-2 text-body text-muted max-w-[60ch]">
                Build your AI skill on your stack.
              </p>
            </div>
            <button
              type="button"
              data-demo-trigger
              data-demo-source="platform-ask-bacumen"
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border-2 border-ink-cta/30 bg-white px-4",
                "text-body-s text-ink-cta font-medium",
                "transition-[transform,border-color,background-color] duration-[var(--t-2)]",
                "hover:border-ink-cta hover:bg-ink-cta/5",
                "active:scale-[0.96] active:duration-75",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-cta/30",
              )}
            >
              <Sparkles className="h-4 w-4" />
              Ask Bacumen
            </button>
          </div>

          {/* Chip row */}
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <ChipButton
              label="All"
              selected={filterParent === null}
              onClick={() => setFilterParent(null)}
            />
            {skills.map((s) => {
              const accent = PARENT_ACCENT[s.slug];
              const selected = filterParent === s.slug;
              return (
                <ChipButton
                  key={s.slug}
                  label={s.shortName}
                  selected={selected}
                  accent={accent}
                  onClick={() =>
                    setFilterParent(filterParent === s.slug ? null : s.slug)
                  }
                />
              );
            })}
            <span aria-hidden className="mx-1 h-5 w-px bg-divider" />
            <button
              type="button"
              data-demo-trigger
              data-demo-source="platform-customize"
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-dashed border-ink-cta/40 px-3.5",
                "border-ink-cta/40 bg-white text-body-s font-medium text-ink-cta",
                "transition-[transform,border-color,background-color] duration-[var(--t-2)]",
                "hover:border-ink-cta hover:bg-ink-cta/5",
                "active:scale-[0.96] active:duration-75",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-cta/30",
              )}
            >
              <Wand2 className="h-3.5 w-3.5" />
              Customize
            </button>
          </div>
        </motion.div>

        {/* Body — split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <motion.div variants={landingItem} className="flex flex-col gap-3 min-w-0">
            <AnimatePresence mode="wait">
              {mode === "browse" || demoSubmitted ? (
                <motion.div
                  key="picker"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  {skills.map((skill) => {
                    const accent = PARENT_ACCENT[skill.slug];
                    const collapsed =
                      filterParent !== null && filterParent !== skill.slug;
                    return (
                      <PlatformParentCard
                        key={skill.slug}
                        skill={skill}
                        accent={accent}
                        collapsed={collapsed}
                        selectedSubSkillId={selectedSubSkillId}
                        dimNonSelected={
                          selectedSub != null &&
                          selectedSub.parent === skill.slug
                        }
                        onPick={(id) => {
                          setSelectedSubSkillId(id);
                          setMode("browse");
                          setDemoSubmitted(false);
                        }}
                        onHeaderClick={() => {
                          // Click a collapsed card → make it the active filter
                          // (its grid expands; the previously-expanded one
                          // collapses). Click again on the now-expanded one
                          // → clear filter, all cards expand.
                          setFilterParent((current) =>
                            current === skill.slug ? null : skill.slug,
                          );
                        }}
                      />
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="demo"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[var(--radius-lg)] border border-divider bg-white p-6 shadow-soft"
                >
                  <button
                    type="button"
                    onClick={() => setMode("browse")}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-body-s text-muted mb-4",
                      "hover:text-ink transition-colors",
                      "active:scale-[0.96] active:duration-75",
                    )}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to skills
                  </button>
                  <div className="text-mono text-ink-cta mb-2">
                    REQUEST A DEMO
                  </div>
                  <h2 className="text-h2 text-ink mb-1">
                    See {selectedSub?.name ?? "this skill"} on your stack.
                  </h2>
                  <p className="text-body-s text-muted mb-5 max-w-[44ch]">
                    A 20-minute working session on your real cases. No sales blitz.
                  </p>
                  <DemoForm
                    variant="inline"
                    defaultSkills={
                      selectedSub ? [selectedSub.parent] : []
                    }
                    source="platform-skill-picker"
                    onSuccess={() => setDemoSubmitted(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {demoSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="rounded-[var(--radius-lg)] border border-ink-cta/30 bg-ink-cta/[0.04] p-5 flex items-start gap-3"
              >
                <div className="text-mono text-ink-cta mt-0.5">THANKS</div>
                <div className="flex-1">
                  <div className="text-body text-ink font-medium">
                    We&apos;ll be in touch within 1 business day.
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className={cn(
                      "mt-2 text-body-s text-ink-cta hover:underline",
                      "active:scale-[0.96] active:duration-75",
                    )}
                  >
                    Pick another skill →
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right column — always sizes to its content (matches reference image, never stretches to left column height) */}
          <motion.div
            variants={landingItem}
            className={cn(
              "rounded-[var(--radius-lg)] border border-divider bg-white shadow-soft",
              "flex flex-col p-5 lg:p-6 self-start",
            )}
          >
            <AnimatePresence mode="wait">
              {!selectedSub || !selectedAccent || !selectedParent ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <PlatformEmptyState />
                </motion.div>
              ) : (
                <motion.div
                  key={selectedSub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full"
                >
                  <PlatformSkillDashboard
                    subSkill={selectedSub}
                    parentName={selectedParent.shortName}
                    accent={selectedAccent}
                    onRequestDemo={() => setMode("demo")}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

function ChipButton({
  label,
  selected,
  accent,
  onClick,
}: {
  label: string;
  selected: boolean;
  accent?: ParentAccent;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "h-9 px-3.5 rounded-full border text-body-s font-medium",
        "transition-[transform,background-color,border-color,color] duration-[var(--t-2)]",
        "active:scale-[0.96] active:duration-75",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        selected && accent
          ? cn(accent.bg, "text-white border-transparent shadow-soft")
          : selected
            ? "bg-ink text-white border-ink shadow-soft"
            : "bg-white text-ink border-divider hover:border-ink/40",
      )}
    >
      {label}
    </button>
  );
}
