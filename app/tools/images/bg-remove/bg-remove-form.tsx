"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Download, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { gateRateLimit } from "@/lib/rate-limit-client";

import { Button } from "@/components/ui/button";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function BgRemoveForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState<{ phase: string; percent: number } | null>(null);

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
    setProgress(null);
  }

  async function run() {
    if (!file) return;
    const gate = await gateRateLimit("bg-remove");
    if (!gate.ok) {
      toast.error(gate.error);
      return;
    }
    setLoading(true);
    setProgress({ phase: "Loading model", percent: 0 });
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const out = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          const pct = total > 0 ? Math.round((current / total) * 100) : 0;
          const phase = key.startsWith("fetch") ? "Loading model" : key.startsWith("compute") ? "Removing background" : "Processing";
          setProgress({ phase, percent: pct });
        },
      });
      setResultUrl(URL.createObjectURL(out));
      setProgress(null);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Background removal failed.");
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const base = file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${base}-no-bg.png`;
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
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, WebP. Runs entirely in your browser — nothing is uploaded.
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

      {file && !resultUrl && (
        <div className="space-y-3">
          <Button size="lg" onClick={run} disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {progress?.phase ?? "Working"}…
              </>
            ) : (
              "Remove background"
            )}
          </Button>
          {progress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress.phase}</span>
                <span className="tabular-nums">{progress.percent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            First run downloads the segmentation model (~30 MB) — subsequent runs are instant.
          </p>
        </div>
      )}

      {resultUrl && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Original</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview ?? ""} alt="Original" className="w-full rounded-md border border-border" />
            </div>
            <div
              className="rounded-lg border border-border bg-card p-3"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, rgba(0,0,0,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.06) 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
              }}
            >
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Result</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="Without background" className="w-full rounded-md" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={reset}>Start over</Button>
            <Button onClick={download} size="sm">
              <Download className="size-4" />
              Download PNG
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
