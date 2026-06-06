"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { SectionHeading, Body, Caption } from "@/components/template/ui/typography";
import { Button, ButtonArrow } from "@/components/template/ui/button";

/**
 * Newsletter — "AI moves fast" signup section.
 *
 * From WebFetch capture (verbatim):
 *   Heading: "AI moves fast"
 *   Body: "We'll keep you up to date with the latest."
 *   Form note: "Enter your business email below to receive updates from
 *     Template. Please refer to our privacy policy for details or to
 *     contact us. You can unsubscribe at any time."
 *
 * Visual (derived): centered headline + body, single-line email input
 * with inline submit button, fine-print disclaimer below.
 */

export interface NewsletterProps {
  heading?: string;
  body?: string;
  disclaimer?: string;
  buttonText?: string;
  className?: string;
}

const DEFAULT_DISCLAIMER =
  "Enter your business email below to receive updates from Template. Please refer to our privacy policy for details or to contact us. You can unsubscribe at any time.";

export function Newsletter({
  heading = "AI moves fast",
  body = "We'll keep you up to date with the latest.",
  disclaimer = DEFAULT_DISCLAIMER,
  buttonText = "Subscribe",
  className,
}: NewsletterProps) {
  const [email, setEmail] = React.useState("");

  return (
    <div className={cn("mx-auto max-w-[640px] text-center", className)}>
      <SectionHeading>{heading}</SectionHeading>
      <Body className="mt-6 max-w-[44ch] mx-auto">{body}</Body>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          // No-op in preview — refine on capture for real endpoint.
        }}
        className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@business.email"
          className={cn(
            "h-[48px] flex-1 px-5 rounded-full",
            "bg-surface-light border border-divider",
            "font-sans text-[15px] leading-[24px] text-ink",
            "placeholder:text-mute",
            "transition-colors duration-[var(--duration-hover)] ease-[var(--ease-hover)]",
            "focus:outline-none focus:border-ink"
          )}
        />
        <Button variant="primary" size="lg" type="submit">
          {buttonText}
          <ButtonArrow className="ml-1" />
        </Button>
      </form>

      <Caption className="mt-6 block max-w-[60ch] mx-auto text-mute">
        {disclaimer}
      </Caption>
    </div>
  );
}
