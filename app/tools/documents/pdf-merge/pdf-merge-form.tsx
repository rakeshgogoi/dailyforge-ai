"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { ArrowDown, ArrowUp, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Item = { id: string; file: File };

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function PdfMergeForm() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [merging, setMerging] = React.useState(false);

  const onDrop = React.useCallback((accepted: File[]) => {
    const pdfs = accepted.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    const skipped = accepted.length - pdfs.length;
    if (skipped > 0) toast.warning(`Skipped ${skipped} non-PDF file${skipped === 1 ? "" : "s"}.`);
    if (pdfs.length === 0) return;
    const next = pdfs.map((f, i) => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${i}`,
      file: f,
    }));
    setItems((prev) => [...prev, ...next]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
  });

  function remove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  async function merge() {
    if (items.length < 2) {
      toast.error("Add at least two PDFs to merge.");
      return;
    }
    setMerging(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const out = await PDFDocument.create();
      for (const it of items) {
        const bytes = new Uint8Array(await it.file.arrayBuffer());
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copied = await out.copyPages(src, src.getPageIndices());
        copied.forEach((p) => out.addPage(p));
      }
      const merged = await out.save();
      const blob = new Blob([new Uint8Array(merged)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Merged ${items.length} PDFs.`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Couldn't merge those PDFs.");
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="mt-10 space-y-6">
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
          {isDragActive ? "Drop the PDFs here" : "Drop PDFs here, or click to choose"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Files are processed in your browser. Nothing is uploaded.
        </p>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li
              key={it.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
            >
              <span className="text-xs text-muted-foreground tabular-nums w-6">
                {i + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{it.file.name}</div>
                <div className="text-xs text-muted-foreground">{formatBytes(it.file.size)}</div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => move(it.id, -1)}
                disabled={i === 0 || merging}
                aria-label="Move up"
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => move(it.id, 1)}
                disabled={i === items.length - 1 || merging}
                aria-label="Move down"
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(it.id)}
                disabled={merging}
                aria-label="Remove"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="flex items-center gap-3">
          <Button size="lg" onClick={merge} disabled={items.length < 2 || merging}>
            {merging ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Merging…
              </>
            ) : (
              `Merge ${items.length} PDFs`
            )}
          </Button>
          <Button variant="ghost" onClick={() => setItems([])} disabled={merging}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
