import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComingSoonPanel() {
  return (
    <div className="rounded-2xl border border-dashed border-divider bg-cream/60 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
      <div className="flex items-start gap-4 flex-1">
        <div className="h-10 w-10 rounded-lg bg-ink-cta/10 text-ink-cta grid place-items-center shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-mono text-muted">Coming soon</div>
          <h3 className="text-h2 text-ink mt-1">More Skills on the way.</h3>
          <p className="text-body-s text-muted mt-1 max-w-[52ch]">
            Every new Skill rides the same runtime. Tell us what you&apos;d
            run next and we&apos;ll scope a design-partner engagement.
          </p>
        </div>
      </div>
      <Button variant="primary" data-demo-trigger data-demo-source="coming-soon">
        Tell us what you&apos;d run
      </Button>
    </div>
  );
}
