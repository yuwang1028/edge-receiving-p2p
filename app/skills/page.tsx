import type { Metadata } from "next";
import { Section } from "@/components/template/ui/section";
import { Hero as TemplateHero } from "@/components/template/ui/hero";
import { Button, ButtonArrow } from "@/components/template/ui/button";
import { SkillsLibraryCard } from "@/components/skills-library-card";
import {
  SectionHeading,
  Lead,
  Eyebrow,
  Caption,
} from "@/components/template/ui/typography";
import { Reveal } from "@/components/template/motion/reveal";
import { listSkills } from "@/lib/skills";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "The library of Bacumen Skills: KYC, Finance, HR, ERP — each a production pattern built on the same runtime.",
};

const COMING_SOON = [
  { name: "Procurement", body: "PO match, vendor risk, three-way reconciliation." },
  { name: "Legal", body: "Contract review, redline triage, clause-library lookup." },
  { name: "Risk", body: "Continuous control monitoring, exception triage, evidence packs." },
  { name: "IT Ops", body: "Access reviews, ticket triage, change-management policy checks." },
];

export default function SkillsIndexPage() {
  const skills = listSkills();

  return (
    <>
      <TemplateHero
        headline="Pick a Skill. Activate it on your stack."
        body="Every Skill is a production pattern — policy-checked, audit-logged, and integrated with the systems your team already runs."
      >
        <Button variant="primary" size="lg" href="/demo">
          Request a demo
        </Button>
        <Button variant="underline" size="lg" href="#first-skill">
          See the Skills below
        </Button>
      </TemplateHero>

      {/* Skills library — ModelCards */}
      <Section tone="warm" py="generous" id="first-skill">
        <Reveal>
          <Eyebrow>The Library</Eyebrow>
          <SectionHeading className="mt-4 max-w-[28ch]">
            Skills your stack can activate today.
          </SectionHeading>
        </Reveal>
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {skills.map((skill, i) => (
            <Reveal key={skill.slug} delay={i * 100}>
              <SkillsLibraryCard
                skill={skill}
                tone={i % 2 === 0 ? "deep" : "navy"}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Coming soon — light cool grid */}
      <Section tone="cool" py="generous">
        <Reveal>
          <Eyebrow>On the roadmap</Eyebrow>
          <SectionHeading className="mt-4 max-w-[28ch]">
            More Skills, more patterns. Each one production-ready.
          </SectionHeading>
        </Reveal>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {COMING_SOON.map((s, i) => (
            <Reveal key={s.name} delay={i * 80}>
              <article className="border-t border-ink/15 pt-6">
                <Caption className="uppercase tracking-[2px] font-medium text-mute">
                  Coming soon
                </Caption>
                <h3 className="mt-3 font-display text-[24px] leading-[1.15] tracking-[-0.5px] text-ink">
                  {s.name}
                </h3>
                <p className="mt-3 font-sans text-[15px] leading-[24px] text-mute">
                  {s.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <Section tone="inverse" py="generous">
        <Reveal>
          <div className="text-center">
            <SectionHeading className="text-ink-inverse max-w-[24ch] mx-auto">
              Ready to activate your first Skill?
            </SectionHeading>
            <Lead className="mt-6 text-ink-inverse/80 max-w-[60ch] mx-auto">
              Bring one Skill into your stack in 4–8 weeks. Keep the SaaS
              you already pay for. Keep the audit trail your committee asks for.
            </Lead>
            <div className="mt-10 inline-flex">
              <Button variant="primary-inverse" size="lg" href="/demo">
                Request a demo
                <ButtonArrow className="ml-1" />
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
