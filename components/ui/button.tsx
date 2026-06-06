"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Legacy Button — kept for shadcn-imported callers (forms, modals, etc.).
 * Restyled to match the captured pill primitive in
 * `components/template/ui/button.tsx`:
 *   - rounded-full pill
 *   - bg-ink-cta primary, hover bg-[rgb(40,40,48)]
 *   - 300ms ease transition on background-color + color
 *   - no transform on hover (per template discipline)
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "font-sans font-medium",
    "transition-[background-color,color] duration-300 ease",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:pointer-events-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "rounded-full bg-ink-cta text-ink-inverse hover:bg-[rgb(40,40,48)]",
        secondary:
          "rounded-full bg-pure-white text-ink border border-ink/15 hover:border-ink",
        ghost:
          "rounded-full bg-transparent text-ink hover:bg-ink/[0.04]",
        link:
          "rounded-none bg-transparent text-ink underline-offset-[6px] decoration-1 hover:underline px-0 h-auto",
        outlineOnDark:
          "rounded-full bg-transparent text-ink-inverse border border-ink-inverse/30 hover:bg-ink-inverse/10",
      },
      size: {
        sm: "h-9 px-4 text-[14px] leading-[20px]",
        md: "h-11 px-5 text-[15px] leading-[22px]",
        lg: "h-12 px-6 text-[16px] leading-[24px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
