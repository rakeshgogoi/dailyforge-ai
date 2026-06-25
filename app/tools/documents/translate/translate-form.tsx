"use client";

import * as React from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Russian",
  "Polish",
  "Turkish",
  "Arabic",
  "Hebrew",
  "Hindi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Urdu",
  "Japanese",
  "Korean",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Vietnamese",
  "Thai",
  "Indonesian",
];

type Result = {
  translated: string;
  detectedSourceLanguage: string;
};

export function TranslateForm() {
  const [text, setText] = React.useState("");
  const [target, setTarget] = React.useState("English");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/tools/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.trim(), targetLanguage: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setResult(data as Result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result.translated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-10">
      <form onSubmit={onSubmit} className="space-y-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the text you want to translate…"
          disabled={loading}
          className="min-h-[180px]"
          required
        />

        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Translate to</span>
            <Select value={target} onValueChange={(v) => v && setTarget(v)}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading || !text.trim()} size="lg" className="sm:ml-auto">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Translating…
              </>
            ) : (
              "Translate"
            )}
          </Button>
        </div>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">
        Up to ~8,000 characters per pass. Source language is auto-detected.
      </p>

      {result && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">{target}</CardTitle>
            <CardDescription>From {result.detectedSourceLanguage}</CardDescription>
            <CardAction>
              <Button variant="ghost" size="icon-sm" onClick={copyResult} aria-label="Copy">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{result.translated}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
