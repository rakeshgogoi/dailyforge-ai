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
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MODES = [
  { value: "fix", label: "Fix grammar", description: "Keep voice, clean up typos & grammar" },
  { value: "formal", label: "Make formal", description: "Polished, professional tone" },
  { value: "casual", label: "Make casual", description: "Friendly, conversational" },
  { value: "concise", label: "Tighten", description: "Cut filler, ~40–60% shorter" },
  { value: "expand", label: "Expand", description: "Add detail, ~2× longer" },
] as const;

type Mode = (typeof MODES)[number]["value"];

export function RewriteForm() {
  const [text, setText] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("fix");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/tools/rewrite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.trim(), mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setResult(data.rewritten);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-10">
      <form onSubmit={onSubmit} className="space-y-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the text you want to rewrite…"
          disabled={loading}
          className="min-h-[180px]"
          required
        />

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  <span className="flex flex-col items-start">
                    <span>{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.description}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="submit" disabled={loading || !text.trim()} size="lg" className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Rewriting…
              </>
            ) : (
              "Rewrite"
            )}
          </Button>
        </div>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">
        Up to ~8,000 characters per pass. The original is not stored.
      </p>

      {result && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
            <CardAction>
              <Button variant="ghost" size="icon-sm" onClick={copyResult} aria-label="Copy">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{result}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
