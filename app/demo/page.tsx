import type { Metadata } from "next";
import { Section } from "@/components/template/ui/section";
import { Hero as TemplateHero } from "@/components/template/ui/hero";
import {
  SectionHeading,
  Eyebrow,
  Caption,
} from "@/components/template/ui/typography";
import { Reveal } from "@/components/template/motion/reveal";
import { DemoForm } from "@/components/demo-form";
import type { SkillSlug } from "@/lib/skills";

export const metadata: Metadata = {
  title: "Request a demo",
  description:
    "A 20-minute working session against your real cases. No slideware.",
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const { skill } = await searchParams;
  const defaultSkills: SkillSlug[] = ["kyc", "finance", "hr", "erp"].includes(
    skill ?? ""
  )
    ? ([skill] as SkillSlug[])
    : [];

  return (
    <>
      <TemplateHero
        headline="Book a 20-minute working session."
        body="A member of our team will reach out to schedule. No sales blitz, no slideware — we'll walk through your real cases live."
      />

      {/* Form card on warm surface */}
      <Section tone="warm" py="generous">
        <Reveal>
          <div className="mx-auto max-w-[760px]">
            <Caption className="block text-mute uppercase tracking-[2px] font-medium">
              See Bacumen on your own cases
            </Caption>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="mx-auto mt-8 max-w-[760px] rounded-[var(--radius-lg)] bg-pure-white p-6 md:p-10">
            <DemoForm
              variant="inline"
              defaultSkills={defaultSkills}
              source="demo-page"
            />
          </div>
        </Reveal>
      </Section>

      {/* Trust + reassurance strip */}
      <Section tone="cool" py="tight">
        <Reveal>
          <div className="mx-auto max-w-[760px] flex flex-col gap-2 text-center">
            <Eyebrow>What to expect</Eyebrow>
            <SectionHeading className="mt-2 max-w-[28ch] mx-auto">
              Real cases, real policy, real audit trail.
            </SectionHeading>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
