import type { Metadata } from "next";
import { PlatformSkillPicker } from "@/components/platform-skill-picker";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "Pick a Skill. Activate it on your stack. The Bacumen platform — 48 enterprise AI skills across KYC, Finance, HR, and ERP.",
};

export default function PlatformPage() {
  return (
    <main>
      <PlatformSkillPicker />
    </main>
  );
}
