import { NextResponse } from "next/server";
import { z } from "zod";

import { enforceLimit } from "@/lib/rate-limit";
import { withTracking } from "@/lib/jobs";

export const runtime = "nodejs";

const MAX_CHARS = 1500;

const LANGUAGES = [
  "en-IN", "hi-IN", "bn-IN", "gu-IN", "kn-IN",
  "ml-IN", "mr-IN", "od-IN", "pa-IN", "ta-IN", "te-IN",
] as const;

const VOICES = [
  "anushka", "abhilash", "manisha", "vidya", "arya", "karun", "hitesh",
  "aditya", "ritu", "priya", "neha", "rahul", "pooja", "rohan", "simran",
  "kavya", "amit", "dev", "ishita", "shreya", "ratan", "varun", "manan",
  "sumit", "roopa", "kabir", "aayan", "shubh", "ashutosh", "advait",
  "anand", "tanya", "tarun", "sunny", "mani", "gokul", "vijay", "shruti",
  "suhani", "mohit", "kavitha", "rehan", "soham", "rupali",
] as const;

const RequestSchema = z.object({
  text: z.string().min(1).max(MAX_CHARS),
  language: z.enum(LANGUAGES),
  voice: z.enum(VOICES),
  pace: z.number().min(0.5).max(2).optional(),
  pitch: z.number().min(-1).max(1).optional(),
});

// Sarvam caps each input at 500 chars; split on sentence boundaries.
function chunkText(text: string, maxLen = 500): string[] {
  if (text.length <= maxLen) return [text];
  const out: string[] = [];
  const sentences = text.split(/(?<=[.!?।])\s+/);
  let buf = "";
  for (const s of sentences) {
    if ((buf + " " + s).length > maxLen) {
      if (buf) out.push(buf);
      if (s.length > maxLen) {
        // Hard-split very long sentence.
        for (let i = 0; i < s.length; i += maxLen) out.push(s.slice(i, i + maxLen));
        buf = "";
      } else {
        buf = s;
      }
    } else {
      buf = buf ? `${buf} ${s}` : s;
    }
  }
  if (buf) out.push(buf);
  return out;
}

// Concatenate WAV PCM: take first WAV header, append PCM bodies, fix size fields.
function concatWavs(buffers: Buffer[]): Buffer {
  if (buffers.length === 1) return buffers[0];
  const first = buffers[0];
  // Each chunk's data subchunk: find "data" identifier.
  function findDataOffset(b: Buffer): { offset: number; size: number } {
    const idx = b.indexOf(Buffer.from("data"), 12);
    if (idx < 0) throw new Error("WAV: no data subchunk");
    return { offset: idx + 8, size: b.readUInt32LE(idx + 4) };
  }
  const firstData = findDataOffset(first);
  const header = first.subarray(0, firstData.offset);
  const dataChunks: Buffer[] = [first.subarray(firstData.offset, firstData.offset + firstData.size)];
  for (let i = 1; i < buffers.length; i++) {
    const d = findDataOffset(buffers[i]);
    dataChunks.push(buffers[i].subarray(d.offset, d.offset + d.size));
  }
  const totalData = dataChunks.reduce((n, b) => n + b.length, 0);
  const out = Buffer.concat([header, ...dataChunks]);
  // Fix RIFF total size (offset 4) and data size (firstData.offset - 4).
  out.writeUInt32LE(out.length - 8, 4);
  out.writeUInt32LE(totalData, firstData.offset - 4);
  return out;
}

async function handler(req: Request) {
  const blocked = await enforceLimit("tts", req);
  if (blocked) return blocked;

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing SARVAM_API_KEY." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const msg = issue?.path[0] === "text"
      ? `Text must be 1–${MAX_CHARS} characters.`
      : "Pick a supported language and voice.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { text, language, voice, pace, pitch } = parsed.data;
  const chunks = chunkText(text, 500);

  try {
    const audios: Buffer[] = [];
    // Sarvam allows up to 3 inputs per request; we call sequentially to be safe.
    for (const c of chunks) {
      const res = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "api-subscription-key": apiKey,
        },
        body: JSON.stringify({
          inputs: [c],
          target_language_code: language,
          speaker: voice,
          model: "bulbul:v2",
          speech_sample_rate: 22050,
          enable_preprocessing: true,
          pace: pace ?? 1,
          pitch: pitch ?? 0,
          loudness: 1,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[tts] sarvam error", res.status, text);
        return NextResponse.json(
          {
            error:
              res.status === 401 || res.status === 403
                ? "Sarvam rejected the API key."
                : `Sarvam returned ${res.status}.`,
          },
          { status: res.status === 401 || res.status === 403 ? 500 : 502 },
        );
      }

      const data = await res.json();
      if (!Array.isArray(data?.audios) || data.audios.length === 0) {
        return NextResponse.json({ error: "Sarvam returned no audio." }, { status: 502 });
      }
      audios.push(Buffer.from(String(data.audios[0]), "base64"));
    }

    const out = concatWavs(audios);
    return new Response(new Uint8Array(out), {
      status: 200,
      headers: {
        "content-type": "audio/wav",
        "content-length": String(out.length),
        "x-chunk-count": String(chunks.length),
      },
    });
  } catch (err) {
    console.error("[tts] network error", err);
    return NextResponse.json({ error: "Couldn't reach Sarvam." }, { status: 502 });
  }
}

export const POST = withTracking("tts", handler);
