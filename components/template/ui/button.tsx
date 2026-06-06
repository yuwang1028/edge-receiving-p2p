import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Button — Pill CTA tiers.
 *
 * CAPTURED from the captured template "Request a demo" computed styles (2026-05-03):
 *   background-color: rgb(23, 23, 28)   ← --ink-cta (slightly cool near-black)
 *   color:            rgb(255, 255, 255)
 *   border-radius:    9999px            ← pill confirmed
 *   padding:          12px 16px         ← TIGHTER than typical SaaS
 *   font-family:      Inter (their fallback)
 *   font-size:        16px
 *   font-weight:      400
 *   transition:       background-color 0.3s, color 0.3s
 *
 * Other variants (@derived from screenshot):
 *   - underline   "Explore products" — text + bottom underline
 *   - link        inline anchor with opacity hover
 *   - outline     ink-bordered transparent pill
 */

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap select-none",
    "font-sans font-medium",
    // captured: transition: background-color 0.3s, color 0.3s
    "transition-[background-color,color] duration-300 ease",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:pointer-events-none",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — captured rgb(23, 23, 28) bg, white text, pill.
        primary: [
          "rounded-full bg-ink-cta text-ink-inverse",
          "border-0",
          "hover:bg-[rgb(40,40,48)]",
        ].join(" "),
        // Inverse — solid white pill on dark surfaces.
        "primary-inverse": [
          "rounded-full bg-ink-inverse text-ink",
          "border-0",
          "hover:bg-[rgb(240,240,240)]",
        ].join(" "),
        // Underline — text with bottom underline. Used as the secondary
        // CTA next to a primary pill on the hero (e.g., "Explore products").
        underline: [
          "rounded-none bg-transparent text-ink",
          "border-0 px-0",
          "underline underline-offset-[6px] decoration-1",
          "hover:decoration-2",
        ].join(" "),
        // Inline link — no box, no underline, body-size opacity hover.
        link: [
          "rounded-none bg-transparent text-ink",
          "border-0 p-0",
          "no-underline",
          "hover:opacity-70",
        ].join(" "),
        // Outline pill — for less-emphatic primary actions.
        outline: [
          "rounded-full bg-transparent text-ink",
          "border border-ink",
          "hover:bg-ink hover:text-ink-inverse",
        ].join(" "),
      },
      size: {
        // Captured: padding 12px 16px / font 16px / weight 400 / line 24px
        // Total height = 12+24+12 = 48px. Hero CTA tier.
        lg: "py-3 px-4 text-[16px] leading-[24px] font-normal",
        // Default — most CTAs.
        md: "py-2.5 px-4 text-[15px] leading-[22px] font-normal",
        // Compact — nav-bar (slightly smaller padding).
        sm: "py-2 px-4 text-[14px] leading-[20px] font-normal",
        // Inline link — content-sized.
        link: "h-auto p-0 text-[16px] leading-[24px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
    compoundVariants: [
      { variant: "underline", size: "lg", className: "px-0" },
      { variant: "link", size: "link" },
    ],
  }
);

export interface ButtonProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "type">,
    VariantProps<typeof buttonVariants> {
  href?: string;
  /** When rendered as <button> (no href), HTML button type. */
  type?: "button" | "submit" | "reset";
}

export function Button({
  className,
  variant,
  size,
  href,
  children,
  ...props
}: ButtonProps) {
  const merged = cn(buttonVariants({ variant, size, className }));
  if (href) {
    return (
      <a href={href} className={merged} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button
      className={merged}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}

/**
 * ButtonArrow — small forward-pointing chevron for CTA emphasis.
 * Inferred from WebFetch ("CTA buttons with arrow indicators suggesting
 * forward motion"). Inline svg, inherits currentColor.
 */
export function ButtonArrow({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("inline-block", className)}
    >
      <path
        d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
