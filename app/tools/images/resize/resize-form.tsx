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

type Format = "jpeg" | "png" | "webp" | "avif";
type Fit = "cover" | "contain" | "fill" | "inside";

const FORMAT_OPTIONS: { value: Format; label: string }[] = [
  { value: "jpeg", label: "JPEG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
];

const FIT_OPTIONS: { value: Fit; label: string; description: string }[] = [
  { value: "inside", label: "Fit inside", description: "Preserve aspect; don't exceed either dimension." },
  { value: "cover", label: "Cover & crop", description: "Fill the box exactly, crop overflow." },
  { value: "contain", label: "Contain (letterbox)", description: "Fit inside, fill rest with transparent." },
  { value: "fill", label: "Stretch", description: "Ignore aspect ratio." },
];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function ImageResizeForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [width, setWidth] = React.useState("");
  const [height, setHeight] = React.useState("");
  const [fit, setFit] = React.useState<Fit>("inside");
  const [format, setFormat] = React.useState<Format>("jpeg");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{
    url: string;
    outputBytes: number;
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
    // Default output format to the input's format
    const inferred: Format = f.type === "image/png" ? "png"
      : f.type === "image/webp" ? "webp"
      : f.type === "image/avif" ? "avif"
      : "jpeg";
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
    setWidth("");
    setHeight("");
  }

  async function run() {
    if (!file) return;
    if (!width && !height) {
      toast.error("Enter a width, a height, or both.");
      return;
    }
    setLoading(true);
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    try {
      const form = new FormData();
      form.append("image", file);
      if (width) form.append("width", width);
      if (height) form.append("height", height);
      form.append("fit", fit);
      form.append("format", format);
      const res = await fetch("/api/tools/image-resize", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Failed (HTTP ${res.status}).`);
      }
      const outputBytes = Number(res.headers.get("x-output-bytes") ?? 0);
      const w = Number(res.headers.get("x-output-width") ?? 0);
      const h = Number(res.headers.get("x-output-height") ?? 0);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, outputBytes, width: w, height: h });
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
    a.download = `${base}-${result.width}x${result.height}.${ext}`;
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="w" className="text-sm font-medium">Width (px)</label>
              <Input id="w" type="number" min="1" max="10000" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="auto" disabled={loading} />
            </div>
            <div className="space-y-1">
              <label htmlFor="h" className="text-sm font-medium">Height (px)</label>
              <Input id="h" type="number" min="1" max="10000" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="auto" disabled={loading} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Leave one blank to preserve aspect ratio.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Fit</span>
              <Select value={fit} onValueChange={(v) => v && setFit(v as Fit)}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <span className="flex flex-col items-start">
                        <span>{o.label}</span>
                        <span className="text-xs text-muted-foreground">{o.description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Format</span>
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
          </div>

          <Button size="lg" onClick={run} disabled={loading || (!width && !height)}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing…
              </>
            ) : (
              "Resize & convert"
            )}
          </Button>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.url} alt="Processed result" className="max-h-80 rounded-md mx-auto border border-border" />
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {result.width} × {result.height} · {formatBytes(result.outputBytes)} · {format.toUpperCase()}
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
