"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

export type IndustryItem = {
  slug: string;
  label: string;
  src: string;
  alt: string;
  /** Tailwind gradient classes used as a fallback while the image loads or if missing. */
  fallback?: string;
};

/**
 * Horizontal scrolling strip of industry cards, Template-style.
 * - Native CSS scroll-snap for butter-smooth swipe on touch + trackpad
 * - Left/right arrow buttons, disabled at edges
 * - Progress bar at bottom tracks scroll position
 * - Keyboard: focus the strip then arrow keys scroll one card
 * - Respects prefers-reduced-motion (no smooth scroll)
 */
export function IndustriesCarousel({
  eyebrow = "INDUSTRIES",
  title,
  items,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  items: IndustryItem[];
  className?: string;
}) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [progress, setProgress] = React.useState(0);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(true);

  const updateState = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const p = max <= 0 ? 1 : el.scrollLeft / max;
    setProgress(p);
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
  }, []);

  React.useEffect(() => {
    updateState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState);
    return () => {
      el.removeEventListener("scroll", updateState);
      window.removeEventListener("resize", updateState);
    };
  }, [updateState]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll by ~one card width (first child's offsetWidth + gap)
    const first = el.firstElementChild as HTMLElement | null;
    const cardWidth = first?.offsetWidth ?? 480;
    const gap = 16; // matches `gap-4`
    el.scrollBy({
      left: dir * (cardWidth + gap),
      behavior: "smooth",
    });
  };

  return (
    <section
      className={cn("section-light py-20 lg:py-24", className)}
      aria-labelledby="industries-heading"
      // overflow-x-hidden on the root to prevent the scroller's overflowing
      // children from forcing a horizontal scrollbar on the page itself,
      // while the scroller internally still scrolls.
      style={{ overflowX: "clip" }}
    >
      {/* Header — widened anchor so title hugs closer to the viewport edge.
          The scroller below uses the same anchor so card 1 stays aligned. */}
      <div className="max-w-[1520px] mx-auto px-6 lg:px-10">
        <div
          className="flex items-end justify-between gap-6 mb-10"
          data-reveal="up"
        >
          <div>
            <div className="text-mono text-muted mb-3">{eyebrow}</div>
            <h2
              id="industries-heading"
              className="text-display-m lg:text-display-l text-ink leading-[1.02] tracking-[-0.02em] max-w-[22ch]"
            >
              {title}
            </h2>
          </div>
          {/* Nav arrows — hidden on mobile where you swipe */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={!canLeft}
              aria-label="Scroll industries left"
              className={cn(
                "h-10 w-10 rounded-full border border-divider inline-flex items-center justify-center",
                "transition-all duration-200 ease-[var(--ease-entrance)]",
                "hover:bg-ink/[0.04] hover:border-ink/25",
                "disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-divider"
              )}
            >
              <ArrowLeft className="h-4 w-4 text-ink" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={!canRight}
              aria-label="Scroll industries right"
              className={cn(
                "h-10 w-10 rounded-full border border-divider inline-flex items-center justify-center",
                "transition-all duration-200 ease-[var(--ease-entrance)]",
                "hover:bg-ink/[0.04] hover:border-ink/25",
                "disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-divider"
              )}
            >
              <ArrowRight className="h-4 w-4 text-ink" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrolling strip — Template-style 1:1:
          - Ghost spacer at start matches header's left inset, so card 1
            aligns with "Powering progress across industries."
          - Cards extend past the viewport right edge (natural overflow)
          - Scroll-snap targets ignore the leading ghost spacer */}
      <div
        ref={scrollerRef}
        role="region"
        aria-label="Industries"
        tabIndex={0}
        className={cn(
          "flex gap-4 overflow-x-auto snap-x snap-mandatory",
          "scrollbar-none pb-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-4"
        )}
        style={{
          scrollbarWidth: "none",
          // Tells scroll-snap where "start" should stop — aligns the snapped
          // card with the header's left edge rather than viewport 0.
          scrollPaddingLeft:
            "max(1.5rem, calc((100vw - 1520px) / 2 + 2.5rem))",
        }}
      >
        {/* Ghost spacer — occupies exactly the header's left inset.
            Not focusable, not snap-able. */}
        <div
          aria-hidden
          className="shrink-0"
          style={{
            width:
              "max(1.5rem, calc((100vw - 1520px) / 2 + 2.5rem - 1rem))",
          }}
        />
        {items.map((it, i) => (
          <IndustryCard key={it.slug} item={it} index={i} />
        ))}
        {/* Trailing ghost spacer so the last card can snap-end and not kiss
            the viewport edge after scrolling all the way right. */}
        <div
          aria-hidden
          className="shrink-0"
          style={{
            width:
              "max(1.5rem, calc((100vw - 1520px) / 2 + 2.5rem - 1rem))",
          }}
        />
      </div>

      {/* Progress bar — uses the same 1520 anchor for consistency */}
      <div className="max-w-[1520px] mx-auto px-6 lg:px-10">
        <div
          className="relative mt-8 h-[3px] bg-divider rounded-full overflow-hidden max-w-[320px] mx-auto"
          aria-hidden
        >
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal to-navy rounded-full transition-[width] duration-150 ease-out"
            style={{
              width: `${Math.max(12, progress * 100)}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}

function IndustryCard({ item, index }: { item: IndustryItem; index: number }) {
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  const fallback =
    item.fallback ??
    "bg-gradient-to-br from-navy-700 via-navy to-teal-600";

  return (
    <div
      className={cn(
        "relative shrink-0 snap-start snap-always",
        // Template-matched sizing (measured from their homepage):
        // Mobile: ~85vw (single card + small peek)
        // Tablet: ~58vw (two cards with peek)
        // Desktop: ~450px → 3 full cards + small peek of #4 on ≥1440 viewport
        //          (substantial, editorial feel, matches the template's visual weight)
        "w-[85vw] sm:w-[58vw] lg:w-[450px] aspect-[4/3]",
        "rounded-2xl overflow-hidden",
        fallback,
        // Subtle hover lift
        "group transition-transform duration-300 ease-[var(--ease-entrance)] hover:-translate-y-0.5"
      )}
      data-reveal="up"
      style={{ ["--reveal-delay" as string]: `${index * 70}ms` }}
    >
      {!imgError && (
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes="(max-width: 640px) 82vw, (max-width: 1024px) 55vw, 400px"
          className={cn(
            "object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-entrance)] group-hover:scale-[1.03]",
            imgLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
      )}
      {/* Top-left gradient scrim for label legibility */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/55 via-black/15 to-transparent pointer-events-none"
      />
      {/* Subtle noise over the fallback gradient when no image is present */}
      {imgError && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      )}
      <div className="absolute top-6 left-6 right-6 z-10">
        <div className="text-cream text-h2 lg:text-h1 font-display font-semibold tracking-[-0.015em] leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          {item.label}
        </div>
      </div>
    </div>
  );
}
