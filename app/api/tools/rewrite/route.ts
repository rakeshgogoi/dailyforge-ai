import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import { enforceLimit } from "@/lib/rate-limit";

const MODES = ["fix", "formal", "casual", "concise", "expand"] as const;
type Mode = (typeof MODES)[number];

const MAX_INPUT_CHARS = 8000;

const RequestSchema = z.object({
  text: z.string().min(1).max(MAX_INPUT_CHARS),
  mode: z.enum(MODES),
});

const ResultSchema = z.object({
  rewritten: z.string().describe("The rewritten text. Output only the rewritten content — no preface, no commentary, no markdown headings."),
});

const MODE_INSTRUCTIONS: Record<Mode, string> = {
  fix: "Fix grammar, spelling, and punctuation. Preserve the original voice, tone, and meaning. Do not restructure unless a sentence is genuinely broken.",
  formal: "Rewrite in a polished, professional tone suitable for business email or a formal document. Keep the meaning intact; remove slang and colloquialisms.",
  casual: "Rewrite in a friendly, conversational tone, the way you'd talk to a colleague over coffee. Keep the meaning intact; loosen overly formal phrasing.",
  concise: "Tighten significantly. Cut filler, hedging, and repetition. Aim for ~40–60% of the original length without losing key information.",
  expand: "Add helpful detail, examples, and connective explanation. Roughly double the length while staying on-topic and on-tone.",
};

export async function POST(req: Request) {
  const blocked = await enforceLimit("rewrite", req);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const msg =
      issue?.path[0] === "text"
        ? `Text must be 1–${MAX_INPUT_CHARS} characters.`
        : "Pick a valid rewrite mode.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { text, mode } = parsed.data;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: ResultSchema,
      system: `You are a precise rewriting assistant. ${MODE_INSTRUCTIONS[mode]} Output the rewritten text only — no preface, no commentary, no markdown wrappers. Preserve paragraph breaks.`,
      prompt: text,
    });
    return NextResponse.json(object);
  } catch (err) {
    console.error("[rewrite] generation error", err);
    return NextResponse.json(
      { error: "The rewriter model failed. Try again in a moment." },
      { status: 502 },
    );
  }
}
