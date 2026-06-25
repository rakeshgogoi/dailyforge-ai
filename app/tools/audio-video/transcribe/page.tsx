import Link from "next/link";
import { getTool } from "@/lib/tools";
import { TranscribeForm } from "./transcribe-form";

const match = getTool("audio-video", "transcribe")!;

export const metadata = {
  title: `${match.tool.name} — dailyforge·ai`,
  description: match.tool.blurb,
};

export default function TranscribePage() {
  const { category: cat, tool } = match;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/#${cat.slug}`} className="hover:text-foreground">{cat.name}</Link>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">{tool.name}</h1>
      <p className="mt-2 text-muted-foreground">{tool.blurb}</p>

      <TranscribeForm />
    </div>
  );
}
