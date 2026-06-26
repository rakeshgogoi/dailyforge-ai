import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/tools";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const home: MetadataRoute.Sitemap[number] = {
    url: SITE_URL,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 1,
  };
  const tools: MetadataRoute.Sitemap = CATEGORIES.flatMap((c) =>
    c.tools.map((t) => ({
      url: `${SITE_URL}/tools/${c.slug}/${t.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  );
  return [home, ...tools];
}
