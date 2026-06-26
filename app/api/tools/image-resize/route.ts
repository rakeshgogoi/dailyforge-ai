import { NextResponse } from "next/server";
import sharp from "sharp";

import { enforceLimit } from "@/lib/rate-limit";
import { withTracking } from "@/lib/jobs";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_DIMENSION = 10000;

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type Format = "jpeg" | "png" | "webp" | "avif";
type Fit = "cover" | "contain" | "fill" | "inside";

function pickFormat(input: string | null, fallback: Format): Format {
  if (input === "jpeg" || input === "png" || input === "webp" || input === "avif") return input;
  return fallback;
}

function pickFit(input: string | null): Fit {
  if (input === "cover" || input === "contain" || input === "fill" || input === "inside") return input;
  return "inside";
}

function parseDimension(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(MAX_DIMENSION, n);
}

async function handler(req: Request) {
  const blocked = await enforceLimit("resize", req);
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

  const width = parseDimension(form.get("width") as string | null);
  const height = parseDimension(form.get("height") as string | null);
  const fit = pickFit(form.get("fit") as string | null);
  const fallbackFormat: Format = mimeType.endsWith("png") ? "png" : "jpeg";
  const format = pickFormat(form.get("format") as string | null, fallbackFormat);

  if (!width && !height) {
    return NextResponse.json(
      { error: "Set at least one of width or height." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    let pipeline = sharp(bytes, { failOn: "none" }).resize({
      width,
      height,
      fit,
      withoutEnlargement: false,
    });
    if (format === "jpeg") pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
    else if (format === "webp") pipeline = pipeline.webp({ quality: 85 });
    else if (format === "avif") pipeline = pipeline.avif({ quality: 70 });
    else pipeline = pipeline.png({ compressionLevel: 9 });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

    return new Response(new Uint8Array(data), {
      status: 200,
      headers: {
        "content-type": `image/${format}`,
        "content-length": String(data.byteLength),
        "x-output-bytes": String(data.byteLength),
        "x-output-width": String(info.width),
        "x-output-height": String(info.height),
      },
    });
  } catch (err) {
    console.error("[image-resize] sharp error", err);
    return NextResponse.json({ error: "Couldn't process that image." }, { status: 422 });
  }
}

export const POST = withTracking("resize", handler);
