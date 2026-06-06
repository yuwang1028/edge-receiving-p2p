import type { Metadata } from "next";
import { Section } from "@/components/template/ui/section";
import { Hero as TemplateHero } from "@/components/template/ui/hero";
import { Button, ButtonArrow } from "@/components/template/ui/button";
import { LogoStrip } from "@/components/template/ui/logo-strip";
import {
  SectionHeading,
  Lead,
  Eyebrow,
  Caption,
} from "@/components/template/ui/typography";
import { Reveal } from "@/components/template/motion/reveal";
import { BrandLogo } from "@/components/brand-logo";
import {
  integrations,
  integrationCategories,
  type IntegrationCategory,
} from "@/lib/integrations";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Bacumen connects to the ~20 systems your teams already use — compliance, finance, HR, ERP, data, messaging.",
};

export default function IntegrationsPage() {
  const categoryGroups = integrationCategories
    .filter((c) => c.key !== "all")
    .map((c) => ({
      key: c.key as IntegrationCategory,
      label: c.label,
      items: integrations.filter((i) => i.category === c.key),
    }));

  const featured = integrations
    .slice(0, 10)
    .map((i) => ({ name: i.name, domain: i.domain }));

  return (
    <>
      <TemplateHero
        headline="Bacumen connects to the ~20 systems your teams already use."
        body="Every adapter ships with write-safe defaults, idempotent calls, and a full audit trail."
      >
        <Button variant="primary" size="lg" href="/demo">
          Request a demo
        </Button>
        <Button variant="underline" size="lg" href="#categories">
          See the catalog
        </Button>
      </TemplateHero>

      {/* Trust strip */}
      <Section tone="light" py="tight">
        <Reveal>
          <Caption className="block text-center text-mute uppercase tracking-[2px] font-medium">
            Live across your existing stack.
          </Caption>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-12">
            <LogoStrip customers={featured} />
          </div>
        </Reveal>
      </Section>

      {/* Categorized grid */}
      <Section tone="cool" py="generous" id="categories">
        <Reveal>
          <Eyebrow>Catalog</Eyebrow>
          <SectionHeading className="mt-4 max-w-[28ch]">
            Compliance, Finance, HR, ERP, Data, Messaging.
          </SectionHeading>
        </Reveal>

        <div className="mt-16 flex flex-col gap-16">
          {categoryGroups.map((group, gi) => (
            <Reveal key={group.key} delay={gi * 80}>
              <div>
                <div className="flex items-baseline justify-between border-b border-ink/15 pb-4">
                  <Caption className="uppercase tracking-[2px] font-medium text-ink-cta">
                    {group.label}
                  </Caption>
                  <Caption className="text-mute">{group.items.length} integrations</Caption>
                </div>
                <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {group.items.map((item) => (
                    <li
                      key={item.slug}
                      className="flex items-center gap-3 rounded-[var(--radius-md)] bg-pure-white p-4 transition-[background-color] duration-300 ease hover:bg-surface-warm"
                    >
                      <BrandLogo
                        name={item.name}
                        domain={item.domain}
                        size={28}
                        className="rounded-sm shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-sans text-[15px] leading-[20px] text-ink truncate">
                          {item.name}
                        </div>
                        <div className="font-sans text-[12px] leading-[16px] text-mute uppercase tracking-[1px]">
                          {item.status}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <Section tone="inverse" py="generous">
        <Reveal>
          <div className="text-center">
            <SectionHeading className="text-ink-inverse max-w-[24ch] mx-auto">
              Don't see your tool?
            </SectionHeading>
            <Lead className="mt-6 text-ink-inverse/80 max-w-[60ch] mx-auto">
              Adapters can be built in days, not quarters.
            </Lead>
            <div className="mt-10 inline-flex">
              <Button variant="primary-inverse" size="lg" href="/demo">
                Talk to us
                <ButtonArrow className="ml-1" />
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
