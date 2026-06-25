"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

// Single-threaded core — works without SharedArrayBuffer / COOP+COEP.
const CORE_VERSION = "0.12.10";
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let instance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

export type LoadProgress = {
  phase: "core" | "wasm" | "ready";
  percent: number;
};

export async function loadFFmpeg(
  onLoadProgress?: (p: LoadProgress) => void,
): Promise<FFmpeg> {
  if (instance) return instance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const ff = new FFmpeg();

    onLoadProgress?.({ phase: "core", percent: 5 });
    const coreURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript");
    onLoadProgress?.({ phase: "wasm", percent: 35 });
    const wasmURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm");
    onLoadProgress?.({ phase: "wasm", percent: 80 });

    await ff.load({ coreURL, wasmURL });

    instance = ff;
    onLoadProgress?.({ phase: "ready", percent: 100 });
    return ff;
  })();

  try {
    return await loadingPromise;
  } catch (err) {
    loadingPromise = null;
    throw err;
  }
}

export function isFFmpegLoaded(): boolean {
  return instance !== null;
}

/** Run ffmpeg on a single input file and return the output bytes. */
export async function runFFmpeg(opts: {
  input: { name: string; bytes: Uint8Array };
  outputName: string;
  args: string[];
  onProgress?: (ratio: number) => void;
  onLog?: (line: string) => void;
}): Promise<Uint8Array> {
  const ff = await loadFFmpeg();

  const handleProgress = (e: { progress: number }) => {
    opts.onProgress?.(Math.max(0, Math.min(1, e.progress || 0)));
  };
  const handleLog = (e: { message: string }) => {
    opts.onLog?.(e.message);
  };

  ff.on("progress", handleProgress);
  if (opts.onLog) ff.on("log", handleLog);

  try {
    await ff.writeFile(opts.input.name, opts.input.bytes);
    // Full command: ffmpeg -i <input> <args...> <output>
    const fullArgs = ["-i", opts.input.name, ...opts.args, opts.outputName];
    const code = await ff.exec(fullArgs);
    if (code !== 0) {
      throw new Error(`ffmpeg exited with code ${code}`);
    }
    const data = (await ff.readFile(opts.outputName)) as Uint8Array;
    // Clean up so subsequent runs in the same session start fresh.
    await ff.deleteFile(opts.input.name).catch(() => {});
    await ff.deleteFile(opts.outputName).catch(() => {});
    return data;
  } finally {
    ff.off("progress", handleProgress);
    if (opts.onLog) ff.off("log", handleLog);
  }
}
