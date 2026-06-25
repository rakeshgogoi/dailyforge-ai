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
import { runFFmpeg, isFFmpegLoaded } from "@/lib/ffmpeg";

const VIDEO_FORMATS = ["mp4", "webm", "mov"];
const AUDIO_FORMATS = ["mp3", "m4a", "wav", "aac", "flac", "ogg"];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function argsFor(targetExt: string, sourceIsVideo: boolean): string[] {
  switch (targetExt) {
    case "mp4":
      return ["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k"];
    case "webm":
      return ["-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-c:a", "libopus"];
    case "mov":
      return ["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart"];
    case "mp3":
      return [...(sourceIsVideo ? ["-vn"] : []), "-c:a", "libmp3lame", "-b:a", "192k"];
    case "m4a":
    case "aac":
      return [...(sourceIsVideo ? ["-vn"] : []), "-c:a", "aac", "-b:a", "192k"];
    case "wav":
      return [...(sourceIsVideo ? ["-vn"] : []), "-c:a", "pcm_s16le"];
    case "flac":
      return [...(sourceIsVideo ? ["-vn"] : []), "-c:a", "flac"];
    case "ogg":
      return [...(sourceIsVideo ? ["-vn"] : []), "-c:a", "libvorbis"];
    default:
      return [];
  }
}

function mimeFor(ext: string): string {
  switch (ext) {
    case "mp4": return "video/mp4";
    case "webm": return "video/webm";
    case "mov": return "video/quicktime";
    case "mp3": return "audio/mpeg";
    case "m4a": case "aac": return "audio/aac";
    case "wav": return "audio/wav";
    case "flac": return "audio/flac";
    case "ogg": return "audio/ogg";
    default: return "application/octet-stream";
  }
}

export function ConvertMediaForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isVideo, setIsVideo] = React.useState(false);
  const [target, setTarget] = React.useState("mp4");
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
    const isV = f.type.startsWith("video/");
    setIsVideo(isV);
    setTarget(isV ? "mp4" : "mp3");
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

      const srcExt = extOf(file.name) || (isVideo ? "mp4" : "mp3");
      const inputName = `input.${srcExt}`;
      const outputName = `output.${target}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const out = await runFFmpeg({
        input: { name: inputName, bytes },
        outputName,
        args: argsFor(target, isVideo),
        onProgress: (r) => setProgress(Math.round(r * 100)),
      });

      const blob = new Blob([new Uint8Array(out)], { type: mimeFor(target) });
      setResultUrl(URL.createObjectURL(blob));
      const baseName = file.name.replace(/\.[^.]+$/, "");
      setResultName(`${baseName}.${target}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Conversion failed.");
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

  const targetIsVideo = VIDEO_FORMATS.includes(target);

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
              <div className="text-xs text-muted-foreground">{formatBytes(file.size)}</div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={reset} disabled={running} aria-label="Remove">
              <X className="size-4" />
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Convert to</span>
              <Select value={target} onValueChange={(v) => v && setTarget(v)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isVideo && (
                    <>
                      {VIDEO_FORMATS.map((f) => (
                        <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                      ))}
                    </>
                  )}
                  {AUDIO_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isVideo && !targetIsVideo && (
                <span className="text-xs text-muted-foreground">Video → audio: video stream dropped.</span>
              )}
            </div>

            <Button size="lg" onClick={run} disabled={running}>
              {running ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {phase === "loading" ? "Loading ffmpeg" : "Converting"}…
                </>
              ) : (
                "Convert"
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
              {targetIsVideo
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
