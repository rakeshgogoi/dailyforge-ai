import Link from "next/link";
import { notFound } from "next/navigation";
import { getTool } from "@/lib/tools";

type Params = Promise<{ category: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { category, slug } = await params;
  const match = getTool(category, slug);
  if (!match) return { title: "Tool not found" };
  return {
    title: `${match.tool.name} — dailyforge·ai`,
    description: match.tool.blurb,
  };
}

export default async function ToolPage({ params }: { params: Params }) {
  const { category, slug } = await params;
  const match = getTool(category, slug);
  if (!match) notFound();
  const { category: cat, tool } = match;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <nav className="text-sm text-zinc-500 mb-6">
        <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/#${cat.slug}`} className="hover:text-zinc-900 dark:hover:text-zinc-100">{cat.name}</Link>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">{tool.name}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{tool.blurb}</p>

      <div className="mt-10 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center">
        <div className="text-zinc-400 text-sm uppercase tracking-wider">Coming soon</div>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          This tool is on the build list. The platform shell is up — we'll wire each tool in next.
        </p>
      </div>
    </div>
  );
}
