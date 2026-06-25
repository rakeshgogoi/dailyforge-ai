"use client";

import * as React from "react";
import { AlertTriangle, Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";

type Experience = {
  title: string;
  company: string;
  period: string;
  bullets: string[];
};

type Result = {
  summary: string;
  skills: string[];
  experience: Experience[];
  warnings: string[];
};

function resultToMarkdown(r: Result, name?: string): string {
  const lines: string[] = [];
  if (name) lines.push(`# ${name}`, "");
  lines.push("## Summary", "", r.summary, "");
  lines.push("## Skills", "", r.skills.map((s) => `- ${s}`).join("\n"), "");
  lines.push("## Experience", "");
  for (const job of r.experience) {
    lines.push(`### ${job.title} — ${job.company}`, `*${job.period}*`, "");
    lines.push(job.bullets.map((b) => `- ${b}`).join("\n"), "");
  }
  return lines.join("\n").trim();
}

export function ResumeForm() {
  const [name, setName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [jd, setJd] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Result | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notes.trim() || !jd.trim()) return;

    setLoading(true);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/tools/resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          notes: notes.trim(),
          jobDescription: jd.trim(),
        }),
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

  async function copyMarkdown() {
    if (!result) return;
    await navigator.clipboard.writeText(resultToMarkdown(result, name.trim() || undefined));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-10">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Your name (optional)</label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium">Your notes or current CV</label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your CV, or just dump roles, projects, and what you did at each. The model will only use what's here — don't worry about formatting."
            className="min-h-[200px]"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="jd" className="text-sm font-medium">Target job description</label>
          <Textarea
            id="jd"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the JD you're applying to."
            className="min-h-[180px]"
            required
            disabled={loading}
          />
        </div>

        <Button type="submit" size="lg" disabled={loading || !notes.trim() || !jd.trim()}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Tailoring…
            </>
          ) : (
            "Build resume"
          )}
        </Button>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">
        Notes up to ~12,000 chars; JD up to ~8,000. The model uses only what you provide — anything it had to invent is flagged below.
      </p>

      {result && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">{name.trim() || "Tailored resume"}</CardTitle>
            <CardAction>
              <Button variant="ghost" size="icon-sm" onClick={copyMarkdown} aria-label="Copy as Markdown">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Summary</h3>
              <p>{result.summary}</p>
            </section>

            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.skills.map((s, i) => (
                  <span key={i} className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Experience</h3>
              <div className="space-y-5">
                {result.experience.map((job, i) => (
                  <div key={i}>
                    <div className="font-medium">{job.title} — {job.company}</div>
                    <div className="text-xs text-muted-foreground italic">{job.period}</div>
                    <ul className="mt-2 space-y-1 list-disc list-outside pl-5">
                      {job.bullets.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {result.warnings.length > 0 && (
              <section className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-amber-700 dark:text-amber-300">
                <div className="flex items-center gap-2 font-medium text-xs uppercase tracking-wider mb-2">
                  <AlertTriangle className="size-4" />
                  Confirm before sending
                </div>
                <ul className="space-y-1 list-disc list-outside pl-5 text-xs">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </section>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
