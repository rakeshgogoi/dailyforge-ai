import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import { enforceLimit } from "@/lib/rate-limit";
import { withTracking } from "@/lib/jobs";

const MAX_BYTES = 1_500_000; // ~1.5 MB of raw HTML
const FETCH_TIMEOUT_MS = 15_000;
const MAX_TEXT_CHARS = 60_000; // sent to Gemini

const RequestSchema = z.object({
  url: z.string().url(),
});

const ResultSchema = z.object({
  title: z.string().describe("A short title for the article. Use the page's own title if obvious."),
  bullets: z
    .array(z.string())
    .min(3)
    .max(15)
    .describe("Between 5 and 8 key takeaways as crisp, standalone bullet points. No filler."),
});

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWithLimits(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; DailyforgeAI/1.0; +https://dailyforge.ai)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new Error(`Upstream returned ${res.status}`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/") && !contentType.includes("xml")) {
      throw new Error(`Unsupported content-type: ${contentType || "unknown"}`);
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      throw new Error("Page is too large to summarize (>1.5 MB).");
    }
    return new TextDecoder("utf-8").decode(buf);
  } finally {
    clearTimeout(timer);
  }
}

async function handler(req: Request) {
  const blocked = await enforceLimit("summarize", req);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide a valid URL." },
      { status: 400 },
    );
  }

  let html: string;
  try {
    html = await fetchWithLimits(parsed.data.url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch URL.";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const text = stripHtml(html).slice(0, MAX_TEXT_CHARS);
  if (text.length < 200) {
    return NextResponse.json(
      { error: "The page doesn't have enough readable text to summarize." },
      { status: 422 },
    );
  }

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: ResultSchema,
      system:
        "You summarize web pages into 5–8 tight bullet points. Each bullet is a single concrete idea or fact — no filler, no transitions, no 'the article says'. Aim for the most important takeaways only, not exhaustive coverage. Match the page's language.",
      prompt: `Summarize this page. URL: ${parsed.data.url}\n\n---\n${text}`,
    });
    return NextResponse.json(object);
  } catch (err) {
    console.error("[summarize] generation error", err);
    return NextResponse.json(
      { error: "The summarizer model failed. Try again in a moment." },
      { status: 502 },
    );
  }
}

export const POST = withTracking("summarize", handler);
