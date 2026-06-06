import * as React from "react";
import { cn } from "@/lib/cn";
import { SubHeading } from "@/components/template/ui/typography";

/**
 * IndustryCard — "Powering progress across industries" section primitive.
 *
 * Layout:
 *   - 4:5 photo tile, square-rounded corners
 *   - Title bottom-left INSIDE the photo (white on bottom-up scrim)
 *   - "Learn more" underline link BELOW the photo (black text)
 *   - Hover: photo zoom 105%, slight darken, card lifts 1px,
 *     underline thickens (decoration-1 → decoration-2)
 */

export interface IndustryCardProps {
  name: string;
  href?: string;
  imageUrl?: string;
  placeholderClass?: string;
  ctaText?: string;
  className?: string;
}

export function IndustryCard({
  name,
  href = "#",
  imageUrl,
  placeholderClass = "bg-gradient-to-br from-surface-navy to-surface-deep",
  ctaText = "Learn more",
  className,
}: IndustryCardProps) {
  return (
    <a
      href={href}
      className={cn(
        "group block w-full no-underline text-ink",
        "transition-transform duration-300 ease",
        "hover:-translate-y-1",
        className
      )}
      aria-label={name}
    >
      {/* Photo tile — title sits inside at bottom-left. */}
      <div
        className={cn(
          "relative overflow-hidden",
          "aspect-[4/5]",
          "rounded-[var(--radius-lg)]"
        )}
      >
        {/* Image / placeholder */}
        <div
          className={cn(
            "absolute inset-0 overflow-hidden",
            imageUrl ? "" : placeholderClass
          )}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className={cn(
                "h-full w-full object-cover",
                "transition-transform duration-500 ease",
                "group-hover:scale-105"
              )}
            />
          ) : null}
          {/* Bottom-up scrim so the white title stays legible on bright
              photos (healthcare lab coat, manufacturing white robotics).
              10% floor across the rest unifies the five exposures. */}
          <div
            className={cn(
              "absolute inset-0",
              "bg-gradient-to-t from-black/85 via-black/40 to-black/10"
            )}
          />
          {/* Extra hover-only darken layer for click feedback. */}
          <div
            className={cn(
              "absolute inset-0 bg-black/0",
              "transition-[background-color] duration-300 ease",
              "group-hover:bg-black/20"
            )}
          />
        </div>

        {/* Title bottom-left — owns full card width, no chip to collide with. */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
          <SubHeading
            as="h3"
            className={cn(
              "text-ink-inverse",
              "[text-shadow:0_2px_8px_rgb(0_0_0_/_0.55)]",
              // On the narrow 2-col mobile grid a long single word
              // ("Manufacturing") overran the card and was clipped. Shrink the
              // label + allow a break below sm only; ≥sm keeps 22/26px.
              "max-sm:text-[16px] max-sm:tracking-[-0.2px] max-sm:break-words"
            )}
          >
            {name}
          </SubHeading>
        </div>
      </div>

      {/* Learn more — BELOW the card, black text + underline.
          Indented slightly so the link visually anchors to the card's
          bottom-left padding column rather than the card edge. */}
      <span
        className={cn(
          "mt-4 ml-2 md:ml-3 inline-block",
          "font-sans text-[14px] font-medium leading-[20px] text-ink",
          "underline underline-offset-[6px] decoration-1",
          "transition-[text-decoration-thickness] duration-300 ease",
          "group-hover:decoration-2"
        )}
      >
        {ctaText}
      </span>
    </a>
  );
}
