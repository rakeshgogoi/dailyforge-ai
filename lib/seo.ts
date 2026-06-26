import type { Metadata } from "next";
import { getTool } from "./tools";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://dailyforge.ai";

export function toolMetadata(categorySlug: string, toolSlug: string): Metadata {
  const match = getTool(categorySlug, toolSlug);
  if (!match) return { title: "Tool not found — dailyforge·ai" };
  const { category, tool } = match;
  const path = `/tools/${category.slug}/${tool.slug}`;
  const title = `${tool.name} — free online tool · dailyforge·ai`;
  const description = tool.blurb;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      siteName: "dailyforge·ai",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function toolJsonLd(categorySlug: string, toolSlug: string) {
  const match = getTool(categorySlug, toolSlug);
  if (!match) return null;
  const { tool } = match;
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.blurb,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${SITE_URL}/tools/${categorySlug}/${toolSlug}`,
  };
}
