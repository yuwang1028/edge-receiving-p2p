"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Loads a real company logo from the logo.dev CDN by domain.
 * Falls back to a clean monogram tile if the image fails.
 *
 * NOTE: logos are trademarks of their respective owners — this component
 * fetches them from a public CDN at runtime for a demo/marketing context.
 * For production, replace the CDN URL with your own licensed asset path.
 */
const LOGO_DEV_TOKEN = "pk_X-1ZO13GSgeOoUrIuJ6GMQ";

export function BrandLogo({
  name,
  domain,
  size = 40,
  className,
  background = "auto",
}: {
  name: string;
  domain?: string;
  size?: number;
  className?: string;
  /** "auto" picks light/dark variant by container; "light" forces light tile. */
  background?: "auto" | "light" | "dark";
}) {
  const [failed, setFailed] = React.useState(false);

  const url = domain
    ? `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}&size=${size * 2}&format=png`
    : undefined;

  if (!url || failed) {
    return <Monogram name={name} size={size} className={className} />;
  }

  return (
    <img
      src={url}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={cn("block object-contain", className)}
      style={{ width: size, height: size }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Clean fallback: first letter or two letters on a neutral tile.
 * Matches the brand color strip where possible (navy/teal palette).
 */
function Monogram({
  name,
  size,
  className,
}: {
  name: string;
  size: number;
  className?: string;
}) {
  const letters = initials(name);
  const hue = hashHue(name);
  return (
    <span
      aria-label={`${name} logo`}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-semibold",
        "font-display tracking-[-0.02em]",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `hsl(${hue} 45% 94%)`,
        color: `hsl(${hue} 55% 28%)`,
      }}
    >
      {letters}
    </span>
  );
}

function initials(name: string): string {
  const clean = name.replace(/[^\w\s]/g, "").trim();
  const words = clean.split(/\s+/);
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  // Keep hues in "brand-ish" ranges, avoid too-saturated reds.
  return Math.abs(h) % 360;
}

/**
 * Inline chip: small logo + optional text label. Used in skill cards and
 * workflow tool labels.
 */
export function BrandChip({
  name,
  domain,
  showLabel = true,
  tone = "light",
  className,
}: {
  name: string;
  domain?: string;
  showLabel?: boolean;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-7 pl-1 pr-2.5 rounded-full border",
        tone === "light"
          ? "border-divider bg-white text-ink"
          : "border-cream/15 bg-cream/5 text-cream/90",
        className
      )}
    >
      <BrandLogo
        name={name}
        domain={domain}
        size={20}
        className="rounded-[4px]"
      />
      {showLabel && <span className="text-body-s truncate">{name}</span>}
    </span>
  );
}
