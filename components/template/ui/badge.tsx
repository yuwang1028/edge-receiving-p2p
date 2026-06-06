import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Badge — small uppercase signal (status / category / tier).
 *
 * Template variant: pill-shaped (matches button language), soft borders.
 * @derived — capture-pending exact spec.
 */
type BadgeVariant = "default" | "solid" | "outline" | "warm";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-surface-cool text-ink",
  solid: "bg-ink text-ink-inverse",
  outline: "border border-ink text-ink bg-transparent",
  warm: "bg-surface-warm text-accent-deep",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        "h-[24px] px-3 rounded-full",
        "font-sans font-medium uppercase",
        "text-[11px] leading-[12px] tracking-[1.5px]",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
