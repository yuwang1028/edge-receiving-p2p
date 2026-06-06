import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSkill, listSkills } from "@/lib/skills";
import { Section } from "@/components/template/ui/section";
import { Hero as TemplateHero } from "@/components/template/ui/hero";
import { Button, ButtonArrow } from "@/components/template/ui/button";
import {
  SectionHeading,
  SubHeading,
  Lead,
  Eyebrow,
  Caption,
} from "@/components/template/ui/typography";
import { Reveal } from "@/components/template/motion/reveal";
import { SkillWorkflowSection } from "@/components/skill-workflow-section";
import { BrandLogo } from "@/components/brand-logo";
import { domainForBrand } from "@/lib/integrations";

export const dynamicParams = false;

export function generateStaticParams() {
  return listSkills().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const skill = getSkill(slug);
  if (!skill) return { title: "Skill not found" };
  return {
    title: `${skill.shortName} Skill`,
    description: skill.oneLiner,
  };
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const skill = getSkill(slug);
  if (!skill) notFound();

  return (
    <>
      <TemplateHero headline={skill.headline} body={skill.sub}>
        <Button variant="primary" size="lg" href="/demo">
          Request a demo
        </Button>
        <Button variant="underline" size="lg" href="#workflow">
          See the workflow
        </Button>
      </TemplateHero>

      {/* Big metric strip */}
      <Section tone="light" py="tight">
        <Reveal>
          <Caption className="block text-mute uppercase tracking-[2px] font-medium">
            {skill.category}
          </Caption>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-3">
          {skill.bigNumbers.map((n, i) => (
            <Reveal key={n.label} delay={i * 80}>
              <div>
                <span className="block font-display font-normal text-[60px] leading-[1] tracking-[-1.2px] text-ink">
                  {n.value}
                </span>
                <Caption className="mt-3 block text-mute">{n.label}</Caption>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Workflow + artifact embedded in deep surface */}
      <Section tone="deep" py="generous" id="workflow">
        <Reveal>
          <Eyebrow className="text-ink-inverse/70">The workflow</Eyebrow>
          <SectionHeading className="mt-4 text-ink-inverse max-w-[24ch]">
            Every step traced. Every decision reversible.
          </SectionHeading>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-12 rounded-[var(--radius-lg)] overflow-hidden bg-pure-white">
            <SkillWorkflowSection skill={skill} />
          </div>
        </Reveal>
      </Section>

      {/* Integrations */}
      <Section tone="cool" py="generous">
        <Reveal>
          <Eyebrow>Integrations</Eyebrow>
          <SectionHeading className="mt-4 max-w-[24ch]">
            Speaks to the tools your team already runs.
          </SectionHeading>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {skill.integrations.map((group, gi) => (
            <Reveal key={group.group} delay={gi * 80}>
              <div>
                <Caption className="uppercase tracking-[2px] font-medium text-ink-cta">
                  {group.group}
                </Caption>
                <ul className="mt-4 flex flex-col gap-3">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="inline-flex items-center gap-2 font-sans text-[15px] leading-[24px] text-ink"
                    >
                      <BrandLogo
                        name={item}
                        domain={domainForBrand(item)}
                        size={20}
                        className="rounded-sm"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Before / After */}
      <Section tone="warm" py="generous">
        <Reveal>
          <Eyebrow>Before vs. After</Eyebrow>
          <SectionHeading className="mt-4 max-w-[28ch]">
            What changes when this Skill comes online.
          </SectionHeading>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <Reveal>
            <article className="border-t border-ink/15 pt-6">
              <Caption className="uppercase tracking-[2px] font-medium text-mute">
                Before Bacumen
              </Caption>
              <SubHeading as="h3" className="mt-4">
                Manual triage. Slow audits.
              </SubHeading>
              <ul className="mt-6 space-y-4">
                {skill.before.map((b, i) => (
                  <li key={i} className="flex gap-3 font-sans text-[15px] leading-[24px] text-mute">
                    <span className="mt-[10px] inline-block h-[4px] w-[4px] shrink-0 rounded-full bg-mute" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
          <Reveal delay={120}>
            <article className="border-t border-ink-cta pt-6">
              <Caption className="uppercase tracking-[2px] font-medium text-ink-cta">
                With the {skill.shortName} Skill
              </Caption>
              <SubHeading as="h3" className="mt-4">
                Policy-checked. Audit-logged.
              </SubHeading>
              <ul className="mt-6 space-y-4">
                {skill.after.map((a, i) => (
                  <li key={i} className="flex gap-3 font-sans text-[15px] leading-[24px] text-ink">
                    <span className="mt-[10px] inline-block h-[4px] w-[4px] shrink-0 rounded-full bg-accent" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        </div>
      </Section>

      {/* Final CTA */}
      <Section tone="inverse" py="generous">
        <Reveal>
          <div className="text-center">
            <SectionHeading className="text-ink-inverse max-w-[28ch] mx-auto">
              Activate {skill.shortName} on your stack.
            </SectionHeading>
            <Lead className="mt-6 text-ink-inverse/80 max-w-[60ch] mx-auto">
              A 20-minute working session against your real cases.
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
