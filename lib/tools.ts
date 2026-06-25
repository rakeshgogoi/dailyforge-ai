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
      { slug: "convert", name: "Convert any document", blurb: "PDF, DOCX, MD, HTML, TXT — any-to-any.", status: "soon" },
      { slug: "ocr", name: "OCR & handwriting", blurb: "Image or PDF to editable text.", status: "soon" },
      { slug: "summarize", name: "Summarize", blurb: "PDF, article URL, or YouTube link to bullet notes.", status: "live" },
      { slug: "translate", name: "Translate text", blurb: "Paste any text; auto-detect source, translate to 25+ languages.", status: "live" },
      { slug: "pdf-merge", name: "Merge PDF", blurb: "Combine multiple PDFs into one.", status: "live" },
      { slug: "pdf-split", name: "Split PDF", blurb: "Pick pages or split by range.", status: "live" },
      { slug: "pdf-compress", name: "Compress PDF", blurb: "Shrink without losing readability.", status: "soon" },
      { slug: "pdf-sign", name: "Sign PDF", blurb: "Draw or upload signature, drop on the page.", status: "soon" },
      { slug: "resume", name: "Resume builder", blurb: "Tailor a CV from your notes to a job description.", status: "soon" },
      { slug: "rewrite", name: "Grammar & tone rewriter", blurb: "Fix grammar, switch tone formal ↔ casual.", status: "live" },
    ],
  },
  {
    slug: "images",
    name: "Images",
    tagline: "Edit, restore, convert, generate.",
    tools: [
      { slug: "bg-remove", name: "Remove background", blurb: "One-click transparent PNG.", status: "soon" },
      { slug: "upscale", name: "Upscale & restore", blurb: "Sharpen, denoise, repair old photos.", status: "soon" },
      { slug: "compress", name: "Compress image", blurb: "Smaller files, same quality.", status: "soon" },
      { slug: "resize", name: "Resize & convert", blurb: "JPG ↔ PNG ↔ WebP, any dimensions.", status: "soon" },
      { slug: "passport", name: "Passport / ID photo", blurb: "Correct size, background, and head position.", status: "soon" },
      { slug: "watermark", name: "Watermark", blurb: "Add or remove watermarks.", status: "soon" },
    ],
  },
  {
    slug: "audio-video",
    name: "Audio & Video",
    tagline: "Transcribe, caption, convert, voice.",
    tools: [
      { slug: "transcribe", name: "Transcribe", blurb: "Audio or video → text with speakers.", status: "soon" },
      { slug: "subtitles", name: "Auto-subtitle", blurb: "Burn captions into your video.", status: "soon" },
      { slug: "compress-video", name: "Compress video", blurb: "Smaller files for sharing.", status: "soon" },
      { slug: "convert-media", name: "Convert media", blurb: "MP4, MP3, WAV, MOV, WebM — any-to-any.", status: "soon" },
      { slug: "trim", name: "Trim & cut", blurb: "Snip a clip from a longer file.", status: "soon" },
      { slug: "tts", name: "Text-to-speech", blurb: "Natural voiceover from your script.", status: "soon" },
      { slug: "denoise", name: "Remove background noise", blurb: "Studio-clean audio from any recording.", status: "soon" },
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
