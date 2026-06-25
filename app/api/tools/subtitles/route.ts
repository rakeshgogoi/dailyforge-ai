import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = new Set([
  "flac", "mp3", "mp4", "mpeg", "mpga", "m4a", "ogg", "wav", "webm",
]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function srtTimestamp(seconds: number): string {
  const total = Math.max(0, seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const ms = Math.floor((total - Math.floor(total)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

type Segment = { start: number; end: number; text: string };

function toSrt(segments: Segment[]): string {
  return segments
    .map((s, i) => `${i + 1}\n${srtTimestamp(s.start)} --> ${srtTimestamp(s.end)}\n${s.text.trim()}\n`)
    .join("\n");
}

function toVtt(segments: Segment[]): string {
  const lines = ["WEBVTT", ""];
  for (const s of segments) {
    lines.push(`${srtTimestamp(s.start).replace(",", ".")} --> ${srtTimestamp(s.end).replace(",", ".")}`);
    lines.push(s.text.trim());
    lines.push("");
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
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
    return NextResponse.json({ error: "File is too large (max 25 MB)." }, { status: 413 });
  }
  const ext = extOf(file.name);
  if (ext && !ACCEPTED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type: .${ext}. Try MP3, M4A, WAV, MP4, WebM.` },
      { status: 415 },
    );
  }

  const format = (inForm.get("format") as string | null) === "vtt" ? "vtt" : "srt";
  const language = (inForm.get("language") as string | null) || undefined;

  const outForm = new FormData();
  outForm.append("file", file, file.name);
  outForm.append("model", "whisper-large-v3-turbo");
  outForm.append("response_format", "verbose_json");
  outForm.append("timestamp_granularities[]", "segment");
  if (language) outForm.append("language", language);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
      body: outForm,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[subtitles] groq error", res.status, text);
      return NextResponse.json(
        {
          error:
            res.status === 401
              ? "Groq rejected the API key."
              : res.status === 413
                ? "Groq rejected the file size."
                : "Subtitle generation failed.",
        },
        { status: res.status === 401 ? 500 : 502 },
      );
    }

    const data = await res.json();
    if (!Array.isArray(data?.segments)) {
      return NextResponse.json({ error: "Groq returned no segments." }, { status: 502 });
    }
    const segments: Segment[] = data.segments.map((s: { start: number; end: number; text: string }) => ({
      start: s.start,
      end: s.end,
      text: String(s.text).trim(),
    }));

    const body = format === "vtt" ? toVtt(segments) : toSrt(segments);
    const mime = format === "vtt" ? "text/vtt" : "application/x-subrip";
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": `${mime}; charset=utf-8`,
        "x-segment-count": String(segments.length),
        "x-language": typeof data?.language === "string" ? data.language : "",
        "x-duration": typeof data?.duration === "number" ? String(data.duration) : "",
      },
    });
  } catch (err) {
    console.error("[subtitles] network error", err);
    return NextResponse.json({ error: "Couldn't reach Groq." }, { status: 502 });
  }
}
