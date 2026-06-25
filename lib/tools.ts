export type ToolStatus = "live" | "soon";

export type Tool = {
  slug: string;
  name: string;
  blurb: string;
  status: ToolStatus;
};

export type Category = {
  slug: "documents" | "images" | "audio-video";
  name: string;
  tagline: string;
  tools: Tool[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "documents",
    name: "Documents",
    tagline: "Convert, read, sign, summarize, translate.",
    tools: [
      { slug: "convert", name: "Convert document", blurb: "MD ↔ HTML, PDF → TXT, MD/HTML → PDF. In-browser, no upload.", status: "live" },
      { slug: "ocr", name: "OCR & handwriting", blurb: "Image to editable text — typed or handwritten.", status: "live" },
      { slug: "summarize", name: "Summarize", blurb: "PDF, article URL, or YouTube link to bullet notes.", status: "live" },
      { slug: "translate", name: "Translate text", blurb: "Paste any text; auto-detect source, translate to 25+ languages.", status: "live" },
      { slug: "pdf-merge", name: "Merge PDF", blurb: "Combine multiple PDFs into one.", status: "live" },
      { slug: "pdf-split", name: "Split PDF", blurb: "Pick pages or split by range.", status: "live" },
      { slug: "pdf-compress", name: "Compress PDF", blurb: "Shrink large PDFs by re-rendering pages as JPEGs. Text becomes raster.", status: "live" },
      { slug: "resume", name: "Resume builder", blurb: "Tailor a CV from your notes to a job description.", status: "live" },
      { slug: "rewrite", name: "Grammar & tone rewriter", blurb: "Fix grammar, switch tone formal ↔ casual.", status: "live" },
    ],
  },
  {
    slug: "images",
    name: "Images",
    tagline: "Edit, restore, convert, generate.",
    tools: [
      { slug: "bg-remove", name: "Remove background", blurb: "One-click transparent PNG — runs in your browser.", status: "live" },
      { slug: "upscale", name: "Upscale & sharpen", blurb: "High-quality lanczos resize at 2×, 3×, 4× — not AI, but crisp.", status: "live" },
      { slug: "compress", name: "Compress image", blurb: "Smaller files, same quality.", status: "live" },
      { slug: "resize", name: "Resize & convert", blurb: "JPG ↔ PNG ↔ WebP ↔ AVIF, any dimensions.", status: "live" },
      { slug: "passport", name: "Passport / ID photo", blurb: "Standard sizes, clean background, head positioned right.", status: "live" },
      { slug: "watermark", name: "Watermark", blurb: "Add a text or signature watermark — pick position, size, opacity.", status: "live" },
    ],
  },
  {
    slug: "audio-video",
    name: "Audio & Video",
    tagline: "Transcribe, caption, convert, voice.",
    tools: [
      { slug: "transcribe", name: "Transcribe", blurb: "Audio or video → text, optionally with timestamps.", status: "live" },
      { slug: "subtitles", name: "Auto-subtitle", blurb: "Generate SRT or WebVTT captions from audio or video.", status: "live" },
      { slug: "compress-video", name: "Compress video", blurb: "Smaller files for sharing — CRF knob, in your browser.", status: "live" },
      { slug: "convert-media", name: "Convert media", blurb: "MP4, MP3, WAV, MOV, WebM, M4A, FLAC, OGG — in your browser.", status: "live" },
      { slug: "trim", name: "Trim & cut", blurb: "Snip a clip from a longer file — no re-encoding.", status: "live" },
      { slug: "tts", name: "Text-to-speech", blurb: "Natural Indic + English voices. Powered by Sarvam.", status: "live" },
      { slug: "denoise", name: "Remove background noise", blurb: "Cut hiss and room tone from any recording.", status: "live" },
    ],
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getTool(categorySlug: string, toolSlug: string): { category: Category; tool: Tool } | undefined {
  const category = getCategory(categorySlug);
  if (!category) return undefined;
  const tool = category.tools.find((t) => t.slug === toolSlug);
  if (!tool) return undefined;
  return { category, tool };
}
