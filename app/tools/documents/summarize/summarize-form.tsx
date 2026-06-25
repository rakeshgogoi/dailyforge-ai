"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

type SummaryResult = {
  title: string;
  bullets: string[];
};

export function SummarizeForm() {
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<SummaryResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/tools/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Something went wrong.");
      }
      setResult(data as SummaryResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10">
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="url"
          required
          placeholder="https://example.com/long-article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !url.trim()} size="lg">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Summarizing…
            </>
          ) : (
            "Summarize"
          )}
        </Button>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">
        Works for public articles, blog posts, and docs. Paywalled pages or
        client-rendered SPAs may not return readable text.
      </p>

      {result && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">{result.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc list-outside pl-5 text-sm leading-relaxed">
              {result.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
