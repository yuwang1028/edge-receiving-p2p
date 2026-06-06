"use client";

import * as React from "react";
import { FileText, ArrowUpRight, Copy, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Artifact, ArtifactBlock } from "@/lib/skills";

/**
 * White-surface live artifact panel.
 *
 * Shows an agent *producing* a document in real time:
 *  - header bar with "writing" indicator + timestamp
 *  - title types in char-by-char with an ink caret following the write head
 *  - paragraphs stream char-by-char; tables reveal rows with a stagger;
 *    lists reveal items with a stagger
 *  - footer with trace-id pill (copy-to-clipboard) and
 *    "Open in Case Manager" link
 *
 * Drops all dark-glass treatments (`bg-navy-800/60`, teal borders,
 * scan-lines, corner brackets) in favor of a single product-card look
 * that reads on both dark and light parent sections.
 *
 * Fully respects prefers-reduced-motion (snaps to final state).
 */
export function LiveArtifactPanel({
  artifact,
  artifacts,
  className,
  density = "default",
}: {
  artifact?: Artifact;
  /** If provided, cycles through each artifact (used in home hero). */
  artifacts?: Artifact[];
  className?: string;
  density?: "default" | "compact";
}) {
  const list = artifacts ?? (artifact ? [artifact] : []);
  const [index, setIndex] = React.useState(0);
  const active = list[index];
  const cycleKey = `${index}-${active?.title ?? ""}`;

  const { totalMs } = estimateDuration(active);

  React.useEffect(() => {
    if (list.length < 2) return;
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % list.length);
    }, totalMs + 3200);
    return () => clearTimeout(id);
  }, [list.length, totalMs, index]);

  if (!active) return null;

  // Pull the trace id out of the artifact body if present (it's seeded in
  // `lib/skills.ts` as "... Trace: bcm-xxx-xxxxxx.") — otherwise fall back
  // to a deterministic hash of the title. Having it in the footer as a
  // pill avoids the body paragraph ending with a long id string.
  const { traceId, displayArtifact } = extractTrace(active);

  return (
    <div
      className={cn(
        "relative rounded-xl bg-white border border-slate-200 shadow-card overflow-hidden",
        "ring-1 ring-white/40",
        className
      )}
      style={{ color: "var(--color-ink)" }}
    >
      <Header eyebrow={active.eyebrow} />

      <div className="relative px-6 py-5 sm:px-7 sm:py-6 flex flex-col gap-4">
        <ArtifactBody key={cycleKey} artifact={displayArtifact} density={density} />
      </div>

      <Footer traceId={traceId} />
    </div>
  );
}

/**
 * Scans the artifact body for a `bcm-<slug>-<hex>` trace id. If found,
 * returns it and an artifact with that token (plus any leading
 * "Trace:" / "Immutable trace ID:" label) stripped from the paragraph
 * so the body reads clean and the footer pill is the single source.
 */
function extractTrace(a: Artifact): {
  traceId: string;
  displayArtifact: Artifact;
} {
  const traceRe = /\b(bcm-[a-z0-9-]+)\b/i;
  const stripRe =
    /\s*(?:immutable\s+trace\s+id|trace|trace\s+id)\s*[:·]\s*bcm-[a-z0-9-]+\.?/i;
  let found: string | null = null;
  const newBlocks: ArtifactBlock[] = a.blocks.map((b) => {
    if (b.type !== "paragraph") return b;
    const m = b.text.match(traceRe);
    if (!found && m) found = m[1];
    const next = b.text.replace(stripRe, "").trim();
    return { type: "paragraph", text: next };
  });
  const traceId = found ?? `bcm-${traceSlug(a.title)}-${shortHash(a.title)}`;
  return {
    traceId,
    displayArtifact: { ...a, blocks: newBlocks },
  };
}

function Header({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="flex items-center gap-3 px-6 sm:px-7 py-3.5 border-b border-slate-100">
      <div className="h-8 w-8 rounded-lg bg-ink text-white grid place-items-center">
        <FileText className="h-3.5 w-3.5" />
      </div>
      <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-slate-500">
        {eyebrow}
      </div>
      <div className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-[var(--color-teal-600)] font-medium">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-70 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
        </span>
        Writing
      </div>
    </div>
  );
}

function Footer({ traceId }: { traceId: string }) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard?.writeText(traceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  };
  return (
    <div className="flex items-center gap-3 px-6 sm:px-7 py-3 border-t border-slate-100 bg-slate-50/50">
      <button
        type="button"
        onClick={onCopy}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 shrink min-w-0",
          "text-[11px] font-mono text-ink hover:bg-slate-50 transition-colors whitespace-nowrap"
        )}
        aria-label="Copy trace id"
      >
        <span className="text-slate-400 shrink-0">TRACE</span>
        <span className="tabular-nums truncate">{traceId}</span>
        {copied ? (
          <Check className="h-3 w-3 text-[var(--color-teal-600)] shrink-0" strokeWidth={2.5} />
        ) : (
          <Copy className="h-3 w-3 text-slate-400 shrink-0" />
        )}
      </button>
      {/* "Last updated" is a nice-to-have; it's the first thing we drop
          when the card is narrow so the trace pill + case link never wrap. */}
      <span className="hidden xl:inline-flex ml-auto text-[11px] text-slate-400 items-center gap-1 whitespace-nowrap">
        Last updated · <span className="font-mono text-slate-500">now</span>
      </span>
      <span className="xl:hidden ml-auto" />
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-ink hover:underline underline-offset-2 cursor-default whitespace-nowrap shrink-0">
        Open in Case Manager
        <ArrowUpRight className="h-3 w-3" />
      </span>
    </div>
  );
}

function ArtifactBody({
  artifact,
  density,
}: {
  artifact: Artifact;
  density: "default" | "compact";
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [phase, setPhase] = React.useState<"idle" | "playing" | "done">("idle");
  const [titleShown, setTitleShown] = React.useState("");
  const [blockCursor, setBlockCursor] = React.useState(-1);
  const [blockProgress, setBlockProgress] = React.useState<Record<number, number>>({});
  const reduceMotionRef = React.useRef(false);

  React.useEffect(() => {
    setTitleShown("");
    setBlockCursor(-1);
    setBlockProgress({});
    setPhase("idle");
  }, [artifact.title]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    reduceMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const start = () => {
      if (reduceMotionRef.current) {
        setTitleShown(artifact.title);
        setBlockCursor(artifact.blocks.length - 1);
        setBlockProgress(
          Object.fromEntries(artifact.blocks.map((_, i) => [i, Number.MAX_SAFE_INTEGER]))
        );
        setPhase("done");
        return;
      }
      setPhase("playing");
    };

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && phase === "idle") {
            start();
            obs.disconnect();
          }
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [artifact, phase]);

  React.useEffect(() => {
    if (phase !== "playing") return;
    let cancelled = false;

    async function run() {
      for (let i = 1; i <= artifact.title.length; i++) {
        if (cancelled) return;
        setTitleShown(artifact.title.slice(0, i));
        await sleep(charDelay(artifact.title[i - 1]));
      }
      await sleep(120);

      for (let bi = 0; bi < artifact.blocks.length; bi++) {
        if (cancelled) return;
        setBlockCursor(bi);
        const block = artifact.blocks[bi]!;

        if (block.type === "paragraph") {
          for (let i = 1; i <= block.text.length; i++) {
            if (cancelled) return;
            setBlockProgress((p) => ({ ...p, [bi]: i }));
            await sleep(charDelay(block.text[i - 1]));
          }
          await sleep(90);
        } else if (block.type === "table") {
          setBlockProgress((p) => ({ ...p, [bi]: 0 }));
          await sleep(80);
          for (let r = 1; r <= block.rows.length; r++) {
            if (cancelled) return;
            setBlockProgress((p) => ({ ...p, [bi]: r }));
            await sleep(55);
          }
          await sleep(70);
        } else if (block.type === "list") {
          for (let i = 1; i <= block.items.length; i++) {
            if (cancelled) return;
            setBlockProgress((p) => ({ ...p, [bi]: i }));
            await sleep(65);
          }
          await sleep(50);
        }
      }

      if (!cancelled) setPhase("done");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [phase, artifact]);

  const showCaret = phase === "playing";

  return (
    <div ref={ref} className="flex flex-col gap-4">
      <h3
        className={cn(
          "text-ink font-display font-semibold leading-[1.08] tracking-[-0.02em]",
          density === "compact"
            ? "text-[1.35rem]"
            : "text-[1.75rem] sm:text-[2.1rem]"
        )}
      >
        {titleShown || "\u00A0"}
        {showCaret && blockCursor < 0 && titleShown.length < artifact.title.length && (
          <span className="caret-ink" />
        )}
      </h3>

      <div className="flex flex-col gap-3">
        {trimBlocksForDensity(artifact.blocks, density).map((block, i) => (
          <BlockView
            key={i}
            block={block}
            progress={blockProgress[i] ?? 0}
            active={blockCursor === i}
            done={phase === "done" || blockCursor > i}
            showCaret={showCaret && blockCursor === i}
            density={density}
          />
        ))}
      </div>
    </div>
  );
}

function BlockView({
  block,
  progress,
  active,
  done,
  showCaret,
  density,
}: {
  block: ArtifactBlock;
  progress: number;
  active: boolean;
  done: boolean;
  showCaret: boolean;
  density: "default" | "compact";
}) {
  const visible = active || done;

  if (block.type === "paragraph") {
    const text = done ? block.text : block.text.slice(0, progress);
    return (
      <p
        className={cn(
          "text-ink/85 leading-[1.6]",
          density === "compact" ? "text-[13.5px]" : "text-[14.5px]",
          !visible && "opacity-0"
        )}
      >
        {renderInline(text)}
        {showCaret && progress < block.text.length && <span className="caret-ink" />}
      </p>
    );
  }

  if (block.type === "table") {
    const rowsToShow = done ? block.rows.length : Math.max(0, progress);
    const isCompact = density === "compact";
    return (
      <div
        className={cn(
          // Desktop: clip (table always fits). Mobile: scroll x so the last
          // column is reachable instead of being cut off by the panel edge.
          "rounded-lg border border-slate-200 bg-white",
          "overflow-x-auto overflow-y-hidden md:overflow-hidden",
          !visible && "opacity-0"
        )}
      >
        <table
          className={cn(
            "w-full",
            isCompact ? "text-[12px]" : "text-[13px]"
          )}
          style={{ tableLayout: "auto", borderCollapse: "collapse" }}
        >
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200">
              {block.headers.map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    "text-left text-[10px] uppercase tracking-[0.1em] font-medium text-slate-500 whitespace-nowrap align-middle",
                    isCompact ? "px-2.5 py-1.5" : "px-3 py-2",
                    isNumericColumn(block.headers, i) && "text-right"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr
                key={ri}
                className={cn(
                  "border-b border-slate-100 last:border-b-0 transition-opacity",
                  ri < rowsToShow ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                style={{
                  transitionDuration: "var(--t-3)",
                  transitionTimingFunction: "var(--ease-spring-ish)",
                  transitionDelay: ri < rowsToShow ? `${ri * 30}ms` : "0ms",
                }}
              >
                {row.map((cell, ci) => (
                  <TableCellTd
                    key={ci}
                    value={cell}
                    isFirstCol={ci === 0}
                    isLastCol={ci === row.length - 1}
                    isNumeric={isNumericColumn(block.headers, ci)}
                    isCompact={isCompact}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // list
  const itemsToShow = done ? block.items.length : Math.max(0, progress);
  return (
    <ul className={cn("flex flex-col gap-1.5", !visible && "opacity-0")}>
      {block.items.map((item, i) => (
        <li
          key={i}
          className={cn(
            "text-ink/85 text-[13.5px] pl-4 relative transition-all",
            "before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[var(--color-accent)]",
            i < itemsToShow
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1"
          )}
          style={{
            transitionDuration: "var(--t-3)",
            transitionDelay: i < itemsToShow ? `${i * 20}ms` : "0ms",
          }}
        >
          {renderInline(item)}
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Cell treatment — detects pass/fail/threshold-style values and renders
// them as soft-bg + dot + text per enterprise-demo design tokens.
//
// Renders as a real <td> so the parent <table>'s table-layout: auto can
// size columns based on actual content rather than equal-thirds (which
// caused middle columns to ellipsis-collide with adjacent ones).
// ─────────────────────────────────────────────────────────────────────

function TableCellTd({
  value,
  isFirstCol,
  isLastCol,
  isNumeric,
  isCompact,
}: {
  value: string;
  isFirstCol: boolean;
  isLastCol: boolean;
  isNumeric: boolean;
  isCompact: boolean;
}) {
  const tone = detectTone(value);
  const baseClass = cn(
    "align-middle whitespace-nowrap",
    isCompact ? "px-2.5 py-1.5" : "px-3 py-2",
    isNumeric && "text-right tabular-nums font-mono"
  );

  if (tone && isLastCol) {
    return (
      <td className={baseClass}>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium",
            tone === "pass" && "bg-emerald-50 text-emerald-700",
            tone === "warn" && "bg-amber-50 text-accent-deep",
            tone === "fail" && "bg-red-50 text-red-700",
            tone === "neutral" && "bg-slate-50 text-slate-600"
          )}
        >
          <span
            className={cn(
              "h-1 w-1 rounded-full",
              tone === "pass" && "bg-emerald-500",
              tone === "warn" && "bg-amber-500",
              tone === "fail" && "bg-red-500",
              tone === "neutral" && "bg-slate-400"
            )}
          />
          {value}
        </span>
      </td>
    );
  }

  return (
    <td
      className={cn(
        baseClass,
        isFirstCol ? "text-ink font-medium" : "text-ink/85",
        // Middle non-numeric cells get mono for data feel
        !isFirstCol && !isLastCol && !isNumeric && "font-mono text-[0.92em]"
      )}
    >
      {renderInline(value)}
    </td>
  );
}

/**
 * Right-align the column when its header reads as a money/amount column.
 * The KYC "Value" column is mixed ("0.94" / "no match" / "medium") so we
 * keep that left-aligned — only the strictly-numeric columns flip right.
 */
function isNumericColumn(headers: string[], colIndex: number): boolean {
  const h = (headers[colIndex] ?? "").toLowerCase();
  return /\b(debit|credit|amount|total|qty|quantity)\b/.test(h);
}

function detectTone(s: string): "pass" | "warn" | "fail" | "neutral" | null {
  const v = s.toLowerCase();
  if (/\bpass\b|\bok\b|\bapproved?\b|\bclear\b/.test(v) || /✓/.test(s)) return "pass";
  if (/\bweak\b|\breview\b|\bextra review\b|\bhold\b|\bedd\b/.test(v)) return "warn";
  if (/\bfail\b|\breject\b|\bdecline\b/.test(v) || /✕|✗/.test(s)) return "fail";
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Inline rendering — turns `code` and **bold** into styled spans
// without pulling in a full markdown library.
// ─────────────────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  // Split on code fences first (greedy per backtick run), then bold.
  const parts: React.ReactNode[] = [];
  const codeRe = /`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = codeRe.exec(text)) !== null) {
    if (m.index > last) parts.push(renderBold(text.slice(last, m.index), key++));
    parts.push(
      <code
        key={`c${key++}`}
        className="inline-flex items-center rounded bg-slate-100 text-ink font-mono text-[0.88em] px-1 py-[1px] leading-[1.35]"
      >
        {m[1]}
      </code>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(renderBold(text.slice(last), key++));
  return parts.length ? parts : text;
}

function renderBold(text: string, key: number): React.ReactNode {
  const boldRe = /\*\*([^*]+)\*\*/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = key * 1000;
  while ((m = boldRe.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <strong key={`b${k++}`} className="text-ink font-semibold">
        {m[1]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

// ─────────────────────────────────────────────────────────────────────
// Content helpers
// ─────────────────────────────────────────────────────────────────────

function trimBlocksForDensity(
  blocks: ArtifactBlock[],
  density: "default" | "compact"
): ArtifactBlock[] {
  if (density !== "compact") return blocks;
  const firstParagraph = blocks.find((b) => b.type === "paragraph");
  const firstTable = blocks.find((b) => b.type === "table");
  const out: ArtifactBlock[] = [];
  if (firstParagraph) {
    if (firstParagraph.type === "paragraph") {
      const short =
        firstParagraph.text.length > 160
          ? firstParagraph.text.slice(0, 155).replace(/[,.;]\s*\S*$/, "") + "…"
          : firstParagraph.text;
      out.push({ type: "paragraph", text: short });
    }
  }
  if (firstTable && firstTable.type === "table") {
    out.push({
      type: "table",
      headers: firstTable.headers,
      // Show up to 4 rows so HR's 4-session day fits and KYC only loses
      // the least-important country-risk row.
      rows: firstTable.rows.slice(0, 4),
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Timing + trace helpers
// ─────────────────────────────────────────────────────────────────────

function charDelay(ch?: string): number {
  if (!ch) return 6;
  if (ch === "\n") return 45;
  if (",;:".includes(ch)) return 28;
  if (".!?".includes(ch)) return 48;
  if (ch === " ") return 4;
  return 5 + Math.random() * 6;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function estimateDuration(a?: Artifact): { totalMs: number } {
  if (!a) return { totalMs: 0 };
  let t = a.title.length * 17 + 120;
  for (const b of a.blocks) {
    if (b.type === "paragraph") t += b.text.length * 17 + 180;
    else if (b.type === "table") t += 160 + b.rows.length * 110 + 140;
    else t += b.items.length * 130 + 100;
  }
  return { totalMs: t };
}

function traceSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 8);
}

function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  const hex = (h >>> 0).toString(16);
  return hex.padStart(6, "0").slice(0, 6);
}
