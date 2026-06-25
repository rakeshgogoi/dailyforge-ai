"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Check, Copy, Download, Loader2, Upload, X } from "lucide-react";
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

type Format = "md" | "html" | "pdf" | "txt";

const FORMAT_LABELS: Record<Format, string> = {
  md: "Markdown",
  html: "HTML",
  pdf: "PDF",
  txt: "Plain text",
};

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function inferFormat(file: File): Format | null {
  const ext = extOf(file.name);
  if (ext === "md" || ext === "markdown") return "md";
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "pdf") return "pdf";
  if (ext === "txt") return "txt";
  return null;
}

// Valid source → target pairs. We're honest about what we can do well.
const ALLOWED: Record<Format, Format[]> = {
  md: ["html", "pdf", "txt"],
  html: ["md", "pdf", "txt"],
  pdf: ["txt"],
  txt: ["md", "html", "pdf"],
};

export function ConvertForm() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pasted, setPasted] = React.useState("");
  const [source, setSource] = React.useState<Format>("md");
  const [target, setTarget] = React.useState<Format>("html");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ kind: "text"; body: string } | { kind: "blob"; url: string; name: string } | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (result?.kind === "blob") URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const onDrop = React.useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPasted("");
    setResult((prev) => {
      if (prev?.kind === "blob") URL.revokeObjectURL(prev.url);
      return null;
    });
    const inferred = inferFormat(f);
    if (inferred) {
      setSource(inferred);
      // Pick a sensible default target.
      const allowed = ALLOWED[inferred];
      if (!allowed.includes(target)) setTarget(allowed[0]);
    }
  }, [target]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/markdown": [".md", ".markdown"],
      "text/html": [".html", ".htm"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
    multiple: false,
  });

  function reset() {
    if (result?.kind === "blob") URL.revokeObjectURL(result.url);
    setFile(null);
    setPasted("");
    setResult(null);
    setCopied(false);
  }

  const haveInput = Boolean(file || pasted.trim());

  React.useEffect(() => {
    const allowed = ALLOWED[source];
    if (!allowed.includes(target)) setTarget(allowed[0]);
  }, [source, target]);

  async function readSource(): Promise<string> {
    if (pasted.trim()) return pasted;
    if (!file) return "";
    if (source === "pdf") {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const data = new Uint8Array(await file.arrayBuffer());
      const doc = await pdfjs.getDocument({ data }).promise;
      const out: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((it) => ("str" in it ? (it as { str: string }).str : ""))
          .join(" ");
        out.push(text);
      }
      return out.join("\n\n");
    }
    return await file.text();
  }

  async function run() {
    if (!haveInput) return;
    setLoading(true);
    setResult((prev) => {
      if (prev?.kind === "blob") URL.revokeObjectURL(prev.url);
      return null;
    });
    try {
      const src = await readSource();

      // Convert source → an intermediate string.
      let html: string | null = null;
      let md: string | null = null;
      let txt: string | null = null;

      if (source === "md") {
        md = src;
        const { marked } = await import("marked");
        html = await marked.parse(src);
        txt = src.replace(/[#>*_`~-]+/g, "").replace(/\s+/g, " ").trim();
      } else if (source === "html") {
        html = src;
        const TurndownService = (await import("turndown")).default;
        md = new TurndownService({ headingStyle: "atx" }).turndown(src);
        const tmp = document.createElement("div");
        tmp.innerHTML = src;
        txt = (tmp.textContent ?? "").replace(/\s+/g, " ").trim();
      } else if (source === "pdf") {
        txt = src;
      } else {
        txt = src;
        md = src;
        const { marked } = await import("marked");
        html = await marked.parse(src);
      }

      // Emit target.
      if (target === "md") {
        if (md == null) throw new Error("Can't convert that source to Markdown.");
        setResult({ kind: "text", body: md });
      } else if (target === "html") {
        if (html == null) {
          const { marked } = await import("marked");
          html = await marked.parse(src);
        }
        const wrapped = `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><title>${file?.name ?? "document"}</title></head>\n<body>\n${html}\n</body>\n</html>`;
        setResult({ kind: "text", body: wrapped });
      } else if (target === "txt") {
        if (txt == null) throw new Error("Couldn't extract plain text.");
        setResult({ kind: "text", body: txt });
      } else if (target === "pdf") {
        // Render HTML to canvas → PDF via html2canvas + jsPDF.
        if (html == null) {
          const { marked } = await import("marked");
          html = await marked.parse(src);
        }
        const { jsPDF } = await import("jspdf");
        const html2canvas = (await import("html2canvas")).default;

        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "-10000px";
        container.style.left = "0";
        container.style.width = "794px"; // A4 @ 96 DPI
        container.style.padding = "48px";
        container.style.background = "#ffffff";
        container.style.color = "#111111";
        container.style.fontFamily = "ui-sans-serif, system-ui, sans-serif";
        container.style.fontSize = "14px";
        container.style.lineHeight = "1.5";
        container.innerHTML = html;
        document.body.appendChild(container);
        try {
          const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });
          const imgData = canvas.toDataURL("image/jpeg", 0.92);
          const pdf = new jsPDF({ unit: "pt", format: "a4" });
          const pageW = pdf.internal.pageSize.getWidth();
          const pageH = pdf.internal.pageSize.getHeight();
          const ratio = canvas.width / canvas.height;
          const targetW = pageW;
          const targetH = pageW / ratio;
          if (targetH <= pageH) {
            pdf.addImage(imgData, "JPEG", 0, 0, targetW, targetH);
          } else {
            // Slice canvas into page-sized chunks.
            const sliceH = Math.floor(canvas.width / (pageW / pageH));
            let y = 0;
            while (y < canvas.height) {
              const sliceCanvas = document.createElement("canvas");
              sliceCanvas.width = canvas.width;
              sliceCanvas.height = Math.min(sliceH, canvas.height - y);
              const sctx = sliceCanvas.getContext("2d");
              if (!sctx) throw new Error("Canvas not supported.");
              sctx.drawImage(canvas, 0, y, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
              const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
              if (y > 0) pdf.addPage();
              pdf.addImage(sliceData, "JPEG", 0, 0, pageW, (sliceCanvas.height / canvas.width) * pageW);
              y += sliceCanvas.height;
            }
          }
          const blob = pdf.output("blob");
          const baseName = file ? file.name.replace(/\.[^.]+$/, "") : "document";
          setResult({ kind: "blob", url: URL.createObjectURL(blob), name: `${baseName}.pdf` });
        } finally {
          container.remove();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Conversion failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (result?.kind !== "text") return;
    await navigator.clipboard.writeText(result.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (result?.kind === "blob") {
      const a = document.createElement("a");
      a.href = result.url;
      a.download = result.name;
      a.click();
      return;
    }
    if (result?.kind === "text" && file) {
      const baseName = file.name.replace(/\.[^.]+$/, "") || "document";
      const ext = target === "md" ? "md" : target === "html" ? "html" : "txt";
      const mime = target === "html" ? "text/html" : "text/plain";
      const blob = new Blob([result.body], { type: `${mime}; charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="mt-10 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium block">From</label>
          <Select value={source} onValueChange={(v) => v && setSource(v as Format)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ALLOWED) as Format[]).map((f) => (
                <SelectItem key={f} value={f}>{FORMAT_LABELS[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium block">To</label>
          <Select value={target} onValueChange={(v) => v && setTarget(v as Format)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALLOWED[source].map((f) => (
                <SelectItem key={f} value={f}>{FORMAT_LABELS[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Supported pairs: MD ↔ HTML, MD/HTML → PDF/TXT, PDF → TXT, TXT → MD/HTML/PDF. DOCX is not supported in-browser — that needs a conversion service.
      </p>

      {!file && source !== "pdf" && (
        <div className="space-y-2">
          <label htmlFor="paste" className="text-sm font-medium">Or paste {FORMAT_LABELS[source]} content</label>
          <Textarea
            id="paste"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder={source === "md" ? "# Hello\n\nSome **markdown**…" : source === "html" ? "<h1>Hello</h1><p>Some <b>html</b>…</p>" : "Some plain text…"}
            className="min-h-[180px] font-mono text-xs"
            disabled={loading}
          />
        </div>
      )}

      {!file && (
        <div
          {...getRootProps()}
          className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-orange-500 bg-orange-500/5"
              : "border-border hover:border-foreground/30"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="size-6 mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">
            {isDragActive ? "Drop the file" : "…or drop a file (.md, .html, .pdf, .txt)"}
          </p>
        </div>
      )}

      {file && (
        <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{file.name}</div>
            <div className="text-xs text-muted-foreground">Source: {FORMAT_LABELS[source]}</div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={reset} disabled={loading} aria-label="Remove">
            <X className="size-4" />
          </Button>
        </div>
      )}

      <Button size="lg" onClick={run} disabled={loading || !haveInput}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Converting…
          </>
        ) : (
          `Convert to ${FORMAT_LABELS[target]}`
        )}
      </Button>

      {result?.kind === "text" && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon-sm" onClick={copy} aria-label="Copy">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
            <Button onClick={download} size="sm">
              <Download className="size-4" />
              Download .{target === "md" ? "md" : target === "html" ? "html" : "txt"}
            </Button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed bg-muted/40 rounded-md p-3 max-h-96 overflow-auto">
            {result.body}
          </pre>
        </div>
      )}

      {result?.kind === "blob" && (
        <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{result.name} ready.</span>
          <Button onClick={download} size="sm">
            <Download className="size-4" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
}
