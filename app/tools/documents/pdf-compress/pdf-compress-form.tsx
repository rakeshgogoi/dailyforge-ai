"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Download, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { gateRateLimit } from "@/lib/rate-limit-client";

import { Button } from "@/components/ui/button";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function PdfCompressForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pageCount, setPageCount] = React.useState<number | null>(null);
  const [dpi, setDpi] = React.useState(110);
  const [quality, setQuality] = React.useState(70);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [resultBytes, setResultBytes] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [phase, setPhase] = React.useState<"idle" | "loading" | "rendering">("idle");
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const onDrop = React.useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResultBytes(0);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const bytes = new Uint8Array(await f.arrayBuffer());
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setPageCount(src.getPageCount());
    } catch (err) {
      console.error(err);
      toast.error("Couldn't read that PDF.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  function reset() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPageCount(null);
    setResultUrl(null);
    setResultBytes(0);
    setProgress(0);
    setPhase("idle");
  }

  async function run() {
    if (!file) return;
    const gate = await gateRateLimit("pdf-compress");
    if (!gate.ok) {
      toast.error(gate.error);
      return;
    }
    setRunning(true);
    setProgress(0);
    setPhase("loading");
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      // Dynamically import heavy libs.
      const pdfjs = await import("pdfjs-dist");
      // pdfjs-dist v5 needs a workerSrc.
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const { PDFDocument } = await import("pdf-lib");

      setPhase("rendering");
      const data = new Uint8Array(await file.arrayBuffer());
      const srcDoc = await pdfjs.getDocument({ data }).promise;
      const total = srcDoc.numPages;

      const outDoc = await PDFDocument.create();
      // Convert DPI → pdfjs viewport scale. pdfjs default is 72 DPI.
      const scale = dpi / 72;
      const jpegQuality = quality / 100;

      for (let pageNum = 1; pageNum <= total; pageNum++) {
        const page = await srcDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported.");
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        const blob: Blob = await new Promise((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
            "image/jpeg",
            jpegQuality,
          ),
        );
        const jpegBytes = new Uint8Array(await blob.arrayBuffer());
        const embedded = await outDoc.embedJpg(jpegBytes);
        // Use original page size (pt), not raster size, so the page is correctly proportioned.
        const origViewport = page.getViewport({ scale: 1 });
        const pageRef = outDoc.addPage([origViewport.width, origViewport.height]);
        pageRef.drawImage(embedded, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });
        canvas.width = 0;
        canvas.height = 0;
        setProgress(Math.round((pageNum / total) * 100));
      }

      const outBytes = await outDoc.save();
      const blob = new Blob([new Uint8Array(outBytes)], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      setResultBytes(blob.size);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "PDF compress failed.");
    } finally {
      setPhase("idle");
      setRunning(false);
    }
  }

  function download() {
    if (!resultUrl || !file) return;
    const base = file.name.replace(/\.pdf$/i, "");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${base}-compressed.pdf`;
    a.click();
  }

  const savings = resultBytes > 0 && file ? Math.round((1 - resultBytes / file.size) * 100) : 0;

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
            {isDragActive ? "Drop the PDF here" : "Drop a PDF, or click to choose"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Runs entirely in your browser.</p>
        </div>
      )}

      {file && (
        <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{file.name}</div>
            <div className="text-xs text-muted-foreground">
              {pageCount != null ? `${pageCount} pages · ` : ""}{formatBytes(file.size)}
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={reset} disabled={running} aria-label="Remove">
            <X className="size-4" />
          </Button>
        </div>
      )}

      {file && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between">
                <label htmlFor="dpi" className="text-sm font-medium">DPI</label>
                <span className="text-xs tabular-nums">{dpi}</span>
              </div>
              <input
                id="dpi"
                type="range"
                min="60"
                max="200"
                step="10"
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
                disabled={running}
                className="w-full accent-orange-500"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <label htmlFor="quality" className="text-sm font-medium">JPEG quality</label>
                <span className="text-xs tabular-nums">{quality}</span>
              </div>
              <input
                id="quality"
                type="range"
                min="30"
                max="95"
                step="5"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                disabled={running}
                className="w-full accent-orange-500"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Lower DPI and quality = smaller file. <strong className="text-foreground">Each page becomes a raster image</strong>, so the text won&apos;t be selectable in the output. Best for scanned docs or screenshots-heavy PDFs.
          </p>

          <Button size="lg" onClick={run} disabled={running} className="w-full sm:w-auto">
            {running ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {phase === "loading" ? "Loading" : `Rendering ${progress}%`}…
              </>
            ) : (
              "Compress"
            )}
          </Button>

          {running && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{phase === "loading" ? "Loading PDF engine" : "Re-rendering pages"}</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {resultUrl && file && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {formatBytes(file.size)} → {formatBytes(resultBytes)}
              {savings > 0 && <span className="ml-2 text-emerald-600 dark:text-emerald-400">−{savings}%</span>}
              {savings <= 0 && <span className="ml-2 text-amber-600 dark:text-amber-400">no savings — try lower DPI / quality</span>}
            </div>
            <Button onClick={download} size="sm">
              <Download className="size-4" />
              Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
