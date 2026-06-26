import { NextResponse } from "next/server";
import sharp from "sharp";

import { enforceLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_DIMENSION = 10000;

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type Format = "jpeg" | "png" | "webp";

function pickScale(input: string | null): number {
  const n = Number.parseInt(input ?? "2", 10);
  if (n === 2 || n === 3 || n === 4) return n;
  return 2;
}

function pickFormat(input: string | null, fallback: Format): Format {
  if (input === "jpeg" || input === "png" || input === "webp") return input;
  return fallback;
}

export async function POST(req: Request) {
  const blocked = await enforceLimit("upscale", req);
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

  const scale = pickScale(form.get("scale") as string | null);
  const fallbackFormat: Format = mimeType.endsWith("png") ? "png" : "jpeg";
  const format = pickFormat(form.get("format") as string | null, fallbackFormat);
  const sharpen = form.get("sharpen") === "true";

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const meta = await sharp(bytes).metadata();
    const sourceW = meta.width ?? 0;
    const sourceH = meta.height ?? 0;
    const targetW = sourceW * scale;
    const targetH = sourceH * scale;
    if (targetW > MAX_OUTPUT_DIMENSION || targetH > MAX_OUTPUT_DIMENSION) {
      return NextResponse.json(
        { error: `Output would exceed ${MAX_OUTPUT_DIMENSION}px — pick a smaller scale or smaller source.` },
        { status: 422 },
      );
    }

    let pipeline = sharp(bytes, { failOn: "none" }).resize({
      width: targetW,
      height: targetH,
      kernel: "lanczos3",
      fit: "fill",
    });
    if (sharpen) pipeline = pipeline.sharpen({ sigma: 0.5 });
    if (format === "jpeg") pipeline = pipeline.jpeg({ quality: 92, mozjpeg: true });
    else if (format === "webp") pipeline = pipeline.webp({ quality: 92 });
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
        "x-source-width": String(sourceW),
        "x-source-height": String(sourceH),
      },
    });
  } catch (err) {
    console.error("[upscale] sharp error", err);
    return NextResponse.json({ error: "Couldn't upscale that image." }, { status: 422 });
  }
}
