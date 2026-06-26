"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Download, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { gateRateLimit } from "@/lib/rate-limit-client";

import { Button } from "@/components/ui/button";
import { runFFmpeg, isFFmpegLoaded } from "@/lib/ffmpeg";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "mp4";
}

export function CompressVideoForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [crf, setCrf] = React.useState(28);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [resultBytes, setResultBytes] = React.useState(0);
  const [resultName, setResultName] = React.useState<string | null>(null);

  const [running, setRunning] = React.useState(false);
  const [phase, setPhase] = React.useState<"idle" | "loading" | "processing">("idle");
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const onDrop = React.useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResultBytes(0);
    setResultName(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".webm", ".mov", ".mkv"] },
    multiple: false,
  });

  function reset() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setResultBytes(0);
    setResultName(null);
    setProgress(0);
    setPhase("idle");
  }

  async function run() {
    if (!file) return;
    const gate = await gateRateLimit("compress-video");
    if (!gate.ok) {
      toast.error(gate.error);
      return;
    }
    setRunning(true);
    setProgress(0);
    setPhase(isFFmpegLoaded() ? "processing" : "loading");
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      if (!isFFmpegLoaded()) {
        const { loadFFmpeg } = await import("@/lib/ffmpeg");
        await loadFFmpeg((p) => setProgress(p.percent));
        setPhase("processing");
        setProgress(0);
      }

      const srcExt = extOf(file.name);
      const inputName = `input.${srcExt}`;
      const outputName = "output.mp4";
      const bytes = new Uint8Array(await file.arrayBuffer());
      const out = await runFFmpeg({
        input: { name: inputName, bytes },
        outputName,
        args: [
          "-c:v", "libx264",
          "-preset", "fast",
          "-crf", String(crf),
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
        ],
        onProgress: (r) => setProgress(Math.round(r * 100)),
      });

      const blob = new Blob([new Uint8Array(out)], { type: "video/mp4" });
      setResultUrl(URL.createObjectURL(blob));
      setResultBytes(out.byteLength);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      setResultName(`${baseName}-compressed.mp4`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Compression failed.");
    } finally {
      setPhase("idle");
      setRunning(false);
    }
  }

  function download() {
    if (!resultUrl || !resultName) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = resultName;
    a.click();
  }

  const savingsPct = resultBytes > 0 && file ? Math.round((1 - resultBytes / file.size) * 100) : 0;

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
            {isDragActive ? "Drop the video here" : "Drop a video, or click to choose"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            MP4, WebM, MOV, MKV. Runs entirely in your browser. Larger files take longer.
          </p>
        </div>
      )}

      {file && (
        <>
          <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{file.name}</div>
              <div className="text-xs text-muted-foreground">{formatBytes(file.size)}</div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={reset} disabled={running} aria-label="Remove">
              <X className="size-4" />
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="crf" className="text-sm font-medium">Quality (CRF)</label>
                <span className="text-sm tabular-nums">{crf}</span>
              </div>
              <input
                id="crf"
                type="range"
                min="18"
                max="35"
                step="1"
                value={crf}
                onChange={(e) => setCrf(Number(e.target.value))}
                disabled={running}
                className="w-full accent-orange-500"
              />
              <p className="text-xs text-muted-foreground">
                Lower = higher quality, larger file. 18 ≈ visually lossless, 23 ≈ default, 28 ≈ smaller files, 35 = aggressive.
              </p>
            </div>

            <Button size="lg" onClick={run} disabled={running}>
              {running ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {phase === "loading" ? "Loading ffmpeg" : "Compressing"}…
                </>
              ) : (
                "Compress"
              )}
            </Button>

            {running && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{phase === "loading" ? "First-run download (~30 MB)" : "Encoding"}</span>
                  <span className="tabular-nums">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {resultUrl && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={resultUrl} controls className="w-full max-h-72 rounded-md border border-border bg-black" />
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  {formatBytes(file.size)} → {formatBytes(resultBytes)}
                  {savingsPct > 0 && <span className="ml-2 text-emerald-600 dark:text-emerald-400">−{savingsPct}%</span>}
                  {savingsPct <= 0 && <span className="ml-2 text-amber-600 dark:text-amber-400">no savings — try a higher CRF</span>}
                </div>
                <Button onClick={download} size="sm">
                  <Download className="size-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
