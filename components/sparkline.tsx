"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

/**
 * Minimal SVG sparkline with optional area fill and terminal dot.
 * When scrolled into view, the line draws in from left to right using
 * motion's pathLength, the area fades in, and the dot pops at the end.
 */
export function Sparkline({
  values,
  width = 120,
  height = 32,
  stroke = "var(--color-accent)",
  fill = true,
  showDot = true,
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: boolean;
  showDot?: boolean;
  className?: string;
}) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion() ?? false;
  const inView = useInView(svgRef, { once: true, amount: 0.4 });

  if (values.length < 2) return null;

  const pad = 2;
  const w = width;
  const h = height;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });

  const pathD = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const areaD = `${pathD} L ${points.at(-1)![0].toFixed(2)} ${h} L ${points[0]![0].toFixed(2)} ${h} Z`;

  const id = React.useId();
  const gradId = `spark-${id}`;
  const lastPoint = points.at(-1)!;

  // When reduced motion is on, skip the draw-in and show final state immediately.
  const active = reduced ? true : inView;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={areaD}
            fill={`url(#${gradId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: active ? 1 : 0 }}
            transition={{
              duration: reduced ? 0 : 0.8,
              delay: reduced ? 0 : 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </>
      )}
      <motion.path
        d={pathD}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: active ? 1 : 0 }}
        transition={{
          duration: reduced ? 0 : 1.4,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
      {showDot && (
        <motion.circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r="2.5"
          fill={stroke}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: active ? 1 : 0,
            scale: active ? 1 : 0,
          }}
          transition={{
            duration: reduced ? 0 : 0.35,
            delay: reduced ? 0 : 1.3,
            type: "spring",
            stiffness: 260,
            damping: 18,
          }}
          style={{ transformOrigin: `${lastPoint[0]}px ${lastPoint[1]}px` }}
        />
      )}
    </svg>
  );
}
