import type { Metadata } from "next";
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
import { cases } from "@/lib/cases";

export const metadata: Metadata = {
  title: "Customers",
  description:
    "Stories from the first Bacumen deployments — Fintech X, Digital Lender Y, Crypto Exchange Z.",
};

export default function CustomersPage() {
  return (
    <>
      <TemplateHero
        headline="From the first Bacumen deployments."
        body="Fintech, digital lending, and crypto teams who activated their first Skill in under 60 days."
      >
        <Button variant="primary" size="lg" href="/demo">
          Request a demo
        </Button>
        <Button variant="underline" size="lg" href="#stories">
          Read the stories
        </Button>
      </TemplateHero>

      <Section tone="cool" py="generous" id="stories">
        <Reveal>
          <Eyebrow>Stories</Eyebrow>
          <SectionHeading className="mt-4 max-w-[28ch]">
            Skills, shipped. Outcomes, signed.
          </SectionHeading>
        </Reveal>
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {cases.map((c, i) => (
            <Reveal key={c.slug} delay={i * 100}>
              <a
                href={`/customers/${c.slug}`}
                className="group flex h-full flex-col gap-6 rounded-[var(--radius-lg)] bg-pure-white p-8 transition-[background-color,color] duration-300 ease hover:bg-surface-warm"
              >
                <div>
                  <Caption className="uppercase tracking-[2px] font-medium text-mute">
                    {c.sector}
                  </Caption>
                  <SubHeading as="h3" className="mt-4">
                    {c.customer}
                  </SubHeading>
                  <p className="mt-3 font-sans text-[15px] leading-[24px] text-mute">
                    {c.tagline}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  {c.metrics.slice(0, 2).map((m) => (
                    <span
                      key={m.label}
                      className="rounded-full border border-ink/15 px-3 py-1 font-sans text-[13px] leading-[20px] text-ink"
                    >
                      <span className="font-medium text-ink-cta">{m.value}</span>{" "}
                      {m.label.toLowerCase()}
                    </span>
                  ))}
                </div>
                <div className="font-sans text-[15px] font-medium text-ink inline-flex items-center gap-1.5 transition-[gap] duration-300 ease group-hover:gap-3">
                  Read the story
                  <ButtonArrow />
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="inverse" py="generous">
        <Reveal>
          <div className="text-center">
            <SectionHeading className="text-ink-inverse max-w-[24ch] mx-auto">
              Your story next.
            </SectionHeading>
            <Lead className="mt-6 text-ink-inverse/80 max-w-[60ch] mx-auto">
              Design-partner spots for 2026 are open.
            </Lead>
            <div className="mt-10 inline-flex">
              <Button variant="primary-inverse" size="lg" href="/demo">
                Become a design partner
                <ButtonArrow className="ml-1" />
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
