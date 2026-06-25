"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Download, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Mode = "text" | "image";
type Position =
  | "top-left" | "top" | "top-right"
  | "left" | "center" | "right"
  | "bottom-left" | "bottom" | "bottom-right";
type Color = "white" | "black";
type Format = "jpeg" | "png" | "webp" | "avif";

const FORMAT_OPTIONS: { value: Format; label: string }[] = [
  { value: "jpeg", label: "JPEG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
];

const POSITIONS: Position[] = [
  "top-left", "top", "top-right",
  "left", "center", "right",
  "bottom-left", "bottom", "bottom-right",
];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function WatermarkForm() {
  const [base, setBase] = React.useState<File | null>(null);
  const [basePreview, setBasePreview] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<Mode>("text");
  const [text, setText] = React.useState("dailyforge·ai");
  const [color, setColor] = React.useState<Color>("white");
  const [signature, setSignature] = React.useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = React.useState<string | null>(null);
  const [position, setPosition] = React.useState<Position>("bottom-right");
  const [opacity, setOpacity] = React.useState(60); // 5–100
  const [size, setSize] = React.useState(25); // 5–60 (% of base width)
  const [padding, setPadding] = React.useState(3); // 0–20 (% of base width)
  const [format, setFormat] = React.useState<Format>("jpeg");
  const [loading, setLoading] = React.useState(false);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (basePreview) URL.revokeObjectURL(basePreview);
      if (signaturePreview) URL.revokeObjectURL(signaturePreview);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [basePreview, signaturePreview, resultUrl]);

  const onDropBase = React.useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setBase(f);
    setBasePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    const inferred: Format = f.type === "image/png" ? "png"
      : f.type === "image/webp" ? "webp"
      : f.type === "image/avif" ? "avif"
      : "jpeg";
    setFormat(inferred);
  }, []);

  const onDropSig = React.useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setSignature(f);
    setSignaturePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }, []);

  const baseDz = useDropzone({
    onDrop: onDropBase,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"], "image/avif": [".avif"] },
    multiple: false,
  });

  const sigDz = useDropzone({
    onDrop: onDropSig,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"] },
    multiple: false,
  });

  function resetBase() {
    if (basePreview) URL.revokeObjectURL(basePreview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setBase(null);
    setBasePreview(null);
    setResultUrl(null);
  }

  function resetSig() {
    if (signaturePreview) URL.revokeObjectURL(signaturePreview);
    setSignature(null);
    setSignaturePreview(null);
  }

  async function run() {
    if (!base) return;
    if (mode === "text" && !text.trim()) {
      toast.error("Type the watermark text.");
      return;
    }
    if (mode === "image" && !signature) {
      toast.error("Attach a signature or logo.");
      return;
    }
    setLoading(true);
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    try {
      const form = new FormData();
      form.append("image", base);
      form.append("mode", mode);
      if (mode === "text") {
        form.append("text", text);
        form.append("color", color);
      } else if (signature) {
        form.append("signature", signature);
      }
      form.append("position", position);
      form.append("opacity", String(opacity / 100));
      form.append("size", String(size));
      form.append("padding", String(padding));
      form.append("format", format);
      const res = await fetch("/api/tools/watermark", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? `Failed (HTTP ${res.status}).`);
      }
      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!resultUrl || !base) return;
    const ext = format === "jpeg" ? "jpg" : format;
    const baseName = base.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${baseName}-watermarked.${ext}`;
    a.click();
  }

  return (
    <div className="mt-10 space-y-6">
      {!base && (
        <div
          {...baseDz.getRootProps()}
          className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            baseDz.isDragActive
              ? "border-orange-500 bg-orange-500/5"
              : "border-border hover:border-foreground/30"
          }`}
        >
          <input {...baseDz.getInputProps()} />
          <Upload className="size-8 mx-auto text-muted-foreground" />
          <p className="mt-3 font-medium">
            {baseDz.isDragActive ? "Drop the image here" : "Drop an image here, or click to choose"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, AVIF. Up to 25 MB.</p>
        </div>
      )}

      {base && basePreview && (
        <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={basePreview} alt="" className="h-16 w-16 object-cover rounded-md border border-border" />
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{base.name}</div>
            <div className="text-xs text-muted-foreground">{formatBytes(base.size)}</div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={resetBase} disabled={loading} aria-label="Remove">
            <X className="size-4" />
          </Button>
        </div>
      )}

      {base && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex gap-2">
            <Button
              variant={mode === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("text")}
              type="button"
            >
              Text
            </Button>
            <Button
              variant={mode === "image" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("image")}
              type="button"
            >
              Signature / Logo
            </Button>
          </div>

          {mode === "text" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="wm-text" className="text-sm font-medium">Text</label>
                <Input
                  id="wm-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Color</span>
                <Select value={color} onValueChange={(v) => v && setColor(v as Color)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="white">White</SelectItem>
                    <SelectItem value="black">Black</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">A subtle outline auto-contrasts.</span>
              </div>
            </div>
          )}

          {mode === "image" && (
            <div className="space-y-2">
              {!signature && (
                <div
                  {...sigDz.getRootProps()}
                  className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                    sigDz.isDragActive
                      ? "border-orange-500 bg-orange-500/5"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  <input {...sigDz.getInputProps()} />
                  <p className="text-sm font-medium">
                    {sigDz.isDragActive ? "Drop the signature here" : "Drop a signature or logo, or click to choose"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">PNG (with transparency) recommended.</p>
                </div>
              )}
              {signature && signaturePreview && (
                <div className="rounded-lg border border-border p-2 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={signaturePreview} alt="" className="h-12 w-12 object-contain rounded-md bg-muted/50" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{signature.name}</div>
                    <div className="text-xs text-muted-foreground">{formatBytes(signature.size)}</div>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={resetSig} disabled={loading} aria-label="Remove">
                    <X className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <span className="text-sm font-medium block">Position</span>
            <div className="grid grid-cols-3 gap-1.5 w-fit">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPosition(p)}
                  className={`h-8 w-12 rounded-md border text-xs transition-colors ${
                    position === p
                      ? "border-orange-500 bg-orange-500/10 text-foreground"
                      : "border-border hover:border-foreground/30 text-muted-foreground"
                  }`}
                  aria-label={p}
                >
                  {position === p ? "•" : ""}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Opacity</label>
                <span className="text-xs tabular-nums">{opacity}%</span>
              </div>
              <input type="range" min="5" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-orange-500" disabled={loading} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Size</label>
                <span className="text-xs tabular-nums">{size}%</span>
              </div>
              <input type="range" min="5" max="60" value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-orange-500" disabled={loading} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Padding</label>
                <span className="text-xs tabular-nums">{padding}%</span>
              </div>
              <input type="range" min="0" max="20" value={padding} onChange={(e) => setPadding(Number(e.target.value))} className="w-full accent-orange-500" disabled={loading} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Output format</span>
            <Select value={format} onValueChange={(v) => v && setFormat(v as Format)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button size="lg" onClick={run} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Applying…
              </>
            ) : (
              "Apply watermark"
            )}
          </Button>
        </div>
      )}

      {resultUrl && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl} alt="Watermarked result" className="max-h-96 rounded-md mx-auto border border-border" />
          <div className="flex items-center justify-end">
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
