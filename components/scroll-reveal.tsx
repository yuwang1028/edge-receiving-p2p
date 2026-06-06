"use client";

import * as React from "react";

/**
 * Single IntersectionObserver shared across the app. Attaches `.revealed`
 * to any element with `data-reveal` once it scrolls into view.
 *
 * Mount once in the root layout (wrapped below). Idempotent — safe to
 * re-mount during navigation.
 */
export function ScrollReveal() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]:not(.revealed)");
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => obs.observe(el));

    // Re-scan on mutations (new reveal targets after route transitions)
    const mut = new MutationObserver(() => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not(.revealed)")
        .forEach((el) => obs.observe(el));
    });
    mut.observe(document.body, { childList: true, subtree: true });

    return () => {
      obs.disconnect();
      mut.disconnect();
    };
  }, []);

  return null;
}
