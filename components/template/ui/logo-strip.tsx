import * as React from "react";
import { cn } from "@/lib/cn";
import { BrandLogo } from "@/components/brand-logo";

/**
 * LogoStrip — "Trusted by industry leaders" trust strip.
 *
 * Renders a row of customer cards: real brand mark (via BrandLogo /
 * logo.dev CDN) on the left, name on the right. When a customer doesn't
 * have a domain provided, falls back to a clean typographic name.
 */

export interface CustomerLogo {
  name: string;
  /** Brand domain — used by BrandLogo to fetch the real wordmark. */
  domain?: string;
  /** Optional href — leaves customer name un-linked when omitted */
  href?: string;
}

export interface LogoStripProps {
  customers: CustomerLogo[];
  className?: string;
  /** Auto-marquee scroll. Defaults to false (static grid). */
  marquee?: boolean;
}

export function LogoStrip({ customers, marquee = false, className }: LogoStripProps) {
  if (marquee) {
    // duplicate for seamless loop
    const items = [...customers, ...customers];
    return (
      <div className={cn("relative w-full overflow-hidden", className)}>
        <ul className="flex animate-[scroll_40s_linear_infinite] whitespace-nowrap">
          {items.map((c, i) => (
            <li
              key={`${c.name}-${i}`}
              className="flex shrink-0 items-center gap-3 px-8 text-mute"
            >
              {c.domain ? (
                <BrandLogo
                  name={c.name}
                  domain={c.domain}
                  size={28}
                  className="rounded-[6px]"
                />
              ) : null}
              <span className="font-sans text-[16px] font-medium tracking-tight text-ink">
                {c.name}
              </span>
            </li>
          ))}
        </ul>
        <style>{`
          @keyframes scroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "grid w-full grid-cols-2 gap-x-6 gap-y-6",
        "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
        "items-stretch",
        className
      )}
    >
      {customers.map((c) => {
        const Item = c.href ? "a" : "div";
        return (
          <li key={c.name} className="flex">
            <Item
              {...(c.href ? { href: c.href } : {})}
              className={cn(
                "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-3",
                "bg-pure-white",
                "transition-[background-color,color] duration-300 ease",
                c.href ? "hover:bg-surface-warm cursor-pointer" : "",
                "no-underline"
              )}
            >
              {c.domain ? (
                <BrandLogo
                  name={c.name}
                  domain={c.domain}
                  size={32}
                  className="rounded-[6px] shrink-0"
                />
              ) : null}
              <span className="font-sans text-[15px] font-medium tracking-tight text-ink truncate">
                {c.name}
              </span>
            </Item>
          </li>
        );
      })}
    </ul>
  );
}
