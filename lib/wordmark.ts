/**
 * Generates an SVG data-URI wordmark for integration logos.
 * Used where real logos are not available (MVP placeholder).
 *
 * Style: Inter Display-ish, weight 600, single-line, centered,
 * mono-chromatic (set by `tone` prop).
 */
export function wordmark(
  name: string,
  opts: { tone?: "ink" | "cream" | "teal"; width?: number; height?: number } = {}
): string {
  const { tone = "ink", width = 160, height = 40 } = opts;
  const fill = tone === "ink" ? "#0F172A" : tone === "cream" ? "#F8FAFB" : "#2563eb";

  // Pick a size that fits
  const fontSize = Math.min(22, Math.max(12, (width - 16) / name.length * 1.4));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
        font-weight="600"
        letter-spacing="-0.01em"
        fill="${fill}"
        font-size="${fontSize}">${escapeXml(name)}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&apos;")
    .replaceAll('"', "&quot;");
}
