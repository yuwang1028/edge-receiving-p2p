import { cn } from "@/lib/cn";

export function BacumenWordmark({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "cream";
}) {
  const fill = tone === "ink" ? "#0F172A" : "#F8FAFB";
  return (
    <svg
      viewBox="0 0 148 28"
      className={cn("h-6 w-auto", className)}
      aria-label="Bacumen.ai"
      role="img"
    >
      <text
        x="0"
        y="21"
        fontFamily="var(--font-display), var(--font-inter), sans-serif"
        fontWeight={700}
        fontSize={22}
        letterSpacing="-0.025em"
        fill={fill}
      >
        Bacumen
      </text>
      <text
        x="102"
        y="21"
        fontFamily="var(--font-display), var(--font-inter), sans-serif"
        fontWeight={500}
        fontSize={22}
        letterSpacing="-0.025em"
        fill={fill}
        opacity={0.7}
      >
        .ai
      </text>
      <circle cx="143" cy="20" r="3" fill="#2563eb" />
    </svg>
  );
}
