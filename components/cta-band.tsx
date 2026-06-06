import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SkillSlug } from "@/lib/skills";

export function CtaBand({
  title = "Ready to activate your first Skill?",
  sub,
  primary = "Request a demo",
  source = "cta-band",
  skill,
}: {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  primary?: string;
  source?: string;
  skill?: SkillSlug;
}) {
  return (
    <section className="relative section-dark mesh-ambient grid-overlay py-24 lg:py-32 overflow-hidden">
      <div
        className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col items-start md:flex-row md:items-end md:justify-between gap-8"
        data-reveal="up"
      >
        <div>
          <h2 className="text-display-m lg:text-display-l text-cream max-w-[22ch] leading-[1.02] tracking-[-0.02em]">
            {title}
          </h2>
          {sub && (
            <p className="text-body text-cream/65 mt-4 max-w-[56ch]">{sub}</p>
          )}
        </div>
        <Button
          variant="primary"
          size="lg"
          className="shadow-[0_16px_48px_-16px_rgba(37, 99, 235,0.7)]"
          data-demo-trigger
          data-demo-source={source}
          {...(skill ? { "data-demo-skill": skill } : {})}
        >
          {primary}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </section>
  );
}
