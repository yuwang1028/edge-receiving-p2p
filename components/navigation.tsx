"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import { BacumenWordmark } from "@/components/bacumen-wordmark";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { skillIconFor } from "@/components/skill-icon";
import { listSkills } from "@/lib/skills";

/**
 * Navigation — flat template-style nav.
 *
 * Captured shape:
 *   - fixed top-0, py-5 md:py-4, soft shadow 0px 2px 2px rgb(0 0 0 / 0.1)
 *   - max-width 1280px container, px-4 md:px-6 lg:px-10
 *   - flat slot list (no mega-menu)
 *   - right cluster: text link + pill primary CTA
 *
 * Bacumen-specific kept: BacumenWordmark + auto-hide-on-scroll.
 * Dropped: PillNav morphing-hover indicator, Skills mega-menu (Skills now
 * a flat slot; full skill tree lives at /skills).
 */

type NavItem = { label: string; href: string };

const primaryNav: NavItem[] = [
  { label: "Platform", href: "/platform" },
  { label: "Integrations", href: "/integrations" },
  { label: "Pricing", href: "/pricing" },
  { label: "Customers", href: "/customers" },
  { label: "About", href: "/about" },
];

/**
 * SkillsNavDropdown — Cohere-style mega menu, ported from the original
 * b00a826 SkillsMega and re-pointed to the current ink-cta/accent tokens.
 * 680px wide 2-col grid + roadmap footer card.
 */
function SkillsNavDropdown() {
  const skills = React.useMemo(() => listSkills(), []);
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const onLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  return (
    <li
      className="relative"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onLeave();
      }}
    >
      <Link
        href="/skills"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1 font-sans text-[15px] font-medium text-ink no-underline",
          "transition-opacity duration-300 ease",
          "hover:opacity-70",
        )}
      >
        Skills
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-ink/55 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </Link>

      {/* Hover bridge — keeps the menu open while pointer travels trigger → panel */}
      <div
        aria-hidden
        className={cn(
          "absolute left-1/2 top-full h-3 w-[680px] -translate-x-1/2",
          open ? "block" : "hidden",
        )}
      />

      <div
        role="menu"
        className={cn(
          "absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] z-50",
          "w-[680px] p-3",
          "rounded-2xl border border-ink/10 bg-white",
          "shadow-[0_24px_64px_-20px_rgba(15,23,42,0.35)]",
          "transition-all origin-top duration-[var(--t-3,320ms)] ease-[var(--ease-entrance,cubic-bezier(0.22,1,0.36,1))]",
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-[0.98] -translate-y-1 pointer-events-none",
        )}
      >
        <div className="grid grid-cols-2 gap-2">
          {skills.map((skill) => {
            const Icon = skillIconFor(skill.slug);
            const categoryTag = skill.category.split("·")[1]?.trim();
            return (
              <Link
                key={skill.slug}
                href={`/skills/${skill.slug}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex gap-3 rounded-xl p-3 no-underline",
                  "hover:bg-ink/[0.04] transition-colors duration-150",
                )}
              >
                <div
                  className={cn(
                    "shrink-0 h-10 w-10 rounded-lg grid place-items-center",
                    "bg-ink-cta/[0.08] text-ink-cta ring-1 ring-ink-cta/[0.10]",
                    "transition-transform duration-200 group-hover:scale-[1.04]",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-[15px] font-semibold text-ink leading-tight flex items-center gap-2">
                    {skill.shortName}
                    {categoryTag && (
                      <span className="font-mono text-[10px] uppercase tracking-[1.4px] text-mute font-medium">
                        {categoryTag}
                      </span>
                    )}
                  </div>
                  <div className="font-sans text-[13px] text-mute leading-[18px] mt-1 line-clamp-2">
                    {skill.oneLiner}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-2 rounded-xl border border-dashed border-ink/10 p-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[1.6px] font-medium text-mute">
              Roadmap
            </div>
            <div className="font-sans text-[13px] text-ink mt-0.5">
              More Skills coming — tell us what you&apos;d run next.
            </div>
          </div>
          <Link
            href="/skills"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="font-sans text-[13px] font-medium text-ink-cta hover:opacity-70 inline-flex items-center gap-1 shrink-0 no-underline"
          >
            See all
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </li>
  );
}

export function Navigation() {
  const [hidden, setHidden] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 80) setHidden(false);
        else if (y > lastY + 4) setHidden(true);
        else if (y < lastY - 4) setHidden(false);
        if (menuOpen) setHidden(false);
        lastY = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 h-[72px] flex items-center",
        "bg-pure-white",
        "shadow-[0px_2px_2px_rgb(0_0_0_/_0.1)]",
        "transition-transform duration-300 ease-in-out",
        hidden ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="max-w-[1280px] mx-auto w-full px-4 md:px-6 lg:px-10 flex items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="Bacumen home"
          className="flex items-center shrink-0"
        >
          <BacumenWordmark />
        </Link>

        <ul className="hidden lg:flex items-center gap-x-8">
          <SkillsNavDropdown />
          {primaryNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "font-sans text-[15px] font-medium text-ink no-underline",
                  "transition-opacity duration-300 ease",
                  "hover:opacity-70"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3 md:gap-4">
          <Link
            href="/demo"
            className={cn(
              "hidden sm:inline-flex items-center",
              "h-10 px-5 rounded-full",
              "bg-ink-cta text-white",
              "font-sans text-[14px] font-medium no-underline",
              "transition-[background-color] duration-300 ease",
              "hover:bg-[rgb(40,40,48)]"
            )}
          >
            Contact us
          </Link>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-full text-ink bg-white border border-ink/10 hover:bg-ink/[0.03]"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="gap-6">
              <BacumenWordmark />
              <nav className="flex flex-col gap-1 mt-4">
                <Link
                  href="/skills"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 font-sans text-[18px] font-medium text-ink"
                >
                  Skills
                </Link>
                <ul className="ml-3 mb-2 flex flex-col gap-0.5 border-l border-ink/[0.08] pl-3">
                  {listSkills().map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/skills/${s.slug}`}
                        onClick={() => setMenuOpen(false)}
                        className="block py-1.5 font-sans text-[14px] text-mute hover:text-ink"
                      >
                        {s.shortName}
                      </Link>
                    </li>
                  ))}
                </ul>
                {primaryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="py-3 font-sans text-[18px] font-medium text-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto">
                <Link
                  href="/demo"
                  onClick={() => setMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center h-12 px-5 rounded-full bg-ink-cta text-white font-medium"
                >
                  Contact us
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
