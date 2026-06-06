"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  strength?: number; // 0..1, how far the button follows the cursor
  asChild?: boolean;
};

/**
 * A button that subtly tracks the cursor when hovered. Used for primary
 * CTAs on dark sections. Disables on touch devices + reduced-motion.
 */
export const MagneticButton = React.forwardRef<HTMLButtonElement, Props>(
  function MagneticButton({ strength = 0.22, className, children, ...rest }, ref) {
    const innerRef = React.useRef<HTMLButtonElement | null>(null);
    React.useImperativeHandle(ref, () => innerRef.current!, []);

    React.useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      if (typeof window === "undefined") return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fine = window.matchMedia("(pointer: fine)").matches;
      if (reduce || !fine) return;

      let raf = 0;
      let tx = 0;
      let ty = 0;

      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        tx = (e.clientX - cx) * strength;
        ty = (e.clientY - cy) * strength;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(apply);
      };
      const apply = () => {
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      };
      const onLeave = () => {
        tx = 0;
        ty = 0;
        el.style.transform = "translate3d(0, 0, 0)";
      };

      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
        cancelAnimationFrame(raf);
      };
    }, [strength]);

    return (
      <button
        ref={innerRef}
        className={cn(
          "magnetic inline-flex items-center justify-center rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal",
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
