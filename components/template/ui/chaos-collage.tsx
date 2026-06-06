import * as React from "react";
import { Section } from "./section";
import { Eyebrow, SectionHeading, Lead } from "./typography";
import { Reveal } from "../motion/reveal";
import { BrandLogo } from "@/components/brand-logo";

/**
 * Brand-name → local asset path. Files live in /public/icons/ and are
 * supplied by the site owner (sourced from each vendor's official brand
 * resource center). Anything NOT in this map falls back to the existing
 * BrandLogo + logo.dev CDN runtime fetch.
 */
const LOCAL_ICONS: Record<string, string> = {
  "Gmail":           "/icons/gmail.webp",
  "Outlook":         "/icons/outlook.png",
  "Microsoft Teams": "/icons/teams.webp",
  "Slack":           "/icons/slack.png",
  "SAP":             "/icons/sap.png",
};

function BrandIcon({
  name,
  domain,
  size,
  className,
}: {
  name: string;
  domain?: string;
  size: number;
  className?: string;
}) {
  const local = LOCAL_ICONS[name];
  if (local) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={local}
        alt={`${name} logo`}
        width={size}
        height={size}
        className={`block object-contain ${className ?? ""}`}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  return <BrandLogo name={name} domain={domain} size={size} className={className} />;
}

/**
 * ChaosCollage — "Before / why you need us" hero illustration.
 *
 * Editorial composition: ~8 mock back-office surfaces scattered around a
 * central focal point, connected by dashed lines that pass behind the
 * cards. Decorative icons + overlay speech bubbles add density without
 * crowding. Each surface uses an ORIGINAL mock UI in Bacumen tokens; the
 * goal is "you instantly recognize the category (ERP / spreadsheet /
 * inbox / etc.)" not "exact replica of any real product".
 *
 * Layered z-order (low → high):
 *   bg radial warmth → SVG connectors → cards (z 2-6) → decorations →
 *   overlay speech bubbles → center warning focal
 *
 * Mobile (< md): everything stacks into a 2-col grid; absolute coords,
 * rotations, connectors, decorations, and overlays are suppressed.
 */

/* Layout — % coords (card CENTER), rotation deg, width px, z-index.
   Widths vary so cards don't read as a grid of squares — wider for table /
   inbox surfaces, taller/narrower for forms + documents. */
const CARDS = [
  { x: 11, y: 20, rotate: -4, w: 260, z: 4, chrome: "mac"      as const, body: <MockOrder /> },
  { x: 18, y: 72, rotate: 3,  w: 360, z: 4, chrome: "tabs"     as const, body: <MockSpreadsheet /> },
  { x: 42, y: 16, rotate: 2,  w: 360, z: 5, chrome: "browser"  as const, body: <MockInbox /> },
  { x: 67, y: 20, rotate: -3, w: 250, z: 5, chrome: "modal"    as const, body: <MockLogin /> },
  { x: 86, y: 68, rotate: -2, w: 280, z: 4, chrome: "mac"      as const, body: <MockTimesheet /> },
  { x: 92, y: 28, rotate: 5,  w: 200, z: 3, chrome: "paper"    as const, body: <MockPdf /> },
  { x: 52, y: 82, rotate: -1, w: 340, z: 6, chrome: "bare"     as const, body: <MockChatPanel /> },
  { x: 14, y: 50, rotate: -3, w: 340, z: 4, chrome: "mac"      as const, body: <MockTeamChat /> },
];

/* Floating decorations (non-card UI atoms).
   Each brand appears AT MOST ONCE across the entire collage. Brands rendered
   inside card chromes (SAP, Gmail, Workday, Slack) are not duplicated here. */
const DECORATIONS = [
  { x: 76, y: 38, kind: "sticky"     as const, z: 7 },  // post-it
  { x: 60, y: 45, kind: "folder"     as const, z: 6 },  // folder icon
  // Scattered brand tiles — "all the apps you have to switch between"
  // Each brand appears EXACTLY ONCE; window cards stay brand-neutral.
  { x: 80, y: 3,  kind: "brand"      as const, z: 8, brand: { name: "Gmail",           domain: "mail.google.com"     } },
  { x: 36, y: 72, kind: "brand"      as const, z: 9, brand: { name: "SAP",             domain: "sap.com"             } },
  { x: 70, y: 56, kind: "brand"      as const, z: 7, brand: { name: "Workday",         domain: "workday.com"         } },
  { x: 38, y: 38, kind: "brand"      as const, z: 7, brand: { name: "Oracle",          domain: "oracle.com"          } },
  { x: 24, y: 33, kind: "brand"      as const, z: 7, brand: { name: "Outlook",         domain: "outlook.com"         } },
  { x: 80, y: 52, kind: "brand"      as const, z: 7, brand: { name: "Microsoft Teams", domain: "teams.microsoft.com" } },
  { x: 50, y: 70, kind: "brand"      as const, z: 7, brand: { name: "Slack",           domain: "slack.com"           } },
];

/* Overlay speech bubbles — break out of card boundaries. */
const BUBBLES = [
  { x: 70, y: 48, name: "Linh",  initial: "L", color: "#2563eb", text: "still blocked 👀",         z: 11 },
];

const CENTER = { x: 50, y: 50 };

export function ChaosCollage() {
  return (
    <Section tone="cool" py="generous" className="overflow-hidden">
      {/* Heading block */}
      <Reveal>
        <div className="max-w-[40ch]">
          <Eyebrow>One Platform</Eyebrow>
          <SectionHeading className="mt-4">
            One platform. Every back-office workflow. Every industry.
          </SectionHeading>
        </div>
      </Reveal>
      <Reveal delay={120}>
        <Lead className="mt-6 max-w-[58ch]">
          Stop wiring five systems together to answer one question. Bacumen
          agents reach into all of them for you.
        </Lead>
      </Reveal>

      {/* Collage frame */}
      <Reveal delay={200}>
        <div
          className={[
            "chaos-collage relative mt-16",
            // Mobile: single column so each mock surface gets full width and
            // fits — at 2 cols the Slack/spreadsheet cards' min-content
            // exceeded the ~163px track and spilled past the clipped edge.
            "grid grid-cols-1 gap-5",                         // mobile stack
            "md:block md:h-[880px] lg:h-[920px]",             // desktop frame
          ].join(" ")}
          aria-label="Illustration: a single workflow scattered across many disconnected back-office systems."
        >
          {/* Background radial warmth */}
          <div
            aria-hidden
            className="hidden md:block absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(37, 99, 235,0.10), transparent 70%)",
            }}
          />

          {/* Connector layer — z 1, sits BEHIND cards (z 2+) */}
          <svg
            aria-hidden
            className="hidden md:block absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ zIndex: 1 }}
          >
            {CARDS.map((c, i) => {
              // Gentle curve from card center to focal — control point
              // pulled toward the center for a soft arc
              const mx = (c.x + CENTER.x) / 2;
              const my = (c.y + CENTER.y) / 2;
              const offset = (i % 2 === 0 ? -1 : 1) * 4;
              return (
                <path
                  key={i}
                  d={`M ${c.x} ${c.y} Q ${mx + offset} ${my + offset} ${CENTER.x} ${CENTER.y}`}
                  fill="none"
                  stroke="rgba(33, 33, 33, 0.38)"
                  strokeWidth={0.45}
                  strokeDasharray="0.7 0.9"
                  vectorEffect="non-scaling-stroke"
                  className="chaos-dashline"
                />
              );
            })}
          </svg>

          {/* Main cards — brand-neutral chromes; all brand identity moves
              into the standalone tiles in DECORATIONS so each brand appears
              exactly once. */}
          {CARDS.map((c, i) => (
            <Floater key={`card-${i}`} x={c.x} y={c.y} w={c.w} rotate={c.rotate} z={c.z}>
              <WindowChrome kind={c.chrome}>{c.body}</WindowChrome>
            </Floater>
          ))}

          {/* Decorations — hidden on mobile */}
          <div className="hidden md:contents" aria-hidden>
            {DECORATIONS.map((d, i) => (
              <Floater key={`decor-${i}`} x={d.x} y={d.y} w={0} rotate={0} z={d.z} bare>
                {d.kind === "sticky"   && <StickyNote />}
                {d.kind === "folder"   && <FolderIcon />}
                {d.kind === "brand"    && "brand" in d && <BrandTile name={d.brand.name} domain={d.brand.domain} />}
              </Floater>
            ))}
            {BUBBLES.map((b, i) => (
              <Floater key={`bubble-${i}`} x={b.x} y={b.y} w={0} rotate={0} z={b.z} bare>
                <SpeechBubble name={b.name} initial={b.initial} color={b.color}>
                  {b.text}
                </SpeechBubble>
              </Floater>
            ))}
          </div>

          {/* Center focal — Bacumen mark, breathing glow */}
          <div
            aria-label="Bacumen"
            className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ zIndex: 12 }}
          >
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full chaos-pulse"
                style={{
                  background:
                    "radial-gradient(circle, rgba(37, 99, 235,0.32) 0%, rgba(37, 99, 235,0) 70%)",
                }}
              />
              <BacumenMark />
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Floater — generic absolute-positioning wrapper for the collage.
   Mobile: behaves as a normal grid item (decorations / bubbles set bare=true
   to opt out of mobile stacking entirely — they only render on md+).
   ────────────────────────────────────────────────────────────────────── */
function Floater({
  x, y, w, rotate, z, children, bare = false,
}: {
  x: number; y: number; w: number; rotate: number; z: number;
  children: React.ReactNode; bare?: boolean;
}) {
  return (
    <div
      className={
        bare
          ? "hidden md:block md:absolute"
          : "relative w-full md:absolute md:w-auto"
      }
      style={{
        zIndex: z,
        ["--fc-x" as string]: `${x}%`,
        ["--fc-y" as string]: `${y}%`,
        ["--fc-w" as string]: w > 0 ? `${w}px` : "auto",
        ["--fc-rotate" as string]: `${rotate}deg`,
      }}
      data-floating-card={bare ? undefined : ""}
      data-floating-bare={bare ? "" : undefined}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   WindowChrome — wraps the body with a category-evoking outer shell.
   Five flavors: mac (window dots), browser (tab + URL pill), modal
   (close X), paper (no chrome, paper tint), tabs (sheet tabs in body),
   scanned (paper + grain), bare (no chrome).
   ────────────────────────────────────────────────────────────────────── */
function WindowChrome({
  kind,
  brand,
  children,
}: {
  kind: "mac" | "browser" | "modal" | "paper" | "tabs" | "scanned" | "bare";
  brand?: { name: string; domain: string };
  children: React.ReactNode;
}) {
  const shell =
    "bg-pure-white text-ink rounded-[var(--radius-lg)] ring-1 ring-[rgba(33,33,33,0.08)] shadow-[var(--shadow-card)] overflow-hidden select-none pointer-events-none";

  if (kind === "mac") {
    return (
      <div className={shell}>
        <div className="h-7 bg-[#f1f5f9] border-b border-[rgba(33,33,33,0.06)] flex items-center px-2 gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
          <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
          <span className="w-2 h-2 rounded-full bg-[#28c840]" />
          {brand && (
            <div className="ml-auto flex items-center gap-1.5">
              <BrandIcon name={brand.name} domain={brand.domain} size={14} className="rounded-[3px]" />
              <span className="text-[9px] font-medium text-mute tracking-[0.5px]">{brand.name}</span>
            </div>
          )}
        </div>
        {children}
      </div>
    );
  }
  if (kind === "browser") {
    return (
      <div className={shell}>
        <div className="h-7 bg-[#f1f5f9] border-b border-[rgba(33,33,33,0.06)] flex items-center px-2 gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#d5d2cd]" />
          <span className="w-2 h-2 rounded-full bg-[#d5d2cd]" />
          <span className="w-2 h-2 rounded-full bg-[#d5d2cd]" />
          <div className="ml-2 flex-1 h-3 rounded-full bg-pure-white border border-[rgba(33,33,33,0.08)] flex items-center px-2">
            <span className="text-[8px] text-mute tracking-[0.5px]">mail.internal.co</span>
          </div>
        </div>
        {children}
      </div>
    );
  }
  if (kind === "modal") {
    return (
      <div className={shell}>
        <div className="h-7 bg-pure-white border-b border-[rgba(33,33,33,0.08)] flex items-center justify-between px-3">
          <span className="text-[10px] font-medium text-ink tracking-[0.5px]">Session expired</span>
          <span className="text-mute text-[12px] leading-none">×</span>
        </div>
        {children}
      </div>
    );
  }
  if (kind === "paper") {
    return (
      <div className="bg-[#f8fafc] rounded-[var(--radius-lg)] ring-1 ring-[rgba(33,33,33,0.08)] shadow-[var(--shadow-card)] p-3 select-none pointer-events-none">
        {children}
      </div>
    );
  }
  if (kind === "scanned") {
    return (
      <div
        className="relative bg-[#f4ebd9] rounded-[8px] ring-1 ring-[rgba(33,33,33,0.10)] shadow-[var(--shadow-card)] p-3 select-none pointer-events-none overflow-hidden"
        style={{
          // Very faint paper grain via inline data-URL noise
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\"), linear-gradient(180deg, #f6ecd9 0%, #efe2c5 100%)",
        }}
      >
        {children}
      </div>
    );
  }
  if (kind === "tabs") {
    return <div className={shell}>{children}</div>;
  }
  // bare
  return <div className={shell}>{children}</div>;
}

/* ──────────────────────────────────────────────────────────────────────
   Mock surfaces — 8 originals. No specific vendor UI replicated.
   ────────────────────────────────────────────────────────────────────── */

function MockOrder() {
  return (
    <div className="font-sans p-3">
      <div className="text-[9px] uppercase tracking-[1.5px] text-mute">Orders</div>
      <div className="mt-0.5 text-[12px] text-mute">PO-4471 · Vendor #218</div>
      <div className="mt-1 text-[16px] font-medium text-ink leading-tight">
        12 line items
      </div>
      <div className="text-[14px] text-ink tabular-nums">$84,210</div>
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fde8e3] px-2 py-0.5 text-[10px] font-medium text-[#a8331f]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1d4ed8]" />
          Blocked
        </span>
        <span className="text-[10px] text-mute">8 days</span>
      </div>
      <div className="mt-3 space-y-1 border-t border-[rgba(33,33,33,0.06)] pt-2">
        {[
          ["Buyer", "M. Chen"],
          ["Plant", "DE-04"],
          ["ETA",   "—"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[11px]">
            <span className="text-mute">{k}</span>
            <span className="text-ink">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockSpreadsheet() {
  const rows = [
    ["A-1042", "Hex bolt M8",   "1,200", "OK"],
    ["A-1043", "Hex bolt M10",  "—",     "#N/A"],
    ["A-1044", "Washer 10mm",   "3,400", "OK"],
    ["A-1045", "Nut M10",       "2,200", "OK"],
    ["A-1046", "Lock washer",   "—",     "#N/A"],
  ];
  return (
    <div className="font-sans">
      <div className="bg-[#e8efe5] border-b border-[rgba(33,33,33,0.10)]">
        <div className="grid grid-cols-[1fr_2fr_1fr_0.8fr] text-[10px] text-[#3d5234] uppercase tracking-[1px] font-medium">
          {["Part", "Description", "Qty", "Status"].map((h) => (
            <span key={h} className="px-2 py-1.5">{h}</span>
          ))}
        </div>
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_2fr_1fr_0.8fr] text-[11px] border-b border-[rgba(33,33,33,0.05)]"
        >
          {r.map((cell, j) => (
            <span
              key={j}
              className={`px-2 py-1.5 truncate tabular-nums ${
                cell === "#N/A" ? "text-[#a8331f] font-medium bg-[#fde8e3]" : "text-ink"
              }`}
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
      <div className="flex gap-0.5 px-2 py-1.5 bg-[#f1f5f9] border-t border-[rgba(33,33,33,0.06)]">
        {["BoM", "Pricing", "Stock", "+"].map((t, i) => (
          <span
            key={t}
            className={`px-2 py-0.5 rounded-t text-[10px] ${
              i === 0
                ? "bg-pure-white text-ink border-x border-t border-[rgba(33,33,33,0.10)]"
                : "text-mute"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function MockInbox() {
  const threads = [
    { from: "Procurement",      subj: "Re:Re:Re: Where is PO-4471?",   unread: true,  count: 6, time: "2:14" },
    { from: "Vendor desk",      subj: "Awaiting your reply — 3 days",   unread: false, time: "11:02" },
    { from: "Finance · M.Chen", subj: "Q3 accruals draft for review",   unread: false, time: "Yest" },
    { from: "Logistics",        subj: "Bill of lading scan attached",   unread: false, time: "Yest" },
  ];
  return (
    <div className="font-sans">
      <div className="px-3 py-2 flex items-center justify-between border-b border-[rgba(33,33,33,0.08)]">
        <span className="text-[10px] text-mute uppercase tracking-[1.5px]">Inbox · 247</span>
        <span className="text-[10px] text-mute">all mail</span>
      </div>
      {threads.map((t, i) => (
        <div
          key={i}
          className={`px-3 py-2 border-b border-[rgba(33,33,33,0.06)] ${
            t.unread ? "bg-[#f8fafc]" : ""
          }`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-[11px] truncate ${t.unread ? "font-semibold text-ink" : "text-mute"}`}>
              {t.from}
            </span>
            <span className="text-[9px] text-mute flex-shrink-0 tabular-nums">{t.time}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2 mt-0.5">
            <span className={`text-[11px] truncate ${t.unread ? "text-ink" : "text-mute"}`}>
              {t.subj}
            </span>
            {t.count && (
              <span className="text-[9px] text-mute tabular-nums">{t.count}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MockLogin() {
  return (
    <div className="font-sans p-4">
      <div className="text-[10px] text-mute">Your session has timed out.</div>
      <div className="mt-2 text-[13px] font-medium text-ink">Please sign in again</div>
      <div className="mt-3 space-y-2">
        {[
          { l: "Username",                                       val: "m.chen" },
          { l: "Password",                                       val: "••••••••" },
          { l: "Security question — your first pet's name",      val: "" },
        ].map((f) => (
          <div key={f.l}>
            <div className="text-[9px] text-mute mb-0.5">{f.l}</div>
            <div className="h-6 rounded-sm border border-[rgba(33,33,33,0.18)] bg-pure-white text-[10px] text-ink px-2 flex items-center">
              {f.val}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="text-[10px] px-3 py-1 rounded-full bg-ink text-white">
          Continue
        </div>
        <div className="text-[9px] text-mute underline">Forgot?</div>
      </div>
    </div>
  );
}

function MockTimesheet() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const hrs  = [8, 8, 8, 7.5, 8, 0, 0];
  const max  = 8;
  return (
    <div className="font-sans p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] text-mute uppercase tracking-[1.5px]">Week 21 · Hours</span>
        <span className="text-[9px] text-[#a8331f]">Late</span>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const h = hrs[i];
          const heightPct = (h / max) * 100;
          return (
            <div key={i} className="text-center">
              <div className="text-[8px] text-mute">{d}</div>
              <div className="mt-1 h-12 flex items-end">
                <div
                  className={`w-full rounded-sm transition-all ${
                    h > 0 ? "bg-[#1d2540]" : "bg-[#ebe9e3]"
                  }`}
                  style={{ height: `${Math.max(heightPct, 8)}%` }}
                />
              </div>
              <div className="text-[8px] text-ink mt-0.5 tabular-nums">{h || "·"}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-[rgba(33,33,33,0.06)] text-[9px] text-mute">
        Submit by Fri 18:00 · pending approval from L. Park
      </div>
    </div>
  );
}

function MockPdf() {
  return (
    <div className="font-sans">
      <div className="aspect-[3/4] w-full bg-pure-white ring-1 ring-[rgba(33,33,33,0.10)] p-3 flex flex-col shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[7px] text-mute uppercase tracking-[1.5px]">Internal · v12</span>
          <span className="text-[7px] text-mute">PDF</span>
        </div>
        <div className="mt-2 space-y-1 opacity-50">
          {[100, 92, 84, 95, 80, 88, 30].map((w, i) => (
            <div key={i} className="h-[3px] rounded-full bg-[rgba(33,33,33,0.18)]" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="mt-auto">
          <div className="text-[10px] font-medium text-ink leading-tight">
            Logistics SOP — Final FINAL.pdf
          </div>
          <div className="mt-0.5 text-[8px] text-mute">last edited 2 yrs ago</div>
        </div>
      </div>
    </div>
  );
}

function MockChatPanel() {
  return (
    <div className="font-sans p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="h-6 w-6 rounded-full bg-[#2563eb] flex-shrink-0 grid place-items-center text-white text-[10px] font-medium">
          D
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-medium text-ink">David</span>
            <span className="text-[8px] text-mute">2:14 PM</span>
          </div>
          <div className="mt-0.5 inline-block rounded-[12px] rounded-tl-sm bg-[#f1f5f9] px-3 py-1.5 text-[11px] text-ink leading-[1.4]">
            @maya can you check exception #0042? blocked the line again
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <div className="h-6 w-6 rounded-full bg-[#1d2540] flex-shrink-0 grid place-items-center text-white text-[10px] font-medium">
          M
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-medium text-ink">Maya</span>
            <span className="text-[8px] text-mute">2:18 PM</span>
            <span className="text-[8px] text-mute">typing…</span>
          </div>
          <div className="mt-0.5 inline-block rounded-[12px] rounded-tl-sm bg-[#f1f5f9] px-3 py-1.5 text-[11px] text-ink leading-[1.4]">
            checking the spreadsheet now — give me 5
          </div>
        </div>
      </div>
    </div>
  );
}

function MockTeamChat() {
  return (
    <div className="font-sans flex h-[140px]">
      {/* Workspace switcher rail */}
      <div className="w-[28px] bg-[#1f0823] flex flex-col items-center py-2 gap-1.5 flex-shrink-0">
        <div
          className="w-[22px] h-[22px] rounded-[6px] grid place-items-center text-white text-[11px] font-semibold ring-2 ring-white/95"
          style={{ background: "#0A1F44" }}
        >
          B
          <span
            className="absolute"
            style={{
              marginLeft: 14,
              marginTop: 10,
              width: 4,
              height: 4,
              borderRadius: 4,
              background: "#2563eb",
            }}
          />
        </div>
        <div className="w-[22px] h-[22px] rounded-[6px] bg-white/10 grid place-items-center text-white/55 text-[10px] font-medium">
          A
        </div>
        <div className="w-[22px] h-[22px] rounded-[6px] grid place-items-center text-white/35 text-[12px] border border-dashed border-white/25">
          +
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-[120px] bg-[#3a1f3d] text-white/85 flex flex-col flex-shrink-0">
        {/* Workspace header */}
        <div className="px-2.5 pt-2 pb-2 border-b border-white/8 flex items-center gap-1">
          <div className="text-[11px] font-semibold text-white truncate flex-1">Bacumen Inc.</div>
          <svg viewBox="0 0 12 12" width="8" height="8" aria-hidden>
            <path d="M3 4.5 L6 7.5 L9 4.5" stroke="rgba(255,255,255,0.7)" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Jump-to / search hint */}
        <div className="px-2.5 py-1.5 flex items-center justify-between text-[8.5px] text-white/55 border-b border-white/8">
          <span>Jump to…</span>
          <span className="px-1 py-px rounded bg-white/10 text-[7.5px] tracking-[0.5px]">⌘K</span>
        </div>

        {/* Channels */}
        <div className="px-2.5 py-1.5 space-y-px flex-1 overflow-hidden text-[10px]">
          <div className="flex items-center justify-between text-[8px] uppercase tracking-[1px] text-white/50 mb-1">
            <span>Channels</span>
            <span className="text-white/35 text-[11px] leading-none">+</span>
          </div>
          <div className="px-1.5 py-[3px] rounded text-white font-medium" style={{ background: "#1164a3" }}>
            <span className="text-white/70 mr-0.5">#</span>procurement
          </div>
          <div className="px-1.5 py-[3px] rounded text-white/75">
            <span className="text-white/45 mr-0.5">#</span>exceptions
          </div>
          <div className="px-1.5 py-[3px] rounded text-white/75">
            <span className="text-white/45 mr-0.5">#</span>general
          </div>
          <div className="px-1.5 py-[3px] rounded text-white/75 flex items-center justify-between">
            <span><span className="text-white/45 mr-0.5">#</span>vendor-desk</span>
            <span className="text-[8px] bg-[#1d4ed8] text-white px-1 rounded-full leading-[1.2]">3</span>
          </div>

          <div className="flex items-center justify-between text-[8px] uppercase tracking-[1px] text-white/50 mt-2.5 mb-1">
            <span>Direct messages</span>
            <span className="text-white/35 text-[11px] leading-none">+</span>
          </div>
          <div className="px-1.5 py-[3px] rounded text-white/75 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2bac76]" />
            David Park
          </div>
          <div className="px-1.5 py-[3px] rounded text-white/75 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full border border-white/35" />
            Linh Tran
          </div>
        </div>
      </div>

      {/* Main pane */}
      <div className="flex-1 min-w-0 flex flex-col bg-pure-white">
        {/* Channel header */}
        <div className="px-3 py-2 border-b border-[rgba(33,33,33,0.10)] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[12px] font-semibold text-ink truncate">
              <span className="text-mute font-normal mr-0.5">#</span>procurement
            </span>
            <span className="text-[9px] text-mute flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-mute/30 inline-block" />
              12
            </span>
          </div>
          <svg viewBox="0 0 16 16" width="11" height="11" className="text-mute flex-shrink-0">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" fill="none" strokeWidth="1.4" />
            <line x1="10.5" y1="10.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>

        {/* Message list */}
        <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden">
          <div className="flex items-start gap-2">
            <div className="w-[22px] h-[22px] rounded-[5px] bg-[#2563eb] grid place-items-center text-white text-[10px] font-semibold flex-shrink-0">D</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className="text-[10.5px] font-semibold text-ink">David Park</span>
                <span className="text-[9px] text-mute">2:14 PM</span>
              </div>
              <div className="text-[10.5px] text-ink leading-[1.4]">who owns PO-4471 now?</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-[22px] h-[22px] rounded-[5px] bg-[#1d2540] grid place-items-center text-white text-[10px] font-semibold flex-shrink-0">M</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className="text-[10.5px] font-semibold text-ink">Maya Chen</span>
                <span className="text-[9px] text-mute">2:18 PM</span>
              </div>
              <div className="text-[10.5px] text-ink leading-[1.4]">I asked vendor desk last week — no reply yet</div>
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex items-center gap-1.5 text-[9px] text-mute pt-1">
            <span className="flex gap-[2px]">
              <span className="w-[3px] h-[3px] rounded-full bg-mute animate-pulse" />
              <span className="w-[3px] h-[3px] rounded-full bg-mute animate-pulse" style={{ animationDelay: "0.15s" }} />
              <span className="w-[3px] h-[3px] rounded-full bg-mute animate-pulse" style={{ animationDelay: "0.30s" }} />
            </span>
            <span>Linh and 2 others are typing</span>
          </div>
        </div>

        {/* Compose box */}
        <div className="px-3 pb-2">
          <div className="h-7 rounded-[6px] border border-[rgba(33,33,33,0.15)] bg-pure-white flex items-center px-2 text-[10px] text-mute">
            Message #procurement
          </div>
        </div>
      </div>
    </div>
  );
}

function MockScannedDoc() {
  return (
    <div className="font-sans">
      <div className="flex items-baseline justify-between">
        <span className="text-[8px] text-[#7a6a4a] uppercase tracking-[1.5px]">Bill of Lading</span>
        <span className="text-[8px] text-[#7a6a4a]">#7194-0042</span>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[9px]">
        {[
          ["Shipper",   "—"],
          ["Consignee", "Plant DE-04"],
          ["Weight",    "1,240 kg"],
          ["Carrier",   "DHL Freight"],
          ["Date",      "—"],
          ["Signed",    "illegible"],
        ].map(([k, v]) => (
          <React.Fragment key={k}>
            <span className="text-[#7a6a4a]">{k}</span>
            <span className="text-ink truncate">{v}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-2 flex gap-px h-7 items-stretch">
        {Array.from({ length: 34 }).map((_, i) => (
          <span
            key={i}
            className="bg-ink"
            style={{ width: (i * 7) % 5 === 0 ? 2 : 1, opacity: (i * 13) % 7 === 0 ? 0.4 : 1 }}
          />
        ))}
      </div>
      <div className="mt-1 text-[8px] text-[#7a6a4a] tracking-[2px]">7194 0042 1138</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Decorations — small floating UI atoms (icons / badges / sticky notes).
   ────────────────────────────────────────────────────────────────────── */

function Spinner() {
  return (
    <div className="chaos-spin w-5 h-5">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(33,33,33,0.45)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 3 a9 9 0 0 1 9 9" />
      </svg>
    </div>
  );
}

function GmailTile({ n }: { n: string }) {
  return (
    <div className="relative">
      <div className="w-12 h-12 rounded-[12px] bg-pure-white ring-1 ring-[rgba(33,33,33,0.10)] shadow-[var(--shadow-card)] grid place-items-center p-1.5">
        <BrandIcon name="Gmail" domain="mail.google.com" size={36} className="rounded-[6px]" />
      </div>
      <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#1d4ed8] text-white text-[10px] font-semibold grid place-items-center tabular-nums ring-2 ring-[#f1f5f9]">
        {n}
      </div>
    </div>
  );
}

function BrandTile({ name, domain }: { name: string; domain: string }) {
  return (
    <div className="w-12 h-12 rounded-[12px] bg-pure-white ring-1 ring-[rgba(33,33,33,0.10)] shadow-[var(--shadow-card)] grid place-items-center p-1.5">
      <BrandIcon name={name} domain={domain} size={36} className="rounded-[6px]" />
    </div>
  );
}

function StickyNote() {
  return (
    <div
      className="w-[110px] p-2 shadow-md"
      style={{
        background: "linear-gradient(180deg, #fff4c2 0%, #f9e89a 100%)",
        transform: "rotate(6deg)",
        boxShadow: "0 6px 14px -6px rgba(33,33,33,0.30)",
      }}
    >
      <div className="text-[10px] leading-[1.3] text-[#5c4a14] font-medium" style={{ fontFamily: "ui-rounded, 'Comic Sans MS', cursive" }}>
        ask David re: PO-4471 ⚠
      </div>
    </div>
  );
}

function QuestionBubble() {
  return (
    <div className="relative">
      <div className="w-8 h-8 rounded-full bg-pure-white ring-1 ring-[rgba(33,33,33,0.10)] shadow-[var(--shadow-card)] grid place-items-center">
        <span className="text-[14px] font-semibold text-ink">?</span>
      </div>
    </div>
  );
}

function FolderIcon() {
  return (
    <div className="relative" style={{ transform: "rotate(-4deg)" }}>
      <svg viewBox="0 0 64 52" width="52" height="42">
        <path d="M2 8 a4 4 0 0 1 4 -4 h18 l5 6 h29 a4 4 0 0 1 4 4 v32 a4 4 0 0 1 -4 4 h-52 a4 4 0 0 1 -4 -4 z" fill="#f5d574" stroke="rgba(33,33,33,0.18)" strokeWidth="1" />
        <path d="M2 14 h60 v30 a4 4 0 0 1 -4 4 h-52 a4 4 0 0 1 -4 -4 z" fill="#fae29a" />
      </svg>
      <div className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-[#1d4ed8] text-white text-[8px] font-medium grid place-items-center">
        12
      </div>
    </div>
  );
}

function SpeechBubble({
  name, initial, color, children,
}: {
  name: string; initial: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 max-w-[220px]">
      <div
        className="h-7 w-7 rounded-full grid place-items-center text-white text-[11px] font-medium flex-shrink-0 ring-2 ring-[#f1f5f9]"
        style={{ background: color }}
      >
        {initial}
      </div>
      <div>
        <div className="text-[10px] font-medium text-ink leading-none mb-1">{name}</div>
        <div className="inline-block rounded-[14px] rounded-tl-sm bg-pure-white ring-1 ring-[rgba(33,33,33,0.08)] shadow-[var(--shadow-card)] px-3 py-1.5 text-[11px] text-ink leading-[1.35]">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * BacumenMark — the center focal point. Inline rendering mirrors the same
 * mark used at app/icon.tsx (Next.js Icon route) so the focal exactly
 * matches the site favicon: dark navy rounded square, white "B" wordmark,
 * teal accent dot bottom-right.
 */
function BacumenMark() {
  return (
    <div
      className="relative w-[72px] h-[72px] rounded-[18px] flex items-center justify-center shadow-[var(--shadow-dark-glow)]"
      style={{ background: "#0A1F44" }}
    >
      <span
        className="text-white font-semibold leading-none"
        style={{
          fontFamily: "var(--font-display), -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 44,
          letterSpacing: "-0.04em",
        }}
      >
        B
      </span>
      <span
        aria-hidden
        className="absolute"
        style={{
          right: 8,
          bottom: 8,
          width: 9,
          height: 9,
          borderRadius: 9,
          background: "#2563eb",
        }}
      />
    </div>
  );
}
