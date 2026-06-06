import * as React from "react";
import { cn } from "@/lib/cn";
import { SubHeading, Body, Eyebrow } from "@/components/template/ui/typography";

/**
 * Card — Template generic content card.
 *
 * Visual: soft-rounded corners (radius-lg), no border, optional 16:9
 * image at top, optional eyebrow + heading + body + CTA arrow.
 *
 * @derived from screenshot — soft 12-16px radius corners visible on
 * the dual-image hero illustrations and on inferred industry cards.
 */

export interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  imageUrl?: string;
  imageAlt?: string;
  placeholderClass?: string;
  eyebrow?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  href?: string;
  /** Tone of card surface — light / cool / warm / deep / navy */
  tone?: "light" | "cool" | "warm" | "deep" | "navy";
}

const TONE_CLASSES = {
  light: "bg-surface-light text-ink",
  cool: "bg-surface-cool text-ink",
  warm: "bg-surface-warm text-ink",
  deep: "bg-surface-deep text-ink-inverse",
  navy: "bg-surface-navy text-ink-inverse",
} as const;

export function Card({
  imageUrl,
  imageAlt = "",
  placeholderClass = "bg-surface-cool",
  eyebrow,
  title,
  body,
  href,
  tone = "light",
  className,
  ...props
}: CardProps) {
  const Wrapper = href ? "a" : "div";
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={cn(
        "group relative block w-full overflow-hidden",
        "rounded-[var(--radius-lg)]",
        TONE_CLASSES[tone],
        "transition-transform duration-[var(--duration-hover)] ease-[var(--ease-hover)]",
        href ? "hover:-translate-y-1" : "",
        "no-underline",
        className
      )}
      {...props}
    >
      {/* 16:9 image / placeholder */}
      <div className={cn("relative w-full aspect-[16/9]", imageUrl ? "" : placeholderClass)}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </div>

      {/* Content */}
      <div className="p-7 md:p-8">
        {eyebrow ? (
          <Eyebrow className={tone === "deep" || tone === "navy" ? "text-ink-inverse/70" : undefined}>
            {eyebrow}
          </Eyebrow>
        ) : null}
        <SubHeading
          as="h3"
          className={cn(
            "mt-4 max-w-[24ch]",
            tone === "deep" || tone === "navy" ? "text-ink-inverse" : ""
          )}
        >
          {title}
        </SubHeading>
        {body ? (
          <Body className={cn("mt-4 max-w-[44ch]", tone === "deep" || tone === "navy" ? "text-ink-inverse/80" : "")}>
            {body}
          </Body>
        ) : null}
      </div>
    </Wrapper>
  );
}
