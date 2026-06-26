import Link from "next/link";

import { CATEGORIES } from "@/lib/tools";

export const metadata = {
  title: "About — dailyforge·ai",
  description:
    "About dailyforge·ai — a free collection of everyday AI tools that respects your time and your data.",
};

const CONTACT_EMAIL = "connect@codingryder.com";

export default function AboutPage() {
  const total = CATEGORIES.reduce((sum, c) => sum + c.tools.length, 0);

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-16 prose prose-zinc dark:prose-invert">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">About dailyforge·ai</h1>

      <p className="mt-6 text-muted-foreground leading-relaxed">
        dailyforge·ai is a free collection of {total} everyday utilities for converting documents, editing images, and processing audio and video. It exists because the internet has too many one-trick sites that bury a simple tool under five popups and a 20-second wait timer. Ours don&apos;t.
      </p>

      <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-10">What we believe</h2>
      <ul className="mt-3 text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
        <li><strong>No signup for the basics.</strong> If a tool can run for an anonymous visitor without burning our budget, it should.</li>
        <li><strong>Files stay on your device when they can.</strong> Many of our tools (PDF merge / split, image background removal, audio trim) run entirely in your browser. Nothing uploaded, nothing stored.</li>
        <li><strong>Honest about AI.</strong> The smart tools are powered by Google Gemini, Groq, and Sarvam. We tell you which provider is doing what so you know where your input goes.</li>
        <li><strong>No dark patterns.</strong> No fake countdowns, no &quot;upgrade to download&quot;, no captcha gauntlets. A reasonable rate limit if you&apos;re a heavy anon user — that&apos;s it.</li>
      </ul>

      <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-10">What we offer</h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 not-prose">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/#${c.slug}`}
            className="rounded-lg border border-border bg-card p-4 hover:border-foreground/30 transition-colors"
          >
            <div className="font-medium">{c.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.tagline}</div>
            <div className="text-xs text-muted-foreground mt-2">{c.tools.length} tools</div>
          </Link>
        ))}
      </div>

      <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-10">Who builds it</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        dailyforge·ai is a solo project by{" "}
        <a href="https://codingryder.com" className="underline" target="_blank" rel="noopener noreferrer">Coding Ryder</a>
        . If you have feedback, a bug, or a tool you wish existed, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>{" "}
        — every message gets read.
      </p>

      <h2 className="text-lg sm:text-xl font-semibold tracking-tight mt-10">Tech under the hood</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Next.js + Tailwind on Vercel, Postgres on Neon, file processing via Sharp / ffmpeg.wasm / pdf-lib. AI calls go to Gemini, Groq Whisper, and Sarvam. Authentication is by Better Auth (optional — most tools work signed-out). Full privacy details on the{" "}
        <Link href="/privacy" className="underline">privacy page</Link>.
      </p>

      <p className="mt-10 text-sm">
        <Link href="/" className="underline text-muted-foreground hover:text-foreground">← Back to home</Link>
      </p>
    </article>
  );
}
