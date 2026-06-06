"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Big statistic callout (Decagon-style).
 * Counts up from 0 to the target on scroll into view.
 * If the value can't be parsed as a number, it just fades in.
 */
export function BigNumber({
  value,
  label,
  tone = "light",
  className,
}: {
  value: string;
  label: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState("");
  const [animated, setAnimated] = React.useState(false);

  const { numeric, prefix, suffix } = React.useMemo(
    () => parseValue(value),
    [value]
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || animated) continue;
          setAnimated(true);
          if (reduceMotion || numeric === null) {
            setShown(value);
            return;
          }
          const start = performance.now();
          const duration = 1280;
          const frame = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            // ease-out-cubic
            const eased = 1 - Math.pow(1 - t, 3);
            const current = numeric * eased;
            setShown(`${prefix}${formatNumber(current, numeric)}${suffix}`);
            if (t < 1) requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [animated, numeric, prefix, suffix, value]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 min-w-0",
        tone === "dark" ? "text-cream" : "text-ink",
        className
      )}
      style={{ containerType: "inline-size" }}
    >
      <div
        className={cn(
          "font-display font-bold leading-[0.92] tracking-[-0.04em] bg-clip-text text-transparent whitespace-nowrap overflow-hidden",
          // Container-query clamp: scales with the card's own width, not viewport.
          "text-[clamp(2.25rem,22cqi,4.5rem)]",
          tone === "dark"
            ? "bg-gradient-to-br from-teal-light via-teal-light to-teal"
            : "bg-gradient-to-br from-teal via-teal to-teal-600"
        )}
        aria-label={value}
      >
        {shown || value}
      </div>
      <div
        className={cn(
          "text-body-s max-w-[22ch]",
          tone === "dark" ? "text-cream/70" : "text-muted"
        )}
      >
        {label}
      </div>
    </div>
  );
}

function parseValue(raw: string): {
  numeric: number | null;
  prefix: string;
  suffix: string;
} {
  // Match something like "80%", "5×", "< 8s", "11", "2000+"
  const match = raw.match(/^(\D*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!match) return { numeric: null, prefix: "", suffix: "" };
  const [, prefix, numStr, suffix] = match;
  return { numeric: Number(numStr), prefix: prefix ?? "", suffix: suffix ?? "" };
}

function formatNumber(current: number, target: number): string {
  // Preserve integer-vs-decimal feel of target
  const isFloat = !Number.isInteger(target);
  if (isFloat) return current.toFixed(1);
  return Math.round(current).toString();
}
