import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Typography — Template two-stack ladder.
 *
 * Captured signal (screenshot evidence):
 *   - Display tier ("Own your AI" hero) → SLAB-SERIF heavy (~104px),
 *     squared terminals, generous letter-spacing
 *   - Section heading → slab or sans, ~48-64px range
 *   - Body / sub copy → sans-serif (Inter substitute)
 *   - Eyebrow → small uppercase tracked
 *
 * Live capture pending — these specs are derived from screenshot
 * proportional analysis, not getComputedStyle.
 */

type DivProps = React.HTMLAttributes<HTMLElement>;

/**
 * Display — hero-tier heading. "Own your AI" anchor.
 *
 * CAPTURED from the captured template h1 computed styles (2026-05-03):
 *   font-family:    SpaceGrotesk → Space Grotesk → Inter → system
 *   font-size:      60px
 *   line-height:    60px (1.0 ratio — TIGHT)
 *   font-weight:    400 (regular, not bold)
 *   letter-spacing: -1.2px
 *   color:          rgb(33, 33, 33)
 */
export function Display({
  as: Comp = "h1",
  className,
  children,
  ...props
}: DivProps & { as?: "h1" | "h2" }) {
  return (
    <Comp
      className={cn(
        "font-display font-normal",
        // Captured 60px desktop. Mobile scaling for narrow viewports.
        "text-[44px] md:text-[60px]",
        "leading-[1] tracking-[-1.2px]",
        "text-ink",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

/**
 * SectionHeading — h2-tier. @derived (h2 was not captured; sized
 * proportionally between h1=60 and body=16). Uses display font stack.
 */
export function SectionHeading({
  as: Comp = "h2",
  className,
  children,
  ...props
}: DivProps & { as?: "h2" | "h3" }) {
  return (
    <Comp
      className={cn(
        "font-display font-normal",
        "text-[32px] md:text-[44px]",
        "leading-[1.1] tracking-[-0.5px]",
        "text-ink",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

/**
 * SubHeading — h3-tier. @derived.
 */
export function SubHeading({
  as: Comp = "h3",
  className,
  children,
  ...props
}: DivProps & { as?: "h3" | "h4" }) {
  return (
    <Comp
      className={cn(
        "font-display font-normal",
        "text-[22px] md:text-[26px]",
        "leading-[1.2] tracking-[-0.3px]",
        "text-ink",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

/**
 * Lead — large body intro paragraph. Sans-serif.
 */
export function Lead({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "font-sans font-normal",
        "text-[18px] md:text-[20px] leading-[1.6]",
        "text-mute",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Body — default paragraph. Sans 16/24.
 */
export function Body({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "font-sans font-normal",
        "text-[16px] leading-[24px]",
        "text-mute",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Eyebrow — small uppercase tracked label preceding section headings.
 */
export function Eyebrow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "font-sans font-medium uppercase",
        "text-[12px] leading-[16px] tracking-[2px]",
        "text-mute",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Caption — smallest text tier (12-14px), sans.
 */
export function Caption({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "font-sans font-normal",
        "text-[13px] leading-[18px]",
        "text-mute",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
