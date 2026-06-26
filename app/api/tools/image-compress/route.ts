import { NextResponse } from "next/server";
import sharp from "sharp";

import { enforceLimit } from "@/lib/rate-limit";
import { withTracking } from "@/lib/jobs";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type Format = "jpeg" | "png" | "webp" | "avif";

function pickFormat(input: string | null): Format {
  if (input === "jpeg" || input === "png" || input === "webp" || input === "avif") return input;
  return "jpeg";
}

function clampQuality(raw: string | null): number {
  const n = Number.parseInt(raw ?? "75", 10);
  if (!Number.isFinite(n)) return 75;
  return Math.min(100, Math.max(10, n));
}

async function handler(req: Request) {
  const blocked = await enforceLimit("compress", req);
  if (blocked) return blocked;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Attach an image." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 25 MB)." }, { status: 413 });
  }
  const mimeType = file.type || "image/jpeg";
  if (!ACCEPTED_TYPES.has(mimeType)) {
    return NextResponse.json({ error: `Unsupported image type: ${mimeType}.` }, { status: 415 });
  }

  const quality = clampQuality(form.get("quality") as string | null);
  const format = pickFormat(form.get("format") as string | null);

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    let pipeline = sharp(bytes, { failOn: "none" });
    if (format === "jpeg") pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    else if (format === "webp") pipeline = pipeline.webp({ quality });
    else if (format === "avif") pipeline = pipeline.avif({ quality });
    else pipeline = pipeline.png({ compressionLevel: 9 });

    const out = await pipeline.toBuffer();

    return new Response(new Uint8Array(out), {
      status: 200,
      headers: {
        "content-type": `image/${format}`,
        "content-length": String(out.byteLength),
        "x-original-bytes": String(file.size),
        "x-output-bytes": String(out.byteLength),
      },
    });
  } catch (err) {
    console.error("[image-compress] sharp error", err);
    return NextResponse.json({ error: "Couldn't process that image." }, { status: 422 });
  }
}

export const POST = withTracking("compress", handler);
