"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Download, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { gateRateLimit } from "@/lib/rate-limit-client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SizePreset = {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
};

const SIZES: SizePreset[] = [
  { id: "in", name: "India / EU / UK (35×45 mm)", width: 413, height: 531, description: "@300 DPI" },
  { id: "us", name: "US (51×51 mm / 2×2 in)", width: 600, height: 600, description: "@300 DPI" },
  { id: "ca", name: "Canada (50×70 mm)", width: 591, height: 827, description: "@300 DPI" },
  { id: "schengen", name: "Schengen (35×45 mm)", width: 413, height: 531, description: "@300 DPI" },
  { id: "linkedin", name: "LinkedIn / web headshot (400×400)", width: 400, height: 400, description: "Square" },
];

type BgColor = {
  id: string;
  name: string;
  fill: string;
};

const BG_COLORS: BgColor[] = [
  { id: "white", name: "White", fill: "#ffffff" },
  { id: "lightblue", name: "Light blue", fill: "#dfeaf7" },
  { id: "lightgrey", name: "Light grey", fill: "#f0f0f0" },
  { id: "red", name: "Red", fill: "#d61f1f" },
];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function PassportForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [size, setSize] = React.useState<string>("in");
  const [bg, setBg] = React.useState<string>("white");
  const [headroom, setHeadroom] = React.useState(7); // % of canvas height
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [resultBytes, setResultBytes] = React.useState(0);

  const [loading, setLoading] = React.useState(false);
  const [phase, setPhase] = React.useState<"idle" | "model" | "compose">("idle");
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [preview, resultUrl]);

  const onDrop = React.useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResultBytes(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    multiple: false,
  });

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreview(null);
    setResultUrl(null);
    setResultBytes(0);
    setProgress(0);
    setPhase("idle");
  }

  async function run() {
    if (!file) return;
    const preset = SIZES.find((s) => s.id === size)!;
    const bgColor = BG_COLORS.find((c) => c.id === bg)!;
    const gate = await gateRateLimit("passport");
    if (!gate.ok) {
      toast.error(gate.error);
      return;
    }
    setLoading(true);
    setPhase("model");
    setProgress(0);
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      // 1. Remove background via @imgly (returns a Blob).
      const { removeBackground } = await import("@imgly/background-removal");
      const cutout = await removeBackground(file, {
        progress: (_key: string, current: number, total: number) => {
          const pct = total > 0 ? Math.round((current / total) * 100) : 0;
          setProgress(pct);
        },
      });
      const cutoutUrl = URL.createObjectURL(cutout);

      setPhase("compose");
      setProgress(0);

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = cutoutUrl;
      });

      // 2. Canvas compose: fill background, draw subject scaled to preset, centered, with headroom.
      const canvas = document.createElement("canvas");
      canvas.width = preset.width;
      canvas.height = preset.height;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Canvas not supported.");

      ctx.fillStyle = bgColor.fill;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scale subject so it fills the canvas height minus headroom on top.
      const targetH = canvas.height * (1 - headroom / 100);
      const scale = targetH / img.height;
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = (canvas.width - drawW) / 2;
      const drawY = canvas.height * (headroom / 100);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      URL.revokeObjectURL(cutoutUrl);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("Couldn't encode the result.");
      setResultUrl(URL.createObjectURL(blob));
      setResultBytes(blob.size);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Couldn't make the passport photo.");
    } finally {
      setPhase("idle");
      setLoading(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const preset = SIZES.find((s) => s.id === size)!;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${baseName}-passport-${preset.width}x${preset.height}.jpg`;
    a.click();
  }

  const preset = SIZES.find((s) => s.id === size)!;

  return (
    <div className="mt-10 space-y-6">
      {!file && (
        <div
          {...getRootProps()}
          className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-orange-500 bg-orange-500/5"
              : "border-border hover:border-foreground/30"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="size-8 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">
            {isDragActive ? "Drop the photo here" : "Drop a photo of yourself, or click to choose"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Runs entirely in your browser. Best with a forward-facing portrait, neutral expression.
          </p>
        </div>
      )}

      {file && preview && (
        <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-16 w-16 object-cover rounded-md border border-border" />
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{file.name}</div>
            <div className="text-xs text-muted-foreground">{formatBytes(file.size)}</div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={reset} disabled={loading} aria-label="Remove">
            <X className="size-4" />
          </Button>
        </div>
      )}

      {file && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium block">Size</label>
              <Select value={size} onValueChange={(v) => v && setSize(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex flex-col items-start">
                        <span>{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.description} · {s.width}×{s.height}px</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium block">Background</label>
              <div className="grid grid-cols-4 gap-2">
                {BG_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setBg(c.id)}
                    className={`h-9 rounded-md border-2 ${bg === c.id ? "border-orange-500" : "border-border"}`}
                    style={{ background: c.fill }}
                    title={c.name}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="headroom" className="text-sm font-medium">Headroom</label>
              <span className="text-xs tabular-nums">{headroom}%</span>
            </div>
            <input
              id="headroom"
              type="range"
              min="0"
              max="25"
              value={headroom}
              onChange={(e) => setHeadroom(Number(e.target.value))}
              disabled={loading}
              className="w-full accent-orange-500"
            />
            <p className="text-xs text-muted-foreground">
              Extra space above the head. Most passport rules want the head fairly close to the top.
            </p>
          </div>

          <Button size="lg" onClick={run} disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {phase === "model" ? "Removing background" : "Composing"}…
              </>
            ) : (
              "Make passport photo"
            )}
          </Button>

          {loading && phase === "model" && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Background-removal model</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            First-run downloads the segmentation model (~30 MB). Final result is {preset.width} × {preset.height} px JPEG.
          </p>
        </div>
      )}

      {resultUrl && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl} alt="Passport photo" className="max-h-96 rounded-md mx-auto border border-border" />
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {preset.width} × {preset.height} · {formatBytes(resultBytes)}
            </div>
            <Button onClick={download} size="sm">
              <Download className="size-4" />
              Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
