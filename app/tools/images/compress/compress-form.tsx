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

type Format = "jpeg" | "webp" | "avif" | "png";

const FORMAT_OPTIONS: { value: Format; label: string }[] = [
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "png", label: "PNG (lossless)" },
];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function ImageCompressForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [quality, setQuality] = React.useState(75);
  const [format, setFormat] = React.useState<Format>("jpeg");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{
    blob: Blob;
    url: string;
    originalBytes: number;
    outputBytes: number;
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

  async function compress() {
    if (!file) return;
    setLoading(true);
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("quality", String(quality));
      form.append("format", format);
      const res = await fetch("/api/tools/image-compress", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Failed (HTTP ${res.status}).`);
      }
      const originalBytes = Number(res.headers.get("x-original-bytes") ?? file.size);
      const outputBytes = Number(res.headers.get("x-output-bytes") ?? 0);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResult({ blob, url, originalBytes, outputBytes });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!result || !file) return;
    const base = file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `${base}.${format === "jpeg" ? "jpg" : format}`;
    a.click();
  }

  const savings = result ? 1 - result.outputBytes / Math.max(1, result.originalBytes) : 0;
  const savingsPct = Math.round(savings * 100);

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
            {isDragActive ? "Drop the image here" : "Drop an image here, or click to choose"}
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="quality" className="text-sm font-medium">Quality</label>
              <span className="text-sm tabular-nums">{quality}</span>
            </div>
            <input
              id="quality"
              type="range"
              min="10"
              max="100"
              step="1"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              disabled={loading || format === "png"}
              className="w-full accent-orange-500"
            />
            <p className="text-xs text-muted-foreground">
              {format === "png"
                ? "PNG is lossless — quality slider has no effect."
                : "Lower = smaller file, more visible artifacts. 75 is a safe default."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Output format</span>
            <Select value={format} onValueChange={(v) => v && setFormat(v as Format)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button size="lg" onClick={compress} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Compressing…
              </>
            ) : (
              "Compress"
            )}
          </Button>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.url} alt="Compressed result" className="max-h-80 rounded-md mx-auto border border-border" />
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {formatBytes(result.originalBytes)} → {formatBytes(result.outputBytes)}
              {savings > 0 && (
                <span className="ml-2 text-emerald-600 dark:text-emerald-400">−{savingsPct}%</span>
              )}
              {savings <= 0 && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">no savings — try lower quality or a different format</span>
              )}
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
