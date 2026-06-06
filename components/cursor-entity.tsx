"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * A small teal cursor that can be positioned anywhere inside its nearest
 * positioned ancestor. Use `x` / `y` in pixels (or pass `target` ref).
 */
export function CursorEntity({
  x,
  y,
  className,
  visible = true,
  variant = "teal",
}: {
  x: number;
  y: number;
  className?: string;
  visible?: boolean;
  /** "teal" = dark-card context; "ink" = white-card context */
  variant?: "teal" | "ink";
}) {
  const fill = variant === "ink" ? "#0F172A" : "#2563eb";
  const stroke = variant === "ink" ? "#FFFFFF" : "#0A1F44";
  const glow =
    variant === "ink"
      ? "drop-shadow(0 2px 6px rgba(15,23,42,0.35))"
      : "drop-shadow(0 2px 6px rgba(37, 99, 235,0.6))";
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={cn(
        "pointer-events-none absolute z-30 h-4 w-4 transition-all ease-[var(--ease-spring-ish)] drop-shadow",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transitionDuration: "var(--t-4)",
        filter: glow,
      }}
    >
      <path
        d="M2 2 L14 8 L8 9 L6 15 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
