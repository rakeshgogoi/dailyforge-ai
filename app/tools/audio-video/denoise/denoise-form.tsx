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
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function DenoiseForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [sourceIsVideo, setSourceIsVideo] = React.useState(false);
  const [strength, setStrength] = React.useState(12);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
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
    setSourceIsVideo(f.type.startsWith("video/"));
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResultName(null);
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
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResultUrl(null);
    setResultName(null);
    setProgress(0);
    setPhase("idle");
  }

  async function run() {
    if (!file) return;
    const gate = await gateRateLimit("denoise");
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

      const srcExt = extOf(file.name) || (sourceIsVideo ? "mp4" : "mp3");
      const inputName = `input.${srcExt}`;
      // Always output audio — denoise is primarily an audio cleanup.
      const outExt = sourceIsVideo ? "mp3" : srcExt;
      const outputName = `output.${outExt}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const out = await runFFmpeg({
        input: { name: inputName, bytes },
        outputName,
        args: [
          ...(sourceIsVideo ? ["-vn"] : []),
          "-af", `afftdn=nr=${strength}:nt=w`,
          ...(outExt === "mp3" ? ["-c:a", "libmp3lame", "-b:a", "192k"] : []),
          ...(outExt === "wav" ? ["-c:a", "pcm_s16le"] : []),
          ...(outExt === "flac" ? ["-c:a", "flac"] : []),
        ],
        onProgress: (r) => setProgress(Math.round(r * 100)),
      });

      const mime = outExt === "mp3" ? "audio/mpeg" : outExt === "wav" ? "audio/wav" : outExt === "flac" ? "audio/flac" : "audio/mpeg";
      const blob = new Blob([new Uint8Array(out)], { type: mime });
      setResultUrl(URL.createObjectURL(blob));
      const baseName = file.name.replace(/\.[^.]+$/, "");
      setResultName(`${baseName}-denoised.${outExt}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Denoise failed.");
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
            Audio or video. If you drop video, only the audio track is processed (output is MP3).
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
                <label htmlFor="strength" className="text-sm font-medium">Strength</label>
                <span className="text-sm tabular-nums">{strength} dB</span>
              </div>
              <input
                id="strength"
                type="range"
                min="0"
                max="40"
                step="1"
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                disabled={running}
                className="w-full accent-orange-500"
              />
              <p className="text-xs text-muted-foreground">
                FFT noise floor reduction. 8–15 is a safe range for hiss / room tone. Higher numbers can make speech sound robotic.
              </p>
            </div>

            <Button size="lg" onClick={run} disabled={running} className="w-full sm:w-auto">
              {running ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {phase === "loading" ? "Loading ffmpeg" : "Cleaning"}…
                </>
              ) : (
                "Clean audio"
              )}
            </Button>

            {running && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{phase === "loading" ? "First-run download (~30 MB)" : "Processing"}</span>
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
              <audio src={resultUrl} controls className="w-full" />
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
