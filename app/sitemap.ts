import type { MetadataRoute } from "next";
import { listSkills } from "@/lib/skills";
import { cases } from "@/lib/cases";

const staticPaths = [
  "/",
  "/platform",
  "/skills",
  "/integrations",
  "/pricing",
  "/customers",
  "/about",
  "/demo",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const host = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bacumen.ai";
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${host}${p}`,
    lastModified,
    changeFrequency: "monthly",
    priority: p === "/" ? 1 : 0.8,
  }));

  for (const skill of listSkills()) {
    entries.push({
      url: `${host}/skills/${skill.slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    });
  }

  for (const c of cases) {
    entries.push({
      url: `${host}/customers/${c.slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}
