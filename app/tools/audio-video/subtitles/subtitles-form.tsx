"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Check, Copy, Download, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Format = "srt" | "vtt";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function SubtitlesForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [format, setFormat] = React.useState<Format>("srt");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{
    body: string;
    segments: number;
    language: string;
    duration: number;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);

  const onDrop = React.useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".m4a", ".wav", ".flac", ".ogg", ".webm"],
      "video/*": [".mp4", ".webm", ".mov", ".mpeg"],
    },
    multiple: false,
  });

  function reset() {
    setFile(null);
    setResult(null);
    setCopied(false);
  }

  async function run() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("audio", file);
      form.append("format", format);
      const res = await fetch("/api/tools/subtitles", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? `Failed (HTTP ${res.status}).`);
      }
      const body = await res.text();
      setResult({
        body,
        segments: Number(res.headers.get("x-segment-count") ?? 0),
        language: res.headers.get("x-language") ?? "",
        duration: Number(res.headers.get("x-duration") ?? 0),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    if (!result) return;
    await navigator.clipboard.writeText(result.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const blob = new Blob([result.body], { type: format === "vtt" ? "text/vtt" : "application/x-subrip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
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
          <p className="mt-1 text-xs text-muted-foreground">Up to 25 MB. MP3, M4A, WAV, MP4, WebM.</p>
        </div>
      )}

      {file && (
        <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
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
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Output</span>
            <Select value={format} onValueChange={(v) => v && setFormat(v as Format)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="srt">SRT (most editors)</SelectItem>
                <SelectItem value="vtt">WebVTT (YouTube, web)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="lg" onClick={run} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating…
              </>
            ) : (
              "Generate subtitles"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Powered by Groq Whisper. To burn subtitles into a video, use any video editor or ffmpeg locally.
          </p>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {result.segments} cues · {result.language ? `${result.language.toUpperCase()} · ` : ""}{Math.round(result.duration)}s
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" onClick={copyAll} aria-label="Copy">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
              <Button onClick={download} size="sm">
                <Download className="size-4" />
                Download .{format}
              </Button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed bg-muted/40 rounded-md p-3 max-h-96 overflow-auto">
            {result.body}
          </pre>
        </div>
      )}
    </div>
  );
}
