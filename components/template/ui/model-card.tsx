import * as React from "react";
import { cn } from "@/lib/cn";
import { SubHeading, Body, Caption } from "@/components/template/ui/typography";
import { Button, ButtonArrow } from "@/components/template/ui/button";

/**
 * ModelCard — Template "Our models. Your business." section primitive.
 *
 * From WebFetch capture: 4 model entries on home page —
 *   Command · Transcribe · Embed · Rerank
 * Each has a name, tagline, 3 bullet points, and a "Learn more" CTA.
 *
 * Visual (derived): dark surface tile (deep navy or near-black), pill
 * label badge, slab heading, muted body bullets, light underline CTA.
 * @capture-pending exact bg, badge color, bullet treatment.
 */

export interface ModelCardProps {
  name: string;
  tagline: string;
  bullets: string[];
  ctaHref?: string;
  ctaText?: string;
  /** Surface tone — default "deep" matches the captured dark-tile pattern */
  tone?: "deep" | "navy" | "light";
  className?: string;
}

const TONE_CLASSES = {
  deep: "bg-surface-deep text-ink-inverse",
  navy: "bg-surface-navy text-ink-inverse",
  light: "bg-surface-cool text-ink",
} as const;

export function ModelCard({
  name,
  tagline,
  bullets,
  ctaHref = "#",
  ctaText = "Learn more",
  tone = "deep",
  className,
}: ModelCardProps) {
  const isDark = tone === "deep" || tone === "navy";
  return (
    <article
      className={cn(
        "flex h-full flex-col p-8 md:p-10",
        "rounded-[var(--radius-lg)]",
        TONE_CLASSES[tone],
        className
      )}
    >
      {/* Model badge */}
      <Caption
        className={cn(
          "uppercase tracking-[2px] font-medium",
          isDark ? "text-ink-inverse/70" : "text-mute"
        )}
      >
        {name}
      </Caption>

      <SubHeading
        as="h3"
        className={cn(
          "mt-4 max-w-[24ch]",
          isDark ? "text-ink-inverse" : ""
        )}
      >
        {tagline}
      </SubHeading>

      <ul className="mt-8 space-y-4 flex-1">
        {bullets.map((b, i) => (
          <li
            key={i}
            className={cn(
              "flex gap-3",
              "font-sans text-[15px] leading-[24px]",
              isDark ? "text-ink-inverse/80" : "text-mute"
            )}
          >
            <span
              className={cn(
                "mt-[10px] inline-block h-[4px] w-[4px] shrink-0 rounded-full",
                isDark ? "bg-accent" : "bg-ink"
              )}
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Button
          variant={isDark ? "primary-inverse" : "primary"}
          size="md"
          href={ctaHref}
        >
          {ctaText}
          <ButtonArrow className="ml-1" />
        </Button>
      </div>
    </article>
  );
}
