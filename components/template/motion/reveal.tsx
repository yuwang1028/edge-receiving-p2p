"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Reveal — fade + translateY on viewport entry.
 *
 * Template animation aesthetic is soft — ~600ms with
 * cubic-bezier(0.16, 1, 0.3, 1) ease-out-expo, includes a subtle
 * vertical translate for kinetic feel (vs JLR's pure opacity-only).
 *
 * IntersectionObserver-driven, single-shot, honors prefers-reduced-motion.
 */

type AnyTag = React.ElementType;

export interface RevealProps {
  children: React.ReactNode;
  as?: AnyTag;
  delay?: number;
  threshold?: number;
  className?: string;
}

export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  threshold = 0.1,
  className,
}: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (delay > 0) {
              const t = window.setTimeout(() => setRevealed(true), delay);
              io.disconnect();
              return () => window.clearTimeout(t);
            }
            setRevealed(true);
            io.disconnect();
          }
        }
      },
      { threshold }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [delay, threshold]);

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      data-reveal=""
      data-revealed={revealed ? "true" : "false"}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
