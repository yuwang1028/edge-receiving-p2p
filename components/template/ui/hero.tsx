import * as React from "react";
import { cn } from "@/lib/cn";
import { Display, Lead } from "@/components/template/ui/typography";

/**
 * Hero — Template centered hero pattern.
 *
 * CAPTURED 1:1 from the captured template view-source:
 *
 *   <section class="relative w-full px-4 pt-28 md:pt-40 pb-12
 *     md:pb-20 text-black">
 *     <div class="relative z-content mx-auto w-full
 *       max-w-web3-internal-wrapper">
 *       <div class="text-center">
 *         <div class="motion-safe:opacity-0
 *           motion-safe:animate-[fadeInUp_0.5s_forwards_ease-in-out]">
 *           [headline]
 *         </div>
 *         <div class="mx-auto flex motion-safe:opacity-0
 *           motion-safe:animate-[fadeInUp_0.5s_forwards_0.1s_ease-in-out]
 *           justify-center items-center">
 *           [body]
 *         </div>
 *         <div class="flex flex-col gap-4 motion-safe:opacity-0 sm:flex-row
 *           sm:items-center motion-safe:animate-[fadeInUp_0.5s_forwards_0.2s_ease-in-out]
 *           justify-center items-center">
 *           [cta cluster]
 *         </div>
 *       </div>
 *     </div>
 *   </section>
 *
 * Real values:
 *   - pt-28 md:pt-40 (112px / 160px top — large hero buffer for fixed nav)
 *   - pb-12 md:pb-20 (48px / 80px bottom)
 *   - text-black (true #000)
 *   - max-w-web3-internal-wrapper (template container — translated to
 *     max-w-[1280px] in this preview; real value @capture-pending)
 *   - text-center
 *   - 3-tier fadeInUp stagger: 0s / 0.1s / 0.2s · 0.5s ease-in-out
 */

export interface HeroProps {
  headline: string;
  body?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Hero({
  headline,
  body,
  children,
  className,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative w-full bg-pure-white",
        "px-4",
        "pt-28 md:pt-40",         // captured
        "pb-12 md:pb-20",         // captured
        "text-ink",
        className
      )}
    >
      <div className="relative mx-auto w-full max-w-[1280px]">
        <div className="text-center">
          {/* fadeInUp stagger 0s — captured */}
          <div className="animate-fade-in-up">
            <Display as="h1">{headline}</Display>
          </div>

          {body ? (
            <div className="mx-auto flex animate-fade-in-up-delay-100 justify-center items-center">
              <Lead className="mt-8 max-w-[560px] text-mute">{body}</Lead>
            </div>
          ) : null}

          {children ? (
            <div className="mt-10 flex flex-col gap-4 animate-fade-in-up-delay-200 sm:flex-row sm:items-center justify-center items-center">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
