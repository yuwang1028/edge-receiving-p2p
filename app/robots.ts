import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const host = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bacumen.ai";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dev", "/api"] }],
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
