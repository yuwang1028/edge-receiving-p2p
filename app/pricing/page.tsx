import type { Metadata } from "next";
import { Check } from "lucide-react";
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
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Bacumen pricing — three tiers, every engagement starts with a working session on your real cases.",
};

const tiers = [
  {
    name: "Activate",
    tagline: "One Skill. One team. One clean win.",
    price: "Starting at $5K / yr",
    features: [
      "1 Skill",
      "Up to 3 adapters",
      "Up to 500 FTE",
      "Policy pack editing",
      "Email support",
    ],
    cta: "Book a call",
    featured: false,
  },
  {
    name: "Platform",
    tagline: "Multiple Skills. Shared runtime.",
    price: "Starting at $10K / yr",
    features: [
      "Up to 3 Skills",
      "Up to 10 adapters",
      "SOC 2 Type II artifacts",
      "Named CSM",
      "Priority support",
    ],
    cta: "Book a call",
    featured: true,
  },
  {
    name: "Enterprise",
    tagline: "Regulated scale. Private deployment.",
    price: "Custom",
    features: [
      "Unlimited Skills",
      "Custom policy packs",
      "Private VPC",
      "24×7 SLA",
      "Dedicated solutions team",
    ],
    cta: "Contact sales",
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <TemplateHero
        headline="Priced like platforms, not seats."
        body="Every engagement starts with a working session on your real cases. No self-serve checkout, no per-seat SaaS math."
      >
        <Button variant="primary" size="lg" href="/demo">
          Book a demo
        </Button>
        <Button variant="underline" size="lg" href="#tiers">
          Compare tiers
        </Button>
      </TemplateHero>

      <Section tone="warm" py="generous" id="tiers">
        <Reveal>
          <Eyebrow>Three tiers</Eyebrow>
          <SectionHeading className="mt-4 max-w-[24ch]">
            Pick the shape that fits your stack.
          </SectionHeading>
        </Reveal>
        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {tiers.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 100}>
              <article
                className={cn(
                  "flex h-full flex-col gap-6 p-8 md:p-10",
                  "rounded-[var(--radius-lg)]",
                  "transition-[background-color,color] duration-300 ease",
                  tier.featured
                    ? "bg-surface-deep text-ink-inverse"
                    : "bg-pure-white text-ink"
                )}
              >
                <div>
                  <Caption
                    className={cn(
                      "uppercase tracking-[2px] font-medium",
                      tier.featured ? "text-ink-inverse/70" : "text-mute"
                    )}
                  >
                    {tier.name}
                  </Caption>
                  <SubHeading
                    as="h3"
                    className={cn(
                      "mt-4",
                      tier.featured ? "text-ink-inverse" : ""
                    )}
                  >
                    {tier.tagline}
                  </SubHeading>
                </div>
                <div
                  className={cn(
                    "font-display whitespace-nowrap text-[26px] md:text-[28px] lg:text-[30px] leading-[1.05] tracking-[-1px]",
                    tier.featured ? "text-ink-inverse" : "text-ink"
                  )}
                >
                  {tier.price}
                </div>
                <ul className="flex flex-1 flex-col gap-3">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className={cn(
                        "flex items-start gap-2.5 font-sans text-[15px] leading-[24px]",
                        tier.featured ? "text-ink-inverse/80" : "text-ink"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 mt-1 shrink-0",
                          tier.featured ? "text-accent" : "text-ink-cta"
                        )}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.featured ? "primary-inverse" : "primary"}
                  size="md"
                  href="/demo"
                  className="mt-auto"
                >
                  {tier.cta}
                  <ButtonArrow className="ml-1" />
                </Button>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="inverse" py="generous">
        <Reveal>
          <div className="text-center">
            <SectionHeading className="text-ink-inverse max-w-[24ch] mx-auto">
              Not sure where you fit?
            </SectionHeading>
            <Lead className="mt-6 text-ink-inverse/80 max-w-[60ch] mx-auto">
              Tell us your stack and your use case. We'll tell you honestly.
            </Lead>
            <div className="mt-10 inline-flex">
              <Button variant="primary-inverse" size="lg" href="/demo">
                Book a demo
                <ButtonArrow className="ml-1" />
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
