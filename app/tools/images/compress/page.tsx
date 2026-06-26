import Link from "next/link";
import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolSeo } from "@/components/seo/tool-seo";
import { ToolBottomSeo } from "@/components/seo/tool-bottom-seo";
import { ImageCompressForm } from "./compress-form";

const match = getTool("images", "compress")!;

export const metadata = toolMetadata("images", "compress");

export default function ImageCompressPage() {
  const { category: cat, tool } = match;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <ToolSeo category="images" slug="compress" />
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/#${cat.slug}`} className="hover:text-foreground">{cat.name}</Link>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">{tool.name}</h1>
      <p className="mt-2 text-muted-foreground">{tool.blurb}</p>

      <ImageCompressForm />
      <ToolBottomSeo category="images" slug="compress" />
    </div>
  );
}
