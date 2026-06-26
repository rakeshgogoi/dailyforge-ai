import { NextResponse } from "next/server";

import { enforceLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024;

const SUPPORTED_FORMATS = new Set([
  "docx", "doc", "rtf", "odt", "pdf", "html", "htm", "md", "markdown", "txt",
]);

type CCTask = {
  id: string;
  name: string;
  status: string;
  message?: string;
  operation: string;
  result?: {
    form?: { url: string; parameters: Record<string, string> };
    files?: { url: string; filename: string }[];
  };
};

type CCJob = {
  id: string;
  status: string;
  tasks: CCTask[];
};

async function cc<T>(apiKey: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.cloudconvert.com/v2${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      authorization: `Bearer ${apiKey}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CloudConvert ${path} → ${res.status} ${text.slice(0, 240)}`);
  }
  return (await res.json()) as T;
}

export async function POST(req: Request) {
  const blocked = await enforceLimit("convert", req);
  if (blocked) return blocked;

  const apiKey = process.env.CLOUDCONVERT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing CLOUDCONVERT_API_KEY." }, { status: 500 });
  }

  let inForm: FormData;
  try {
    inForm = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  const file = inForm.get("file");
  const sourceRaw = String(inForm.get("sourceFormat") ?? "").toLowerCase();
  const targetRaw = String(inForm.get("targetFormat") ?? "").toLowerCase();

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Attach a file." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 25 MB)." }, { status: 413 });
  }
  if (!SUPPORTED_FORMATS.has(sourceRaw) || !SUPPORTED_FORMATS.has(targetRaw)) {
    return NextResponse.json({ error: "Unsupported source or target format." }, { status: 400 });
  }

  // Normalise format aliases for CloudConvert.
  const inputFormat = sourceRaw === "htm" ? "html" : sourceRaw === "markdown" ? "md" : sourceRaw;
  const outputFormat = targetRaw === "htm" ? "html" : targetRaw === "markdown" ? "md" : targetRaw;

  try {
    // 1. Create job.
    const { data: job } = await cc<{ data: CCJob }>(apiKey, "/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tasks: {
          "import-1": { operation: "import/upload" },
          "convert-1": {
            operation: "convert",
            input: "import-1",
            input_format: inputFormat,
            output_format: outputFormat,
          },
          "export-1": {
            operation: "export/url",
            input: "convert-1",
            inline: false,
            archive_multiple_files: false,
          },
        },
        tag: "dailyforge",
      }),
    });

    const importTask = job.tasks.find((t) => t.name === "import-1");
    if (!importTask?.result?.form) {
      throw new Error("CloudConvert didn't return an upload form.");
    }

    // 2. Upload the file to the import task's URL.
    const uploadForm = new FormData();
    for (const [k, v] of Object.entries(importTask.result.form.parameters)) {
      uploadForm.append(k, String(v));
    }
    uploadForm.append("file", file, file.name);
    const uploadRes = await fetch(importTask.result.form.url, {
      method: "POST",
      body: uploadForm,
    });
    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => "");
      throw new Error(`Upload failed: ${uploadRes.status} ${text.slice(0, 240)}`);
    }

    // 3. Wait for the job to finish (CloudConvert holds the request open).
    const { data: doneJob } = await cc<{ data: CCJob }>(apiKey, `/jobs/${job.id}/wait`);

    if (doneJob.status !== "finished") {
      const failed = doneJob.tasks.find((t) => t.status === "error");
      const msg = failed?.message ?? `Job ended with status ${doneJob.status}.`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const exportTask = doneJob.tasks.find((t) => t.name === "export-1");
    const fileUrl = exportTask?.result?.files?.[0]?.url;
    const fileName = exportTask?.result?.files?.[0]?.filename;
    if (!fileUrl || !fileName) {
      throw new Error("CloudConvert didn't return a download URL.");
    }

    // 4. Stream the result back.
    const dl = await fetch(fileUrl);
    if (!dl.ok) throw new Error(`Result download failed: ${dl.status}`);
    const out = new Uint8Array(await dl.arrayBuffer());
    return new Response(out, {
      status: 200,
      headers: {
        "content-type": dl.headers.get("content-type") ?? "application/octet-stream",
        "content-length": String(out.byteLength),
        "x-output-filename": fileName,
      },
    });
  } catch (err) {
    console.error("[doc-convert] error", err);
    const msg = err instanceof Error ? err.message : "Conversion failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
