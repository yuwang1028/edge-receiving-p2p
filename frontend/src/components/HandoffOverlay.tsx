import { Spinner } from "@/components/ai/Spinner";
import { ArrowRight } from "lucide-react";

/** Brief full-screen beat shown while one agent hands the work to the next,
 * before the auto-navigation fires. */
export function HandoffOverlay({ to }: { to: string }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="ai-spring flex items-center gap-3 rounded-xl bg-surface-deep text-ink-inverse px-6 py-4 shadow-2xl">
        <Spinner size={16} tone="ink-inverse" />
        <span className="text-[13px] font-bold inline-flex items-center gap-1.5">Handing off to {to} <ArrowRight size={15} /></span>
      </div>
    </div>
  );
}
