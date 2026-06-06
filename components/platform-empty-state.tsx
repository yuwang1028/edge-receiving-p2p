"use client";

import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";

export function PlatformEmptyState() {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-4">
        <motion.span
          aria-hidden
          animate={
            reduce
              ? undefined
              : { y: [0, -4, 0], rotate: [0, 2, -2, 0] }
          }
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ink-cta/20 via-ink-cta/8 to-accent/15 text-ink-cta shadow-soft"
        >
          <Sparkles className="h-6 w-6" strokeWidth={1.6} />
        </motion.span>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="text-mono text-ink-cta mb-1">START HERE</div>
          <h2 className="text-h2 text-ink leading-tight">Pick your AI skill</h2>
          <p className="mt-1.5 text-body-s text-muted max-w-[44ch]">
            Click any skill on the left to see it activated against a mock
            workload.
          </p>
        </div>
      </div>
    </div>
  );
}
