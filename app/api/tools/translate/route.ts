import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import { enforceLimit } from "@/lib/rate-limit";
import { withTracking } from "@/lib/jobs";

const MAX_INPUT_CHARS = 8000;

const TARGET_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Russian",
  "Polish",
  "Turkish",
  "Arabic",
  "Hebrew",
  "Hindi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Urdu",
  "Japanese",
  "Korean",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Vietnamese",
  "Thai",
  "Indonesian",
] as const;

const RequestSchema = z.object({
  text: z.string().min(1).max(MAX_INPUT_CHARS),
  targetLanguage: z.enum(TARGET_LANGUAGES),
});

const ResultSchema = z.object({
  translated: z
    .string()
    .describe("The translated text. Output only the translation — no preface, no commentary, no quotation marks unless they appeared in the source."),
  detectedSourceLanguage: z
    .string()
    .describe("The language you detected in the source text, in English (e.g. 'Spanish', 'Japanese'). If the source is already in the target language, output the target language name."),
});

async function handler(req: Request) {
  const blocked = await enforceLimit("translate", req);
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
        : "Pick a supported target language.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { text, targetLanguage } = parsed.data;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: ResultSchema,
      system: `You are a precise translator. Translate the user's text into ${targetLanguage}. Preserve paragraph breaks, names, numbers, and formatting (markdown stays markdown). Output only the translation — no preface, no commentary.`,
      prompt: text,
    });
    return NextResponse.json(object);
  } catch (err) {
    console.error("[translate] generation error", err);
    return NextResponse.json(
      { error: "The translator model failed. Try again in a moment." },
      { status: 502 },
    );
  }
}


export const POST = withTracking("translate", handler);
