"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Download, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Format = "jpeg" | "png" | "webp";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function UpscaleForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [scale, setScale] = React.useState<2 | 3 | 4>(2);
  const [format, setFormat] = React.useState<Format>("jpeg");
  const [sharpen, setSharpen] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{
    url: string;
    bytes: number;
    width: number;
    height: number;
  } | null>(null);

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [preview, result]);

  const onDrop = React.useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    const inferred: Format = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpeg";
    setFormat(inferred);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/avif": [".avif"],
    },
    multiple: false,
  });

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    if (result) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreview(null);
    setResult(null);
  }

  async function run() {
    if (!file) return;
    setLoading(true);
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("scale", String(scale));
      form.append("format", format);
      form.append("sharpen", String(sharpen));
      const res = await fetch("/api/tools/image-upscale", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? `Failed (HTTP ${res.status}).`);
      }
      const bytes = Number(res.headers.get("x-output-bytes") ?? 0);
      const w = Number(res.headers.get("x-output-width") ?? 0);
      const h = Number(res.headers.get("x-output-height") ?? 0);
      const blob = await res.blob();
      setResult({ url: URL.createObjectURL(blob), bytes, width: w, height: h });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!result || !file) return;
    const base = file.name.replace(/\.[^.]+$/, "");
    const ext = format === "jpeg" ? "jpg" : format;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `${base}-${scale}x.${ext}`;
    a.click();
  }

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
            {isDragActive ? "Drop the image here" : "Drop an image, or click to choose"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, AVIF. Up to 25 MB.</p>
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
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-muted-foreground">Scale</span>
              <Select value={String(scale)} onValueChange={(v) => v && setScale(Number(v) as 2 | 3 | 4)}>
                <SelectTrigger className="w-full sm:w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2×</SelectItem>
                  <SelectItem value="3">3×</SelectItem>
                  <SelectItem value="4">4×</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-muted-foreground">Format</span>
              <Select value={format} onValueChange={(v) => v && setFormat(v as Format)}>
                <SelectTrigger className="w-full sm:w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={sharpen} onChange={(e) => setSharpen(e.target.checked)} disabled={loading} className="accent-orange-500" />
              <span>Mild sharpen</span>
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            Lanczos3 resampling — a high-quality classic resize, not AI super-resolution. Best for shrinking artifacts on already-decent images. For severely blurry sources, only AI upscalers help.
          </p>

          <Button size="lg" onClick={run} disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Upscaling…
              </>
            ) : (
              `Upscale ${scale}×`
            )}
          </Button>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.url} alt="Upscaled result" className="max-h-96 rounded-md mx-auto border border-border" />
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {result.width} × {result.height} · {formatBytes(result.bytes)} · {format.toUpperCase()}
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
