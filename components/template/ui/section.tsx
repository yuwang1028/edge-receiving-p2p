import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Section — vertical rhythm wrapper.
 *
 * CAPTURED from the captured template view-source — 4 distinct section padding
 * patterns observed:
 *
 *   1. Hero        → pt-28 md:pt-40 pb-12 md:pb-20    (112/160 top, 48/80 bot)
 *   2. Default     → pt-12 md:pt-20 pb-12 md:pb-20    (48/80 top + bot)
 *   3. Trust strip → px-4 lg:px-10 pb-10              (no top, just below hero)
 *   4. Deep        → pt-12 md:pt-20 pb-16 md:pb-36    (48/80 top, 64/144 bot)
 *
 * Tone variants:
 *   - light      → bg-pureWhite (white)
 *   - cool       → off-white panel
 *   - warm       → hint-warm panel
 *   - inverse    → bg-surface-inverse (black)
 *   - deep       → bg-surface-deep #2E2E2E (CAPTURED from inline style)
 *   - navy       → @derived mid-navy
 */

type Tone = "light" | "cool" | "warm" | "inverse" | "deep" | "navy";

const TONE_CLASSES: Record<Tone, string> = {
  light: "bg-pure-white text-ink",
  cool: "bg-surface-cool text-ink",
  warm: "bg-surface-warm text-ink",
  inverse: "bg-surface-inverse text-ink-inverse",
  deep: "bg-surface-deep text-ink-inverse",
  navy: "bg-surface-navy text-ink-inverse",
};

const PY_CLASSES = {
  default: "pt-12 md:pt-20 pb-12 md:pb-20",
  trust: "pb-10",
  deep: "pt-12 md:pt-20 pb-16 md:pb-36",
  generous: "pt-12 md:pt-20 pb-16 md:pb-36",
  tight: "pt-8 md:pt-12 pb-8 md:pb-12",
} as const;

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: Tone;
  /** Vertical padding pattern. Defaults match the captured template defaults. */
  py?: keyof typeof PY_CLASSES;
}

export function Section({
  tone = "light",
  py = "default",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "relative w-full",
        TONE_CLASSES[tone],
        "px-4 lg:px-10",   // captured horizontal padding
        PY_CLASSES[py],
        className
      )}
      {...props}
    >
      <div className="relative mx-auto w-full max-w-[1280px]">
        {children}
      </div>
    </section>
  );
}
