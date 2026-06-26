import Link from "next/link";
import { notFound } from "next/navigation";
import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolSeo } from "@/components/seo/tool-seo";
import { ToolBottomSeo } from "@/components/seo/tool-bottom-seo";

type Params = Promise<{ category: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { category, slug } = await params;
  return toolMetadata(category, slug);
}

export default async function ToolPage({ params }: { params: Params }) {
  const { category, slug } = await params;
  const match = getTool(category, slug);
  if (!match) notFound();
  const { category: cat, tool } = match;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <ToolSeo category={cat.slug} slug={tool.slug} />
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/#${cat.slug}`} className="hover:text-foreground">{cat.name}</Link>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">{tool.name}</h1>
      <p className="mt-2 text-muted-foreground">{tool.blurb}</p>

      <div className="mt-10 rounded-2xl border-2 border-dashed border-border p-12 text-center">
        <div className="text-muted-foreground text-sm uppercase tracking-wider">Coming soon</div>
        <p className="mt-3 text-muted-foreground">
          This tool is on the build list. The platform shell is up — we&apos;ll wire each tool in next.
        </p>
      </div>
      <ToolBottomSeo category={cat.slug} slug={tool.slug} />
    </div>
  );
}
