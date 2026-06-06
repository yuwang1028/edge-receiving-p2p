"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

type HeroVariant = "default" | "editorial";

/**
 * Hand-tuned twinkle field — 20 dots at asymmetric positions so the sky
 * doesn't read as a grid. Coordinates are % of hero bounding box.
 */
const TWINKLE_DOTS: ReadonlyArray<{
  top: string;
  left: string;
  size: number;
  dur: number;
  delay: number;
}> = [
  { top: "12%", left: "8%",  size: 2,   dur: 4.2, delay: 0.0 },
  { top: "18%", left: "22%", size: 1,   dur: 3.1, delay: 1.4 },
  { top: "9%",  left: "38%", size: 1.5, dur: 5.0, delay: 0.7 },
  { top: "24%", left: "55%", size: 1,   dur: 3.8, delay: 2.1 },
  { top: "7%",  left: "72%", size: 2,   dur: 4.6, delay: 0.3 },
  { top: "15%", left: "88%", size: 1,   dur: 3.4, delay: 1.8 },
  { top: "32%", left: "4%",  size: 1,   dur: 3.9, delay: 2.5 },
  { top: "40%", left: "30%", size: 1.5, dur: 4.8, delay: 0.9 },
  { top: "48%", left: "66%", size: 1,   dur: 3.3, delay: 1.6 },
  { top: "36%", left: "92%", size: 2,   dur: 5.2, delay: 0.2 },
  { top: "58%", left: "12%", size: 1,   dur: 3.6, delay: 2.8 },
  { top: "62%", left: "44%", size: 1.5, dur: 4.4, delay: 1.1 },
  { top: "70%", left: "78%", size: 1,   dur: 3.2, delay: 2.3 },
  { top: "76%", left: "18%", size: 2,   dur: 4.7, delay: 0.5 },
  { top: "82%", left: "50%", size: 1,   dur: 3.5, delay: 1.9 },
  { top: "88%", left: "82%", size: 1.5, dur: 4.1, delay: 1.3 },
  { top: "28%", left: "68%", size: 1,   dur: 3.7, delay: 2.6 },
  { top: "54%", left: "86%", size: 1,   dur: 4.0, delay: 0.8 },
  { top: "44%", left: "15%", size: 1,   dur: 3.3, delay: 2.0 },
  { top: "66%", left: "62%", size: 1.5, dur: 4.5, delay: 0.6 },
];

function TwinkleField() {
  return (
    <div aria-hidden className="hero-twinkle absolute inset-0 pointer-events-none z-[1]">
      {TWINKLE_DOTS.map((d, i) => (
        <span
          key={i}
          className="twinkle-dot"
          style={
            {
              top: d.top,
              left: d.left,
              width: `${d.size}px`,
              height: `${d.size}px`,
              ["--twinkle-dur" as string]: `${d.dur}s`,
              ["--twinkle-delay" as string]: `${d.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * Build motion variants for the staggered entrance.
 * When reduced motion is on, everything fades simultaneously with no transforms.
 */
function useHeroVariants(reduced: boolean) {
  return React.useMemo(() => {
    const container: Variants = {
      hidden: {},
      show: {
        transition: reduced
          ? { staggerChildren: 0 }
          : { staggerChildren: 0.1, delayChildren: 0.05 },
      },
    };
    const item: Variants = reduced
      ? {
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { duration: 0.3 } },
        }
      : {
          hidden: { opacity: 0, y: 8 },
          show: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 180, damping: 22, mass: 0.9 },
          },
        };
    const right: Variants = reduced
      ? {
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { duration: 0.3, delay: 0.1 } },
        }
      : {
          hidden: { opacity: 0, scale: 0.97, y: 12 },
          show: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: "spring", stiffness: 140, damping: 24, mass: 1, delay: 0.42 },
          },
        };
    return { container, item, right };
  }, [reduced]);
}

export function Hero({
  eyebrow,
  title,
  sub,
  ctas,
  rightContent,
  className,
  containerClassName,
  eyebrowAsPill = true,
  variant = "default",
  belowContent,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  ctas?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  eyebrowAsPill?: boolean;
  variant?: HeroVariant;
  belowContent?: React.ReactNode;
}) {
  const reduced = useReducedMotion() ?? false;
  const { container, item, right } = useHeroVariants(reduced);

  if (variant === "editorial") {
    return (
      <section
        className={cn(
          "relative overflow-hidden section-dark grid-overlay grain-overlay hero-aurora pt-[150px] pb-20 lg:pt-[180px] lg:pb-24",
          className
        )}
      >
        <div aria-hidden className="absolute inset-0 mesh-ambient pointer-events-none" />
        <TwinkleField />
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className={cn(
            "relative z-10 max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end",
            containerClassName
          )}
        >
          <div className="lg:col-span-7 flex flex-col gap-8">
            {eyebrow && (
              <motion.div variants={item}>
                {eyebrowAsPill ? (
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cream/15 bg-cream/5 backdrop-blur-sm px-3 py-1 text-mono text-cream/85">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    {eyebrow}
                  </div>
                ) : (
                  <div className="text-mono text-accent/90">{eyebrow}</div>
                )}
              </motion.div>
            )}
            <motion.h1
              variants={item}
              className="text-cream leading-[1.0] tracking-[-0.025em] font-display font-bold text-[clamp(2.5rem,5vw,4.5rem)]"
            >
              {title}
            </motion.h1>
            {sub && (
              <motion.p
                variants={item}
                className="text-h3 text-cream/65 max-w-[56ch] font-normal"
              >
                {sub}
              </motion.p>
            )}
            {ctas && (
              <motion.div
                variants={item}
                className="flex flex-wrap items-center gap-3 mt-2"
              >
                {ctas}
              </motion.div>
            )}
          </div>
          {rightContent && (
            <motion.div variants={right} className="lg:col-span-5 w-full">
              {rightContent}
            </motion.div>
          )}
        </motion.div>
        {belowContent && (
          <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-10 mt-16">
            {belowContent}
          </div>
        )}
      </section>
    );
  }

  // default variant
  return (
    <section
      className={cn(
        "relative overflow-hidden section-dark radial-teal grid-overlay grain-overlay hero-aurora pt-[152px] pb-20 lg:pt-[192px] lg:pb-28",
        className
      )}
    >
      <TwinkleField />
      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
        className={cn(
          "relative z-10 max-w-[1200px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start",
          containerClassName
        )}
      >
        <div className="lg:col-span-6 flex flex-col gap-6">
          {eyebrow && (
            <motion.div variants={item}>
              {eyebrowAsPill ? (
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cream/15 bg-cream/5 backdrop-blur-sm px-3 py-1 text-mono text-cream/80">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  {eyebrow}
                </div>
              ) : (
                <div className="text-mono text-accent/90">{eyebrow}</div>
              )}
            </motion.div>
          )}
          <motion.h1
            variants={item}
            className="text-display-l lg:text-display-xl text-cream max-w-[20ch] leading-[0.98] tracking-[-0.025em]"
          >
            {title}
          </motion.h1>
          {sub && (
            <motion.p
              variants={item}
              className="text-h3 text-cream/70 max-w-[58ch] font-normal"
            >
              {sub}
            </motion.p>
          )}
          {ctas && (
            <motion.div
              variants={item}
              className="flex flex-wrap items-center gap-3 mt-2"
            >
              {ctas}
            </motion.div>
          )}
        </div>
        {rightContent && (
          <motion.div variants={right} className="lg:col-span-6 w-full">
            {rightContent}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
