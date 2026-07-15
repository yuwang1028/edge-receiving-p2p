import * as React from "react";
import { SpringIn } from "@/components/ai/SpringIn";

/** Wraps a console's top-level sections so each pops in with a staggered spring
 * when the page mounts (landing animation). Reuses SpringIn's delay prop.
 * `keyed` (e.g. the selected case/PR id) re-triggers the animation on change. */
export function PageIn({ children, step = 70, className, keyed }: {
  children: React.ReactNode;
  step?: number;
  className?: string;
  keyed?: string | number;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <div className={className}>
      {items.map((child, i) => (
        <SpringIn key={`${keyed ?? ""}-${i}`} delay={i * step}>
          {child}
        </SpringIn>
      ))}
    </div>
  );
}
