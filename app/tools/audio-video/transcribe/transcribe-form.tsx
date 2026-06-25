"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Check, Copy, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
  CardDescription,
} from "@/components/ui/card";

type Segment = { start: number; end: number; text: string };

type Result = {
  text: string;
  language: string | null;
  durationSeconds: number | null;
  segments?: Segment[];
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function formatTs(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TranscribeForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [timestamps, setTimestamps] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
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
      if (timestamps) form.append("timestamps", "true");
      const res = await fetch("/api/tools/transcribe", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setResult(data as Result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText() {
    if (!result) return;
    let text = result.text;
    if (result.segments) {
      text = result.segments.map((s) => `[${formatTs(s.start)}] ${s.text}`).join("\n");
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
            MP3, M4A, WAV, MP4, WebM. Up to 25 MB.
          </p>
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
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={timestamps}
              onChange={(e) => setTimestamps(e.target.checked)}
              disabled={loading}
              className="accent-orange-500"
            />
            <span>Include timestamps</span>
          </label>
          <Button size="lg" onClick={run} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Transcribing…
              </>
            ) : (
              "Transcribe"
            )}
          </Button>
        </div>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transcript</CardTitle>
            <CardDescription>
              {result.language ? `${result.language.toUpperCase()} · ` : ""}
              {result.durationSeconds != null ? `${formatTs(result.durationSeconds)} long` : ""}
            </CardDescription>
            <CardAction>
              <Button variant="ghost" size="icon-sm" onClick={copyText} aria-label="Copy">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {result.segments ? (
              <div className="space-y-2 text-sm leading-relaxed">
                {result.segments.map((s, i) => (
                  <div key={i} className="grid grid-cols-[60px_1fr] gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums pt-0.5">
                      {formatTs(s.start)}
                    </span>
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {result.text || "(no speech detected)"}
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
