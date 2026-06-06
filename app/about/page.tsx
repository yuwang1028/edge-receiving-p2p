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

export const metadata: Metadata = {
  title: "About",
  description:
    "Bacumen is building the runtime and skills library that activate AI across the enterprise.",
};

const openRoles = [
  { role: "Founding Engineer", location: "NYC / Remote" },
  { role: "Design Partner Lead", location: "NYC / SF" },
  { role: "Developer Relations", location: "Remote" },
];

const PILLARS = [
  {
    eyebrow: "Mission",
    title: "Runtime, not chatbots.",
    body: "The next decade of enterprise AI is won by teams who ship runtime infrastructure. We're building both halves: the runtime, and the library of Skills that ride it.",
  },
  {
    eyebrow: "Approach",
    title: "Composable, not rip-and-replace.",
    body: "Our Skills sit on the SaaS your team already pays for — Persona, NetSuite, Workday, SAP. No migration. No re-platforming. Just policy-checked work.",
  },
  {
    eyebrow: "Discipline",
    title: "Audited, not vibes.",
    body: "Every action is policy-checked, audit-logged, and reversible. Decisions are reproducible from input, policy version, and the agent's reasoning trace.",
  },
];

export default function AboutPage() {
  return (
    <>
      <TemplateHero
        headline="Activate AI across the enterprise."
        body="We believe the next decade of enterprise AI is won by teams who ship runtime infrastructure — not chatbots. We're building both halves: the runtime, and the library of skills that ride it."
      >
        <Button variant="primary" size="lg" href="/demo">
          Request a demo
        </Button>
        <Button variant="underline" size="lg" href="#careers">
          See open roles
        </Button>
      </TemplateHero>

      {/* Three pillars */}
      <Section tone="cool" py="generous">
        <Reveal>
          <Eyebrow>Why we exist</Eyebrow>
          <SectionHeading className="mt-4 max-w-[28ch]">
            The runtime your stack should have had years ago.
          </SectionHeading>
        </Reveal>
        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 120}>
              <article>
                <Eyebrow>{p.eyebrow}</Eyebrow>
                <SubHeading as="h3" className="mt-4">
                  {p.title}
                </SubHeading>
                <p className="mt-4 max-w-[44ch] font-sans text-[15px] leading-[24px] text-mute">
                  {p.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Backed-by lockup */}
      <Section tone="warm" py="tight">
        <Reveal>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Caption className="uppercase tracking-[2px] font-medium text-mute italic">
              Backed by
            </Caption>
            <span
              className="inline-flex items-center gap-2 text-ink"
              aria-label="Google"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.6 12.23c0-.7-.06-1.36-.18-2H12v3.78h5.42a4.64 4.64 0 0 1-2.01 3.04v2.52h3.25c1.9-1.75 3-4.33 3-7.34z" fill="#4285F4" />
                <path d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.25-2.52c-.9.6-2.05.96-3.37.96-2.6 0-4.8-1.75-5.58-4.1H3.06v2.58A10 10 0 0 0 12 22z" fill="#34A853" />
                <path d="M6.42 13.91A6 6 0 0 1 6.1 12c0-.66.12-1.3.32-1.9V7.52H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.48l3.36-2.57z" fill="#FBBC05" />
                <path d="M12 5.88c1.47 0 2.78.51 3.82 1.5l2.87-2.87C16.95 2.92 14.68 2 12 2 8.1 2 4.73 4.22 3.06 7.52l3.36 2.58C7.2 7.63 9.4 5.88 12 5.88z" fill="#EA4335" />
              </svg>
              <span className="font-sans text-[15px] font-medium tracking-[-0.01em]">Google</span>
            </span>
            <span aria-hidden className="h-4 w-px bg-ink/15" />
            <span
              className="inline-flex items-center gap-2 text-ink"
              aria-label="Microsoft"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
              </svg>
              <span className="font-sans text-[15px] font-medium tracking-[-0.01em]">Microsoft</span>
            </span>
          </div>
        </Reveal>
      </Section>

      {/* Careers */}
      <Section tone="light" py="generous" id="careers">
        <Reveal>
          <Eyebrow>Careers</Eyebrow>
          <SectionHeading className="mt-4 max-w-[24ch]">
            We're hiring.
          </SectionHeading>
          <Lead className="mt-6 max-w-[56ch] text-mute">
            If you've shipped infrastructure at scale, know the pain of
            enterprise integration, or want to build the eval harness for a
            runtime that touches real money, write to us.
          </Lead>
        </Reveal>
        <ul className="mt-12 flex flex-col gap-3 max-w-[720px]">
          {openRoles.map((r, i) => (
            <Reveal key={r.role} delay={i * 80}>
              <li className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-ink/15 bg-pure-white p-5 transition-[border-color,background-color] duration-300 ease hover:border-ink hover:bg-surface-warm">
                <div>
                  <div className="font-sans text-[16px] font-medium text-ink">
                    {r.role}
                  </div>
                  <div className="font-sans text-[14px] text-mute">
                    {r.location}
                  </div>
                </div>
                <a
                  href="mailto:hiring@bacumen.ai"
                  className="inline-flex items-center gap-1.5 font-sans text-[15px] font-medium text-ink transition-opacity duration-300 ease hover:opacity-70"
                >
                  Apply
                  <ButtonArrow />
                </a>
              </li>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* Final CTA */}
      <Section tone="inverse" py="generous">
        <Reveal>
          <div className="text-center">
            <SectionHeading className="text-ink-inverse max-w-[24ch] mx-auto">
              Want to work with us?
            </SectionHeading>
            <Lead className="mt-6 text-ink-inverse/80 max-w-[60ch] mx-auto">
              Or deploy us. Either way — let's talk.
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
