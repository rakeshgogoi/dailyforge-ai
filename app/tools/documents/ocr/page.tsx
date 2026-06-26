import Link from "next/link";
import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolSeo } from "@/components/seo/tool-seo";
import { ToolBottomSeo } from "@/components/seo/tool-bottom-seo";
import { ToolPageAd } from "@/components/ads/tool-page-ad";
import { OcrForm } from "./ocr-form";

const match = getTool("documents", "ocr")!;

export const metadata = toolMetadata("documents", "ocr");

export default function OcrPage() {
  const { category: cat, tool } = match;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-16">
      <ToolSeo category="documents" slug="ocr" />
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/#${cat.slug}`} className="hover:text-foreground">{cat.name}</Link>
      </nav>
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{tool.name}</h1>
      <p className="mt-2 text-muted-foreground">{tool.blurb}</p>

      <OcrForm />
      <ToolPageAd />
      <ToolBottomSeo category="documents" slug="ocr" />
    </div>
  );
}
