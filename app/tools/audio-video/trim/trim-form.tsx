"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Download, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { gateRateLimit } from "@/lib/rate-limit-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runFFmpeg, isFFmpegLoaded } from "@/lib/ffmpeg";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function formatTs(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseTs(input: string): number {
  const t = input.trim();
  if (!t) return NaN;
  if (t.includes(":")) {
    const parts = t.split(":").map((p) => Number(p));
    if (parts.some((n) => !Number.isFinite(n))) return NaN;
    let s = 0;
    for (const n of parts) s = s * 60 + n;
    return s;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "mp4";
}

export function TrimForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isVideo, setIsVideo] = React.useState(false);
  const [duration, setDuration] = React.useState<number | null>(null);
  const [startStr, setStartStr] = React.useState("0");
  const [endStr, setEndStr] = React.useState("");
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [resultName, setResultName] = React.useState<string | null>(null);

  const [running, setRunning] = React.useState(false);
  const [phase, setPhase] = React.useState<"idle" | "loading" | "processing">("idle");
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [previewUrl, resultUrl]);

  const onDrop = React.useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setIsVideo(f.type.startsWith("video/"));
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResultName(null);
    setDuration(null);
    setStartStr("0");
    setEndStr("");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".m4a", ".wav", ".flac", ".ogg", ".aac"],
      "video/*": [".mp4", ".webm", ".mov", ".mkv"],
    },
    multiple: false,
  });

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setResultName(null);
    setDuration(null);
    setStartStr("0");
    setEndStr("");
    setProgress(0);
    setPhase("idle");
  }

  function onMediaMetadata(e: React.SyntheticEvent<HTMLMediaElement>) {
    const d = e.currentTarget.duration;
    if (Number.isFinite(d)) {
      setDuration(d);
      if (!endStr) setEndStr(d.toFixed(2));
    }
  }

  async function run() {
    if (!file) return;
    const startSec = parseTs(startStr);
    const endSec = parseTs(endStr);
    if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) {
      toast.error("Start and end must be numbers (seconds) or MM:SS.");
      return;
    }
    if (endSec <= startSec) {
      toast.error("End must be after start.");
      return;
    }

    const gate = await gateRateLimit("trim");
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
      // Load ffmpeg if needed (singleton).
      if (!isFFmpegLoaded()) {
        const { loadFFmpeg } = await import("@/lib/ffmpeg");
        await loadFFmpeg((p) => setProgress(p.percent));
        setPhase("processing");
        setProgress(0);
      }

      const ext = extOf(file.name);
      const inputName = `input.${ext}`;
      const outputName = `output.${ext}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const out = await runFFmpeg({
        input: { name: inputName, bytes },
        outputName,
        // -ss before -i is fast seek; -to relative to start.
        args: ["-ss", String(startSec), "-to", String(endSec), "-c", "copy"],
        onProgress: (r) => setProgress(Math.round(r * 100)),
      });

      const blob = new Blob([new Uint8Array(out)], {
        type: file.type || (isVideo ? "video/mp4" : "audio/mpeg"),
      });
      setResultUrl(URL.createObjectURL(blob));
      const baseName = file.name.replace(/\.[^.]+$/, "");
      setResultName(`${baseName}-trimmed.${ext}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Trim failed.");
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
            {isDragActive ? "Drop the file here" : "Drop an audio or video file, or click to choose"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            MP3, M4A, WAV, MP4, WebM, MOV. Runs entirely in your browser.
          </p>
        </div>
      )}

      {file && (
        <>
          <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatBytes(file.size)}{duration != null ? ` · ${formatTs(duration)} long` : ""}
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={reset} disabled={running} aria-label="Remove">
              <X className="size-4" />
            </Button>
          </div>

          {previewUrl && (
            isVideo ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={previewUrl} controls onLoadedMetadata={onMediaMetadata} className="w-full max-h-72 rounded-lg border border-border bg-black" />
            ) : (
              <audio src={previewUrl} controls onLoadedMetadata={onMediaMetadata} className="w-full" />
            )
          )}

          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="start" className="text-sm font-medium">Start</label>
                <Input id="start" value={startStr} onChange={(e) => setStartStr(e.target.value)} placeholder="0 or 00:05" disabled={running} />
              </div>
              <div className="space-y-1">
                <label htmlFor="end" className="text-sm font-medium">End</label>
                <Input id="end" value={endStr} onChange={(e) => setEndStr(e.target.value)} placeholder={duration ? formatTs(duration) : "30 or 00:30"} disabled={running} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Use seconds (12) or MM:SS (00:12). No re-encoding — output is byte-exact within keyframe boundaries.</p>

            <Button size="lg" onClick={run} disabled={running} className="w-full sm:w-auto">
              {running ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {phase === "loading" ? "Loading ffmpeg" : "Trimming"}…
                </>
              ) : (
                "Trim"
              )}
            </Button>

            {running && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{phase === "loading" ? "First-run model download (~30 MB)" : "Processing"}</span>
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
              {isVideo
                // eslint-disable-next-line jsx-a11y/media-has-caption
                ? <video src={resultUrl} controls className="w-full max-h-72 rounded-md border border-border bg-black" />
                : <audio src={resultUrl} controls className="w-full" />}
              <div className="flex items-center justify-end">
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
