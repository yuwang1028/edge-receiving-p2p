import * as React from "react";
import { cn } from "@/lib/cn";
import { Body, Caption } from "@/components/template/ui/typography";
import { Button, ButtonArrow } from "@/components/template/ui/button";

/**
 * Testimonial — Template customer quote tile (e.g., Fujitsu spotlight).
 *
 * From WebFetch capture: home page features Fujitsu testimonial with
 * Tokyo Tower aerial photo + quote + attribution + "Read more" CTA.
 *
 * Layout: side-by-side row, image on one side, dark surface card with
 * quote on the other.
 *
 * @derived — capture-pending exact dimensions and dark surface choice.
 */

export interface TestimonialProps {
  quote: string;
  attribution: string;
  attributionRole?: string;
  ctaText?: string;
  ctaHref?: string;
  imageUrl?: string;
  imageAlt?: string;
  placeholderClass?: string;
  /** Image side */
  align?: "left" | "right";
  className?: string;
}

export function Testimonial({
  quote,
  attribution,
  attributionRole,
  ctaText = "Read more",
  ctaHref = "#",
  imageUrl,
  imageAlt = "",
  placeholderClass = "bg-gradient-to-br from-surface-navy to-surface-deep",
  align = "left",
  className,
}: TestimonialProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10",
        "rounded-[var(--radius-lg)] overflow-hidden",
        className
      )}
    >
      {/* Image / placeholder */}
      <div
        className={cn(
          "relative w-full min-h-[420px]",
          align === "right" ? "lg:order-2" : "",
          imageUrl ? "" : placeholderClass
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </div>

      {/* Quote card — dark surface */}
      <div
        className={cn(
          "flex flex-col justify-between p-10 md:p-12",
          "bg-surface-deep text-ink-inverse",
          align === "right" ? "lg:order-1" : ""
        )}
      >
        <div>
          <Caption className="uppercase tracking-[2px] font-medium text-ink-inverse/70">
            Customer
          </Caption>
          <blockquote
            className={cn(
              "mt-6 font-slab font-medium",
              "text-[24px] md:text-[28px] leading-[1.2] tracking-[-0.01em]",
              "text-ink-inverse max-w-[40ch]"
            )}
          >
            &ldquo;{quote}&rdquo;
          </blockquote>
        </div>

        <div className="mt-10">
          <p className="font-sans text-[15px] font-medium text-ink-inverse">
            — {attribution}
          </p>
          {attributionRole ? (
            <Body className="mt-1 text-ink-inverse/70">{attributionRole}</Body>
          ) : null}
          <div className="mt-8">
            <Button variant="primary-inverse" size="md" href={ctaHref}>
              {ctaText}
              <ButtonArrow className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
