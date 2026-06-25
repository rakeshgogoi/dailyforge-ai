import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const POSITIONS = [
  "top-left",
  "top",
  "top-right",
  "left",
  "center",
  "right",
  "bottom-left",
  "bottom",
  "bottom-right",
] as const;
type Position = (typeof POSITIONS)[number];

type Format = "jpeg" | "png" | "webp" | "avif";

function pickPosition(input: string | null): Position {
  return (POSITIONS as readonly string[]).includes(input ?? "")
    ? (input as Position)
    : "bottom-right";
}

function pickFormat(input: string | null, fallback: Format): Format {
  if (input === "jpeg" || input === "png" || input === "webp" || input === "avif") return input;
  return fallback;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildTextSvg(opts: {
  text: string;
  widthPx: number;
  heightPx: number;
  opacity: number;
  color: "white" | "black";
}) {
  const padding = Math.round(opts.widthPx * 0.18);
  const stroke = opts.color === "white" ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.6)";
  const fill = opts.color === "white" ? "rgba(255,255,255,1)" : "rgba(0,0,0,1)";
  // Font size derived from box height; reserve some padding.
  const fontSize = Math.max(12, Math.round(opts.heightPx - padding));
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.widthPx}" height="${opts.heightPx}">
      <style>
        text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-weight: 600; }
      </style>
      <g opacity="${opts.opacity}">
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
              font-size="${fontSize}" fill="${fill}" stroke="${stroke}" stroke-width="${Math.max(1, Math.round(fontSize / 30))}" paint-order="stroke">
          ${escapeXml(opts.text)}
        </text>
      </g>
    </svg>`,
  );
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  const baseFile = form.get("image");
  if (!(baseFile instanceof File) || baseFile.size === 0) {
    return NextResponse.json({ error: "Attach an image." }, { status: 400 });
  }
  if (baseFile.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 25 MB)." }, { status: 413 });
  }
  const baseMime = baseFile.type || "image/jpeg";
  if (!ACCEPTED_TYPES.has(baseMime)) {
    return NextResponse.json({ error: `Unsupported image type: ${baseMime}.` }, { status: 415 });
  }

  const mode = (form.get("mode") as string | null) === "image" ? "image" : "text";
  const position = pickPosition(form.get("position") as string | null);
  const opacity = clamp(Number.parseFloat((form.get("opacity") as string | null) ?? "0.6"), 0.05, 1);
  const sizePct = clamp(Number.parseFloat((form.get("size") as string | null) ?? "20"), 5, 60); // % of base width
  const padPct = clamp(Number.parseFloat((form.get("padding") as string | null) ?? "3"), 0, 20); // % of base width
  const fallbackFormat: Format = baseMime.endsWith("png") ? "png" : "jpeg";
  const format = pickFormat(form.get("format") as string | null, fallbackFormat);
  const color = (form.get("color") as string | null) === "black" ? "black" : "white";
  const text = (form.get("text") as string | null) ?? "";

  const baseBuf = Buffer.from(await baseFile.arrayBuffer());

  try {
    const baseImg = sharp(baseBuf, { failOn: "none" });
    const meta = await baseImg.metadata();
    const baseW = meta.width ?? 1000;
    const baseH = meta.height ?? 1000;
    const overlayW = Math.max(40, Math.round((baseW * sizePct) / 100));
    const overlayH = mode === "text" ? Math.max(24, Math.round(overlayW / 6)) : 0;
    const pad = Math.round((baseW * padPct) / 100);

    let overlayBuf: Buffer;
    let computedH = overlayH;

    if (mode === "text") {
      if (!text.trim()) {
        return NextResponse.json({ error: "Type the watermark text." }, { status: 400 });
      }
      overlayBuf = await sharp(
        buildTextSvg({ text, widthPx: overlayW, heightPx: overlayH, opacity, color }),
      )
        .png()
        .toBuffer();
    } else {
      const sigFile = form.get("signature");
      if (!(sigFile instanceof File) || sigFile.size === 0) {
        return NextResponse.json({ error: "Attach a signature or logo image." }, { status: 400 });
      }
      if (sigFile.size > MAX_BYTES) {
        return NextResponse.json({ error: "Signature image is too large." }, { status: 413 });
      }
      const sigBuf = Buffer.from(await sigFile.arrayBuffer());
      const sigImg = sharp(sigBuf, { failOn: "none" }).ensureAlpha();
      // Resize to target width, preserve aspect.
      const resized = await sigImg.resize({ width: overlayW, withoutEnlargement: false }).toBuffer({ resolveWithObject: true });
      computedH = resized.info.height;
      // Apply opacity by multiplying the alpha channel.
      overlayBuf = await sharp(resized.data)
        .ensureAlpha()
        .composite([
          {
            input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
            raw: { width: 1, height: 1, channels: 4 },
            tile: true,
            blend: "dest-in",
          },
        ])
        .png()
        .toBuffer();
    }

    const usedH = mode === "text" ? overlayH : computedH;
    const v = position.includes("top") ? "top" : position.includes("bottom") ? "bottom" : "middle";
    const h = position.includes("left") ? "left" : position.includes("right") ? "right" : "middle";
    let top = 0;
    let left = 0;
    if (v === "top") top = pad;
    else if (v === "bottom") top = baseH - usedH - pad;
    else top = Math.round((baseH - usedH) / 2);
    if (h === "left") left = pad;
    else if (h === "right") left = baseW - overlayW - pad;
    else left = Math.round((baseW - overlayW) / 2);

    let pipeline = baseImg.composite([
      { input: overlayBuf, top: Math.max(0, top), left: Math.max(0, left) },
    ]);

    if (format === "jpeg") pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
    else if (format === "webp") pipeline = pipeline.webp({ quality: 90 });
    else if (format === "avif") pipeline = pipeline.avif({ quality: 75 });
    else pipeline = pipeline.png({ compressionLevel: 9 });

    const out = await pipeline.toBuffer();
    return new Response(new Uint8Array(out), {
      status: 200,
      headers: {
        "content-type": `image/${format}`,
        "content-length": String(out.byteLength),
        "x-output-bytes": String(out.byteLength),
      },
    });
  } catch (err) {
    console.error("[watermark] sharp error", err);
    return NextResponse.json({ error: "Couldn't apply that watermark." }, { status: 422 });
  }
}
