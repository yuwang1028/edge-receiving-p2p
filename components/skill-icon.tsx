import {
  ShieldCheck,
  Banknote,
  UserRound,
  Factory,
  Inbox,
  Fingerprint,
  Radar,
  Shield,
  Gavel,
  Archive,
  Receipt,
  Database,
  Tag,
  Scale,
  Check,
  Send,
  Briefcase,
  Server,
  BadgeCheck,
  Heart,
  Key,
  Calendar,
  Clipboard,
  Layers,
  Route,
  type LucideIcon,
} from "lucide-react";
import type { SkillSlug, StepIconKey } from "@/lib/skills";

const SKILL_ICONS: Record<SkillSlug, LucideIcon> = {
  kyc: ShieldCheck,
  finance: Banknote,
  hr: UserRound,
  erp: Factory,
};

const STEP_ICONS: Record<StepIconKey, LucideIcon> = {
  inbox: Inbox,
  fingerprint: Fingerprint,
  radar: Radar,
  shield: Shield,
  gavel: Gavel,
  archive: Archive,
  receipt: Receipt,
  database: Database,
  tag: Tag,
  scale: Scale,
  check: Check,
  send: Send,
  briefcase: Briefcase,
  server: Server,
  verified: BadgeCheck,
  heart: Heart,
  key: Key,
  calendar: Calendar,
  clipboard: Clipboard,
  layers: Layers,
  route: Route,
};

export function SkillIcon({
  slug,
  className,
}: {
  slug: SkillSlug;
  className?: string;
}) {
  const Icon = SKILL_ICONS[slug];
  return <Icon className={className} aria-hidden />;
}

export function skillIconFor(slug: SkillSlug): LucideIcon {
  return SKILL_ICONS[slug];
}

export function stepIconFor(key: StepIconKey | undefined): LucideIcon | undefined {
  if (!key) return undefined;
  return STEP_ICONS[key];
}
