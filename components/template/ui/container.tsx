import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Container — primary content max-width wrapper.
 *
 * Template uses a generous container ~1280px (estimated from screenshot;
 * @capture-pending). Horizontal padding scales: 24px mobile, 40px md+.
 */
export function Container({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1280px] px-6 md:px-10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
