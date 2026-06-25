"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAX_CHARS = 1500;

const LANGUAGES: { value: string; label: string }[] = [
  { value: "en-IN", label: "English (India)" },
  { value: "hi-IN", label: "Hindi" },
  { value: "bn-IN", label: "Bengali" },
  { value: "gu-IN", label: "Gujarati" },
  { value: "kn-IN", label: "Kannada" },
  { value: "ml-IN", label: "Malayalam" },
  { value: "mr-IN", label: "Marathi" },
  { value: "od-IN", label: "Odia" },
  { value: "pa-IN", label: "Punjabi" },
  { value: "ta-IN", label: "Tamil" },
  { value: "te-IN", label: "Telugu" },
];

const VOICES = [
  "anushka", "abhilash", "manisha", "vidya", "arya", "karun", "hitesh",
  "aditya", "ritu", "priya", "neha", "rahul", "pooja", "rohan", "simran",
  "kavya", "amit", "dev", "ishita", "shreya", "ratan", "varun", "manan",
  "sumit", "roopa", "kabir", "aayan", "shubh", "ashutosh", "advait",
  "anand", "tanya", "tarun", "sunny", "mani", "gokul", "vijay", "shruti",
  "suhani", "mohit", "kavitha", "rehan", "soham", "rupali",
];

export function TtsForm() {
  const [text, setText] = React.useState("");
  const [language, setLanguage] = React.useState("en-IN");
  const [voice, setVoice] = React.useState("anushka");
  const [pace, setPace] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    try {
      const res = await fetch("/api/tools/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.trim(), language, voice, pace }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? `Failed (HTTP ${res.status}).`);
      }
      const blob = await res.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `dailyforge-${voice}-${language}.wav`;
    a.click();
  }

  const remaining = MAX_CHARS - text.length;

  return (
    <div className="mt-10 space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="tts-text" className="text-sm font-medium">Text</label>
            <span className={`text-xs tabular-nums ${remaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {text.length} / {MAX_CHARS}
            </span>
          </div>
          <Textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something to speak…"
            className="min-h-[140px]"
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium block">Language</label>
            <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium block">Voice</label>
            <Select value={voice} onValueChange={(v) => v && setVoice(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((v) => (
                  <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="pace" className="text-sm font-medium">Pace</label>
              <span className="text-xs tabular-nums">{pace.toFixed(2)}×</span>
            </div>
            <input
              id="pace"
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={pace}
              onChange={(e) => setPace(Number(e.target.value))}
              className="w-full accent-orange-500"
              disabled={loading}
            />
          </div>
        </div>

        <Button type="submit" size="lg" disabled={loading || !text.trim() || remaining < 0}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate speech"
          )}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        Powered by Sarvam (bulbul v2). Best results for Indian English and Indic languages.
      </p>

      {audioUrl && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <audio src={audioUrl} controls className="w-full" />
          <div className="flex items-center justify-end">
            <Button onClick={download} size="sm">
              <Download className="size-4" />
              Download WAV
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
