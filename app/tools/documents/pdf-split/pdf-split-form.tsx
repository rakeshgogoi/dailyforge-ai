"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { gateRateLimit } from "@/lib/rate-limit-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Loaded = { file: File; pageCount: number };

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// "1-3, 5, 8-10" → [0,1,2, 4, 7,8,9]  (zero-indexed)
function parseRanges(input: string, pageCount: number): number[] | { error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { error: "Enter at least one page or range." };
  const seen = new Set<number>();
  const result: number[] = [];
  for (const raw of trimmed.split(",")) {
    const part = raw.trim();
    if (!part) continue;
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) return { error: `Bad range: "${part}".` };
    const start = parseInt(m[1], 10);
    const end = m[2] ? parseInt(m[2], 10) : start;
    if (start < 1 || end < 1) return { error: `Page numbers start at 1: "${part}".` };
    if (start > pageCount || end > pageCount) {
      return { error: `"${part}" is out of range (this PDF has ${pageCount} pages).` };
    }
    if (start > end) return { error: `Range "${part}" is reversed.` };
    for (let p = start; p <= end; p++) {
      if (!seen.has(p)) {
        seen.add(p);
        result.push(p - 1);
      }
    }
  }
  return result;
}

export function PdfSplitForm() {
  const [loaded, setLoaded] = React.useState<Loaded | null>(null);
  const [ranges, setRanges] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [splitting, setSplitting] = React.useState(false);

  const onDrop = React.useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please drop a PDF.");
      return;
    }
    setLoading(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = new Uint8Array(await f.arrayBuffer());
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setLoaded({ file: f, pageCount: src.getPageCount() });
      setRanges("");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Couldn't read that PDF.");
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  async function split() {
    if (!loaded) return;
    const parsed = parseRanges(ranges, loaded.pageCount);
    if ("error" in parsed) {
      toast.error(parsed.error);
      return;
    }
    const gate = await gateRateLimit("pdf-split");
    if (!gate.ok) {
      toast.error(gate.error);
      return;
    }
    setSplitting(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = new Uint8Array(await loaded.file.arrayBuffer());
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, parsed);
      copied.forEach((p) => out.addPage(p));
      const outBytes = await out.save();
      const blob = new Blob([new Uint8Array(outBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = loaded.file.name.replace(/\.pdf$/i, "");
      a.href = url;
      a.download = `${base}-extracted.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Extracted ${parsed.length} page${parsed.length === 1 ? "" : "s"}.`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Couldn't split that PDF.");
    } finally {
      setSplitting(false);
    }
  }

  return (
    <div className="mt-10 space-y-6">
      {!loaded && (
        <div
          {...getRootProps()}
          className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-orange-500 bg-orange-500/5"
              : "border-border hover:border-foreground/30"
          }`}
        >
          <input {...getInputProps()} />
          {loading ? (
            <Loader2 className="size-8 mx-auto animate-spin text-muted-foreground" />
          ) : (
            <Upload className="size-8 mx-auto text-muted-foreground" />
          )}
          <p className="mt-3 font-medium">
            {isDragActive ? "Drop the PDF here" : loading ? "Reading…" : "Drop a PDF here, or click to choose"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Files are processed in your browser. Nothing is uploaded.
          </p>
        </div>
      )}

      {loaded && (
        <>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <FileText className="size-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{loaded.file.name}</div>
              <div className="text-xs text-muted-foreground">
                {loaded.pageCount} page{loaded.pageCount === 1 ? "" : "s"} · {formatBytes(loaded.file.size)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setLoaded(null);
                setRanges("");
              }}
              disabled={splitting}
              aria-label="Remove"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label htmlFor="ranges" className="text-sm font-medium">
              Pages to extract
            </label>
            <Input
              id="ranges"
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder={`e.g. 1-3, 5, 8-${loaded.pageCount}`}
              disabled={splitting}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated page numbers and ranges. Order is preserved; duplicates are dropped.
            </p>
          </div>

          <Button size="lg" onClick={split} disabled={!ranges.trim() || splitting}>
            {splitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Extracting…
              </>
            ) : (
              "Extract pages"
            )}
          </Button>
        </>
      )}
    </div>
  );
}
