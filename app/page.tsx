import { Section } from "@/components/template/ui/section";
import { Hero as TemplateHero } from "@/components/template/ui/hero";
import { Button, ButtonArrow } from "@/components/template/ui/button";
import { LogoStrip } from "@/components/template/ui/logo-strip";
import { ModelCard } from "@/components/template/ui/model-card";
import { IndustryCard } from "@/components/template/ui/industry-card";
import {
  SectionHeading,
  SubHeading,
  Lead,
  Body,
  Eyebrow,
  Caption,
} from "@/components/template/ui/typography";
import { Reveal } from "@/components/template/motion/reveal";
import { LiveArtifactPanel } from "@/components/live-artifact-panel";
import { ChaosCollage } from "@/components/template/ui/chaos-collage";
import { listSkills } from "@/lib/skills";

/**
 * Bacumen home — composed entirely from template primitives + Bacumen
 * verbatim text. Section sequence mirrors the canonical reference (hero
 * → trust strip → 3-col value props → product spotlight → industries →
 * skills grid → stats → testimonial → final CTA → footer) with all
 * strings sourced from Bacumen.
 */

const TRUSTED_BY = [
  { name: "SAP", domain: "sap.com" },
  { name: "Oracle", domain: "oracle.com" },
  { name: "Microsoft Dynamics 365", domain: "microsoft.com" },
  { name: "Workday", domain: "workday.com" },
  { name: "NetSuite", domain: "netsuite.com" },
  { name: "Slack", domain: "slack.com" },
  { name: "Persona", domain: "withpersona.com" },
  { name: "Veriff", domain: "veriff.com" },
  { name: "Google Workspace", domain: "workspace.google.com" },
  { name: "Okta", domain: "okta.com" },
];

const VALUE_PROPS = [
  {
    eyebrow: "Safe",
    title: "Safe.",
    body: "Runs in your cloud or ours. SOC 2 in progress. Every action checked against your policy before it runs.",
  },
  {
    eyebrow: "Composable",
    title: "Composable.",
    body: "Each Skill works on top of the tools your teams already use — no replacement, no migration, no rip-out.",
  },
  {
    eyebrow: "Governed",
    title: "Governed.",
    body: "Every policy is versioned and reversible. Every decision can be replayed from input through reasoning to outcome.",
  },
];

const STATS = [
  { v: "90%", l: "Reduction in KYC reviewer time" },
  { v: "$5M", l: "Annual cost savings" },
  { v: "4–8 wk", l: "To ship a new Skill" },
  { v: "99.3%", l: "Auto-categorization rate" },
];

const INDUSTRIES = [
  { name: "Financial Services", imageUrl: "/industries/financial-services.jpg" },
  { name: "Manufacturing", imageUrl: "/industries/manufacturing.jpg" },
  { name: "Technology", imageUrl: "/industries/technology.jpg" },
  { name: "Retail", imageUrl: "/industries/retail.jpg" },
  { name: "Healthcare", imageUrl: "/industries/healthcare.jpg" },
];

const INDUSTRY_GRADIENTS = [
  "bg-gradient-to-br from-surface-deep to-surface-navy",
  "bg-gradient-to-br from-surface-warm to-surface-cool",
  "bg-gradient-to-br from-surface-navy to-surface-deep",
  "bg-gradient-to-br from-accent to-accent-deep",
  "bg-gradient-to-br from-surface-cool to-surface-warm",
];

const PROOF_POINTS = [
  {
    eyebrow: "Audit-grade",
    title: "Every decision, replayable.",
    body: "Each agent action carries the input, the policy version that scored it, and the reasoning trace — exportable to your SIEM or auditor on day one.",
  },
  {
    eyebrow: "Policy-versioned",
    title: "Reverse a decision, not a system.",
    body: "Policies live in version control. Roll forward, roll back, A/B them in shadow mode. No engineering ticket required.",
  },
  {
    eyebrow: "Your cloud",
    title: "Runs where your data lives.",
    body: "Deploy into your own cloud account or our managed runtime. Customer data never leaves your perimeter unless you say so.",
  },
  {
    eyebrow: "Your stack",
    title: "Composes with what you have.",
    body: "Each Skill plugs into the tools your teams already use. Bring one Skill into your stack in 4–8 weeks, keep everything else.",
  },
];

export default function HomePage() {
  const skills = listSkills();

  return (
    <>
      {/* 1 · Hero */}
      <TemplateHero
        headline="Transform your enterprise with AI."
        body="AI agents that work on the tools your teams already use — every decision audited, every policy reversible."
      >
        <Button variant="primary" size="lg" href="/demo">
          Request a demo
        </Button>
        <Button variant="underline" size="lg" href="/platform">
          See the platform
        </Button>
      </TemplateHero>

      {/* 2 · Trust strip */}
      <Section tone="light" py="tight">
        <Reveal>
          <Caption className="block text-center text-mute uppercase tracking-[2px] font-medium">
            Composes with the tools your teams already use
          </Caption>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-12">
            <LogoStrip customers={TRUSTED_BY} />
          </div>
        </Reveal>
      </Section>

      {/* 3 · Safe. Composable. Governed. */}
      <Section tone="cool" py="generous">
        <Reveal>
          <SectionHeading className="max-w-[24ch]">
            Safe. Composable. Governed.
          </SectionHeading>
        </Reveal>
        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {VALUE_PROPS.map((v, i) => (
            <Reveal key={v.title} delay={i * 120}>
              <article>
                <Eyebrow>{v.eyebrow}</Eyebrow>
                <SubHeading as="h3" className="mt-4">
                  {v.title}
                </SubHeading>
                <Body className="mt-4 max-w-[44ch]">{v.body}</Body>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 4 · Chaos collage — "before / why you need us" illustration */}
      <ChaosCollage />

      {/* 5 · Product spotlight — LiveArtifactPanel embedded in dark surface */}
      <Section tone="deep" py="generous">
        <Reveal>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20 lg:items-center">
            <div>
              <Eyebrow className="text-ink-inverse/70">Live agent</Eyebrow>
              <SectionHeading className="mt-4 text-ink-inverse max-w-[20ch]">
                Watch the agent write the case.
              </SectionHeading>
              <Lead className="mt-8 text-ink-inverse/80 max-w-[44ch]">
                A single KYC case streamed live: identity signals in, watchlist screen, policy evaluation, signed decision out — every line cited, every step reversible.
              </Lead>
              <div className="mt-10">
                <Button variant="primary-inverse" size="lg" href="/platform">
                  Explore the runtime
                  <ButtonArrow className="ml-1" />
                </Button>
              </div>
            </div>
            <div className="rounded-[var(--radius-lg)] overflow-hidden bg-pure-white p-1 shadow-[var(--shadow-card)]">
              <LiveArtifactPanel
                artifacts={skills.map((s) => s.artifact)}
                density="compact"
              />
            </div>
          </div>
        </Reveal>
      </Section>

      {/* 5 · Industries */}
      <Section tone="light" py="generous">
        <Reveal>
          <SectionHeading className="max-w-[28ch]">
            Powering progress across industries.
          </SectionHeading>
        </Reveal>
        <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-5">
          {INDUSTRIES.map((industry, i) => (
            <Reveal key={industry.name} delay={i * 80}>
              <IndustryCard
                name={industry.name}
                imageUrl={industry.imageUrl}
                placeholderClass={
                  INDUSTRY_GRADIENTS[i % INDUSTRY_GRADIENTS.length]
                }
              />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 6 · Skills library — ModelCards */}
      <Section tone="warm" py="generous">
        <Reveal>
          <Eyebrow>The Library</Eyebrow>
          <SectionHeading className="mt-4 max-w-[28ch]">
            Skills your stack can activate.
          </SectionHeading>
        </Reveal>
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {skills.map((skill, i) => (
            <Reveal key={skill.slug} delay={i * 100}>
              <ModelCard
                name={skill.shortName}
                tagline={skill.oneLiner}
                bullets={skill.bigNumbers.map((n) => `${n.value} — ${n.label}`)}
                ctaHref={`/skills/${skill.slug}`}
                ctaText="Learn more"
                tone={i % 2 === 0 ? "deep" : "navy"}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 7 · Stats — "Proof, not vibes" */}
      <Section tone="light" py="generous">
        <Reveal>
          <Eyebrow>Proof, not vibes</Eyebrow>
          <SectionHeading className="mt-4 max-w-[28ch]">
            Numbers your audit committee can sign.
          </SectionHeading>
        </Reveal>
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.v} delay={i * 80}>
              <div>
                <span className="block font-display font-normal text-[40px] sm:text-[60px] leading-[1] tracking-[-1.2px] text-ink">
                  {s.v}
                </span>
                <Caption className="mt-3 block text-mute">{s.l}</Caption>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 8 · Audit-grade proof points (capability cards) */}
      <Section tone="light" py="generous">
        <Reveal>
          <Eyebrow>Audit-grade by design</Eyebrow>
          <SectionHeading className="mt-4 max-w-[32ch]">
            Built for the controls your committee already asks for.
          </SectionHeading>
        </Reveal>
        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          {PROOF_POINTS.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <article className="border-t border-divider pt-8">
                <Eyebrow>{p.eyebrow}</Eyebrow>
                <SubHeading as="h3" className="mt-3">
                  {p.title}
                </SubHeading>
                <Body className="mt-4 max-w-[52ch]">{p.body}</Body>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 9 · Final CTA */}
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
