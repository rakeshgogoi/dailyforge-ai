import { NextResponse } from "next/server";

import { enforceLimit } from "@/lib/rate-limit";
import { withTracking } from "@/lib/jobs";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024; // Groq's audio upload cap.

const ACCEPTED_EXTENSIONS = new Set([
  "flac", "mp3", "mp4", "mpeg", "mpga", "m4a", "ogg", "wav", "webm",
]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

async function handler(req: Request) {
  const blocked = await enforceLimit("transcribe", req);
  if (blocked) return blocked;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing GROQ_API_KEY." }, { status: 500 });
  }

  let inForm: FormData;
  try {
    inForm = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  const file = inForm.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Attach an audio or video file." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File is too large (max 25 MB for transcription). Trim it first." },
      { status: 413 },
    );
  }
  const ext = extOf(file.name);
  if (ext && !ACCEPTED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type: .${ext}. Try MP3, M4A, WAV, MP4, WebM.` },
      { status: 415 },
    );
  }

  const withTimestamps = inForm.get("timestamps") === "true";
  const language = (inForm.get("language") as string | null) || undefined;

  const outForm = new FormData();
  outForm.append("file", file, file.name);
  outForm.append("model", "whisper-large-v3-turbo");
  outForm.append("response_format", withTimestamps ? "verbose_json" : "json");
  if (withTimestamps) outForm.append("timestamp_granularities[]", "segment");
  if (language) outForm.append("language", language);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
      body: outForm,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[transcribe] groq error", res.status, text);
      return NextResponse.json(
        {
          error:
            res.status === 401
              ? "Groq rejected the API key."
              : res.status === 413
                ? "Groq rejected the file size."
                : "Transcription failed. Try a smaller or cleaner file.",
        },
        { status: res.status === 401 ? 500 : 502 },
      );
    }

    const data = await res.json();
    type Segment = { start: number; end: number; text: string };
    const segments = Array.isArray(data?.segments)
      ? (data.segments as Segment[]).map((s) => ({
          start: s.start,
          end: s.end,
          text: String(s.text).trim(),
        }))
      : undefined;

    return NextResponse.json({
      text: typeof data?.text === "string" ? data.text.trim() : "",
      language: typeof data?.language === "string" ? data.language : null,
      durationSeconds: typeof data?.duration === "number" ? data.duration : null,
      segments,
    });
  } catch (err) {
    console.error("[transcribe] network error", err);
    return NextResponse.json({ error: "Couldn't reach Groq." }, { status: 502 });
  }
}

export const POST = withTracking("transcribe", handler);
