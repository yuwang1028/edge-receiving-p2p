import { Spinner } from "@/components/ai/Spinner";

/** Deliberate "agent is thinking" beat before each step's result, so actions feel
 * like reasoning, not instant. A fixed pause reads as fake, so with no argument
 * sleep() waits a RANDOM duration in [THINK_MIN_MS, THINK_MAX_MS]. */
export const THINK_MIN_MS = 1000;
export const THINK_MAX_MS = 3000;
export const randThinkMs = () => THINK_MIN_MS + Math.random() * (THINK_MAX_MS - THINK_MIN_MS);
export const sleep = (ms?: number) => new Promise((r) => setTimeout(r, ms ?? randThinkMs()));

/** Full-screen thinking indicator shown while a step is working. */
export function ThinkingOverlay({ label = "Thinking" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
      <div className="ai-spring flex items-center gap-3 rounded-xl bg-white border border-divider px-6 py-4 shadow-2xl">
        <Spinner size={16} />
        <span className="text-[13px] font-bold text-ink">{label}</span>
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-surface-deep/70 ai-pulse" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-surface-deep/70 ai-pulse" style={{ animationDelay: "200ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-surface-deep/70 ai-pulse" style={{ animationDelay: "400ms" }} />
        </span>
      </div>
    </div>
  );
}
