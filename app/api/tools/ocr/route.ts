import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import { enforceLimit } from "@/lib/rate-limit";
import { withTracking } from "@/lib/jobs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ResultSchema = z.object({
  text: z
    .string()
    .describe(
      "All readable text from the image, preserving line breaks and the original reading order. Do not summarize or paraphrase. Include numbers, dates, addresses verbatim. If no text is present, return an empty string.",
    ),
  language: z
    .string()
    .describe("The dominant language of the text, in English (e.g. 'English', 'Hindi'). 'Mixed' if multilingual."),
});

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);

async function handler(req: Request) {
  const blocked = await enforceLimit("ocr", req);
  if (blocked) return blocked;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach an image." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 10 MB)." }, { status: 413 });
  }
  const mimeType = file.type || "image/jpeg";
  if (!ACCEPTED_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${mimeType}.` },
      { status: 415 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: ResultSchema,
      system:
        "You extract text from images precisely. Preserve line breaks, ordering, and exact wording. Do not add commentary, headers, or formatting that isn't present in the image.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all readable text from this image.",
            },
            {
              type: "file",
              data: bytes,
              mediaType: mimeType,
            },
          ],
        },
      ],
    });
    return NextResponse.json(object);
  } catch (err) {
    console.error("[ocr] generation error", err);
    return NextResponse.json(
      { error: "The OCR model failed. Try again, or use a clearer image." },
      { status: 502 },
    );
  }
}

export const POST = withTracking("ocr", handler);
