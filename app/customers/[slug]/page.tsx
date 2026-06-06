import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cases, getCase } from "@/lib/cases";
import { Section } from "@/components/template/ui/section";
import { Button, ButtonArrow } from "@/components/template/ui/button";
import { Testimonial } from "@/components/template/ui/testimonial";
import {
  SectionHeading,
  SubHeading,
  Lead,
  Eyebrow,
  Caption,
} from "@/components/template/ui/typography";
import { Reveal } from "@/components/template/motion/reveal";

export const dynamicParams = false;

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getCase(slug);
  if (!c) return { title: "Story not found" };
  return {
    title: `${c.customer} · Case study`,
    description: c.tagline,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCase(slug);
  if (!c) notFound();

  const others = cases.filter((x) => x.slug !== c.slug);
  const speakerParts = c.speaker.split(",").map((s) => s.trim());
  const speakerCompany = speakerParts[1] ?? "Customer";
  const speakerTitle = speakerParts[0] ?? "Customer";

  return (
    <>
      {/* Hero testimonial — large pull quote on light surface */}
      <Section tone="light" py="generous" className="pt-28 md:pt-40">
        <Reveal>
          <Caption className="block text-mute uppercase tracking-[2px] font-medium">
            Customer · {c.sector}
          </Caption>
        </Reveal>
        <Reveal delay={120}>
          <blockquote className="mt-8 max-w-[24ch] font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] tracking-[-1.2px] text-ink">
            &ldquo;{c.pullQuote}&rdquo;
          </blockquote>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-8 font-sans text-[15px] text-mute">{c.speaker}</div>
        </Reveal>
      </Section>

      {/* Metric strip */}
      <Section tone="cool" py="tight">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {c.metrics.map((m, i) => (
            <Reveal key={m.label} delay={i * 80}>
              <div>
                <span className="block font-display font-normal text-[60px] leading-[1] tracking-[-1.2px] text-ink">
                  {m.value}
                </span>
                <Caption className="mt-3 block text-mute">{m.label}</Caption>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Narrative */}
      <Section tone="light" py="generous">
        <div className="mx-auto max-w-[760px] flex flex-col gap-12">
          <Reveal>
            <div>
              <Eyebrow>Problem</Eyebrow>
              <p className="mt-4 font-sans text-[18px] leading-[28px] text-ink">
                {c.problem}
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <Eyebrow>Solution</Eyebrow>
              <p className="mt-4 font-sans text-[18px] leading-[28px] text-ink">
                {c.solution}
              </p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div>
              <Eyebrow>Result</Eyebrow>
              <p className="mt-4 font-sans text-[18px] leading-[28px] text-ink">
                {c.result}
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Embedded short testimonial card */}
      <Section tone="warm" py="generous">
        <Reveal>
          <Testimonial
            quote={c.pullQuote}
            attribution={speakerCompany}
            attributionRole={speakerTitle}
            ctaHref="/customers"
            ctaText="See more stories"
          />
        </Reveal>
      </Section>

      {/* Other stories */}
      {others.length > 0 && (
        <Section tone="cool" py="generous">
          <Reveal>
            <Eyebrow>Read another story</Eyebrow>
            <SectionHeading className="mt-4 max-w-[28ch]">
              More from the first deployments.
            </SectionHeading>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {others.map((o, i) => (
              <Reveal key={o.slug} delay={i * 100}>
                <a
                  href={`/customers/${o.slug}`}
                  className="group flex items-center justify-between gap-4 rounded-[var(--radius-lg)] bg-pure-white p-6 transition-[background-color] duration-300 ease hover:bg-surface-warm"
                >
                  <div>
                    <Caption className="uppercase tracking-[2px] font-medium text-mute">
                      {o.sector}
                    </Caption>
                    <SubHeading as="h3" className="mt-3">
                      {o.customer}
                    </SubHeading>
                  </div>
                  <ButtonArrow className="text-mute transition-transform duration-300 ease group-hover:translate-x-1" />
                </a>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* Final CTA */}
      <Section tone="inverse" py="generous">
        <Reveal>
          <div className="text-center">
            <SectionHeading className="text-ink-inverse max-w-[24ch] mx-auto">
              Ready for your story?
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
