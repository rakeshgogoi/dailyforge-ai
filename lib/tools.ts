export type ToolStatus = "live" | "soon";

export type FaqItem = { q: string; a: string };

export type Tool = {
  slug: string;
  name: string;
  blurb: string;
  status: ToolStatus;
  seoIntro?: string;
  faq?: FaqItem[];
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
      {
        slug: "convert",
        name: "Convert document",
        blurb: "MD ↔ HTML, PDF → TXT, MD/HTML → PDF. In-browser, no upload.",
        status: "live",
        seoIntro:
          "Convert documents between Markdown, HTML, PDF, and plain text — for free, with no signup. The conversion runs in your browser whenever possible, so your files never leave your device for the common formats. For high-fidelity DOCX and complex layouts we use a trusted conversion service behind the scenes.",
        faq: [
          { q: "Is my document uploaded to a server?", a: "Markdown, HTML, and PDF-to-text conversions run entirely in your browser — nothing is uploaded. DOCX and a few advanced formats go through CloudConvert and are deleted within minutes." },
          { q: "Which formats are supported?", a: "Markdown (.md), HTML (.html), PDF (.pdf), plain text (.txt), and DOCX (.docx). You can convert between most of these pairings." },
          { q: "Will my formatting be preserved?", a: "Headings, lists, links, and code blocks survive every conversion. Complex tables and embedded fonts work best when going through the CloudConvert path." },
          { q: "Is there a file-size limit?", a: "In-browser conversions can handle files up to a few hundred MB depending on your device. The hosted DOCX path accepts files up to 100 MB." },
          { q: "Does it cost anything?", a: "It's free for anonymous users with a fair-use rate limit. Sign in to remove the limit." },
        ],
      },
      {
        slug: "ocr",
        name: "OCR & handwriting",
        blurb: "Image to editable text — typed or handwritten.",
        status: "live",
        seoIntro:
          "Extract text from images, scans, and screenshots — including handwritten notes — using Google's Gemini vision model. Upload a photo, get editable, copy-pasteable text in seconds. Works on receipts, whiteboards, book pages, business cards, and historical documents.",
        faq: [
          { q: "Does it handle handwriting?", a: "Yes — Gemini is one of the strongest models for cursive and printed handwriting. Clear photos give the best results." },
          { q: "Which languages are supported?", a: "100+ languages, including Hindi, Bengali, Tamil, Arabic, Chinese, Japanese, and most European scripts." },
          { q: "What file types can I upload?", a: "JPG, PNG, WebP, and HEIC images. For multi-page PDFs, use the Summarize tool or split the PDF first." },
          { q: "Will my image be stored?", a: "No. The image is sent to Gemini for the OCR pass and immediately discarded after the text is returned." },
          { q: "Can I OCR a screenshot?", a: "Yes — paste from clipboard or drop the file. Screenshots of code, articles, and chat windows all work." },
        ],
      },
      {
        slug: "summarize",
        name: "Summarize",
        blurb: "PDF, article URL, or YouTube link to bullet notes.",
        status: "live",
        seoIntro:
          "Get a clean bullet-point summary of any long PDF, news article, blog post, or YouTube video. Paste a link or upload a file — Gemini reads the full content and returns the key points so you don't have to. Great for research, study notes, and catching up on long videos.",
        faq: [
          { q: "How long can the source be?", a: "Articles and PDFs up to roughly 100,000 words. YouTube videos of any length — we summarize the transcript." },
          { q: "Does it work on paywalled articles?", a: "Only if the page is publicly readable. We can't bypass paywalls or login walls." },
          { q: "Can I choose the summary length?", a: "Yes — toggle between a short TL;DR, a medium bullet summary, or a detailed outline." },
          { q: "Is the summary accurate?", a: "Gemini is excellent at faithful summarization, but always verify the key facts against the source before relying on them." },
          { q: "What languages does it support?", a: "Summarization works in 30+ languages and you can ask for the output in a different language than the source." },
        ],
      },
      {
        slug: "translate",
        name: "Translate text",
        blurb: "Paste any text; auto-detect source, translate to 25+ languages.",
        status: "live",
        seoIntro:
          "Translate paragraphs, emails, or whole documents between 25+ languages with full grammar and tone preserved. Auto-detects the source language and gives you a clean, natural-sounding translation — not the stiff, literal output of older translators.",
        faq: [
          { q: "Which languages are supported?", a: "English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Urdu, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Polish, Arabic, Turkish, Chinese, Japanese, Korean, Vietnamese, Thai, and more." },
          { q: "Is it better than Google Translate?", a: "On long-form text and idiomatic phrasing, Gemini-backed translation is noticeably more natural. For single-word lookups, Google Translate is still great." },
          { q: "How long can my input be?", a: "Up to roughly 30,000 words per request. For longer documents, paste in chunks." },
          { q: "Does it preserve formatting?", a: "Yes — line breaks, bullet lists, and code blocks are preserved in the translated output." },
          { q: "Can I choose formal or casual tone?", a: "Use the Grammar & tone rewriter after translating to adjust formality." },
        ],
      },
      {
        slug: "pdf-merge",
        name: "Merge PDF",
        blurb: "Combine multiple PDFs into one.",
        status: "live",
        seoIntro:
          "Merge two or more PDF files into a single document — for free, right in your browser. Drag PDFs in, reorder them with a click, and download the combined file. Nothing is uploaded to a server; everything happens locally on your device.",
        faq: [
          { q: "Is there a limit on the number of PDFs?", a: "Practical limit is around 20 files and ~500 MB total. Larger jobs may slow down depending on your device." },
          { q: "Are my files uploaded?", a: "No — pdf-lib runs entirely in your browser. The PDFs never leave your device." },
          { q: "Will the merged PDF keep bookmarks and links?", a: "Internal links inside each PDF are preserved. Cross-PDF bookmarks are not carried over." },
          { q: "Can I reorder the pages?", a: "You can reorder full files. To shuffle individual pages, split first then merge in the desired order." },
          { q: "Does it work on encrypted PDFs?", a: "Only if the PDF is not password-protected. Decrypt it first using a desktop tool." },
        ],
      },
      {
        slug: "pdf-split",
        name: "Split PDF",
        blurb: "Pick pages or split by range.",
        status: "live",
        seoIntro:
          "Extract specific pages or split a PDF into multiple smaller files — for free, in-browser. Choose individual pages, ranges (e.g. 1-3, 7, 12-end), or split into single-page files. Your PDF stays on your device the entire time.",
        faq: [
          { q: "How do I pick which pages to keep?", a: "Use a range expression like `1-3, 7, 12-end` or pick pages from the preview thumbnails." },
          { q: "Is my PDF uploaded?", a: "No. Splitting runs locally with pdf-lib — nothing is sent to any server." },
          { q: "Can I split a 1000-page PDF?", a: "Yes, though it may take a few seconds. Very large files can hit browser memory limits." },
          { q: "Does the original PDF stay unchanged?", a: "Yes — the tool produces new files. Your original is untouched." },
          { q: "Can I split by file size instead of pages?", a: "Not yet — splitting is page-based. We may add size-based splitting later." },
        ],
      },
      {
        slug: "pdf-compress",
        name: "Compress PDF",
        blurb: "Shrink large PDFs by re-rendering pages as JPEGs. Text becomes raster.",
        status: "live",
        seoIntro:
          "Shrink large PDFs by 50-90% so they're easy to email and upload. We re-render each page as a JPEG inside a new PDF — fantastic for scans and image-heavy documents. Note: text becomes a raster image, so it won't be searchable after compression.",
        faq: [
          { q: "Will the text still be selectable?", a: "No — after compression the text is rasterized. Use this for sharing scans, not for archival or accessibility." },
          { q: "How much smaller will it be?", a: "Typically 50-90% smaller, depending on the quality setting and original content." },
          { q: "Is my file uploaded?", a: "No, compression runs entirely in your browser." },
          { q: "Can I control the quality?", a: "Yes — pick low, medium, or high. Higher quality means larger file size." },
          { q: "Does it work on password-protected PDFs?", a: "No, you'll need to decrypt the PDF first using a desktop tool." },
        ],
      },
      {
        slug: "resume",
        name: "Resume builder",
        blurb: "Tailor a CV from your notes to a job description.",
        status: "live",
        seoIntro:
          "Turn rough career notes into a polished, ATS-friendly resume tailored to a specific job description. Paste your experience, paste the JD, and Gemini generates a focused one-page CV with the keywords recruiters are looking for. Download as PDF, edit in any text editor.",
        faq: [
          { q: "Is it ATS-compatible?", a: "Yes — the layout is plain, standards-friendly, and avoids tables, columns, and unusual fonts that trip up applicant-tracking systems." },
          { q: "Will it lie about my experience?", a: "It only rewords and emphasizes what you put in. It will not fabricate jobs, dates, or skills." },
          { q: "Can I edit the result?", a: "Yes — you get editable Markdown plus a PDF. Tweak the wording or restructure as needed." },
          { q: "How long does it take?", a: "Around 15-30 seconds from notes to first draft." },
          { q: "Does it cost anything?", a: "Free for anonymous users with a fair-use limit. Sign in for unlimited use." },
        ],
      },
      {
        slug: "rewrite",
        name: "Grammar & tone rewriter",
        blurb: "Fix grammar, switch tone formal ↔ casual.",
        status: "live",
        seoIntro:
          "Fix typos and grammar, shift tone from formal to casual or vice versa, or just make awkward sentences flow naturally. Paste your text, choose a target style, and get a clean rewrite back. Great for emails, essays, LinkedIn posts, and Slack messages.",
        faq: [
          { q: "What tones can I choose?", a: "Formal, casual, professional, friendly, concise, persuasive, and academic — plus a free-form custom prompt." },
          { q: "Will it change the meaning?", a: "No — only the wording and structure. The original intent is preserved." },
          { q: "How long can my input be?", a: "Up to roughly 20,000 words per request." },
          { q: "Does it work for non-English text?", a: "Yes — rewriting works in 30+ languages." },
          { q: "Can it match my writing style?", a: "If you paste a sample of your own writing first and ask it to match that tone, results are surprisingly good." },
        ],
      },
    ],
  },
  {
    slug: "images",
    name: "Images",
    tagline: "Edit, restore, convert, generate.",
    tools: [
      {
        slug: "bg-remove",
        name: "Remove background",
        blurb: "One-click transparent PNG — runs in your browser.",
        status: "live",
        seoIntro:
          "Cut out the background from any photo with one click and download a transparent PNG. Powered by an on-device neural network (no upload), it works on people, products, pets, and objects. Perfect for marketplace listings, profile pictures, and design mockups.",
        faq: [
          { q: "Is my photo uploaded?", a: "No — background removal runs entirely in your browser using @imgly/background-removal. Your image never leaves your device." },
          { q: "How good is the edge detection?", a: "Excellent on people and products with clean separation. Hair, fur, and translucent objects are handled well in most cases." },
          { q: "What's the maximum image size?", a: "Up to about 4K resolution. Larger images get downscaled to keep the browser responsive." },
          { q: "Can I download as JPG?", a: "JPG doesn't support transparency. Use PNG or WebP if you want a transparent background." },
          { q: "Why is the first run slow?", a: "The model downloads once (about 80 MB) and is cached. Subsequent runs are near-instant." },
        ],
      },
      {
        slug: "upscale",
        name: "Upscale & sharpen",
        blurb: "High-quality lanczos resize at 2×, 3×, 4× — not AI, but crisp.",
        status: "live",
        seoIntro:
          "Resize images up to 4× their original dimensions while keeping edges crisp. We use a Lanczos resampling algorithm — fast, predictable, and great for typical photos. It's not AI super-resolution, but the result is sharper than the default browser upscale and works on any image format.",
        faq: [
          { q: "Is this AI upscaling?", a: "No, it's classical Lanczos resampling. For AI-style detail invention on very small images, use a dedicated service like Topaz or Magnific." },
          { q: "What scales are supported?", a: "2×, 3×, and 4× the original dimensions." },
          { q: "What formats can I output?", a: "JPG, PNG, WebP, and AVIF." },
          { q: "Is my image uploaded?", a: "No — upscaling runs server-side with sharp but the file is processed and discarded in-memory." },
          { q: "Will it work on tiny 100×100 images?", a: "Yes, but you'll see softness at 4× since there's no extra detail to recover." },
        ],
      },
      {
        slug: "compress",
        name: "Compress image",
        blurb: "Smaller files, same quality.",
        status: "live",
        seoIntro:
          "Shrink JPG, PNG, and WebP images by 60-90% with almost no visible quality loss. Useful for email attachments, blog posts, marketplace listings, and shaving load time off your website. We use sharp's modern encoders for the best size-quality ratio.",
        faq: [
          { q: "How much smaller will my image be?", a: "Typically 60-90% smaller for JPGs and PNGs. WebP and AVIF outputs can be even smaller still." },
          { q: "Will quality drop?", a: "At the default quality, the difference is invisible to the eye. You can push the quality slider lower for even smaller files." },
          { q: "Does it strip EXIF data?", a: "Yes — location, camera info, and other metadata are removed for privacy." },
          { q: "Can I batch-compress?", a: "Drop multiple files at once; each one is compressed independently." },
          { q: "Is my image uploaded?", a: "It's processed on our server and the file is discarded immediately after the response." },
        ],
      },
      {
        slug: "resize",
        name: "Resize & convert",
        blurb: "JPG ↔ PNG ↔ WebP ↔ AVIF, any dimensions.",
        status: "live",
        seoIntro:
          "Resize an image to exact dimensions or convert between JPG, PNG, WebP, and AVIF. Lock the aspect ratio, set custom width and height, or pick a common preset (Instagram square, Twitter banner, A4 print). Fast and accurate.",
        faq: [
          { q: "Which formats are supported?", a: "JPG, PNG, WebP, AVIF, and HEIC input." },
          { q: "Will my image stay sharp?", a: "Downscaling is lossless visually. For upscaling, use the Upscale tool for better quality." },
          { q: "Can I keep transparency?", a: "Yes — PNG and WebP preserve transparency. JPG and AVIF (in lossy mode) flatten it." },
          { q: "What's the max dimension?", a: "Up to 10,000 × 10,000 pixels." },
          { q: "Is there a batch mode?", a: "Drop multiple files; each one is processed in parallel." },
        ],
      },
      {
        slug: "passport",
        name: "Passport / ID photo",
        blurb: "Standard sizes, clean background, head positioned right.",
        status: "live",
        seoIntro:
          "Turn any selfie or portrait into a regulation passport, visa, or ID photo. We crop to the standard size (US, UK, EU, India, China, and more), replace the background with a clean white, and check head position automatically. Print-ready or save digitally.",
        faq: [
          { q: "Which country presets are supported?", a: "US (2×2\"), UK, EU, India, China, Canada, Australia, and Schengen visa. Custom sizes too." },
          { q: "Will it pass official requirements?", a: "Most countries accept these dimensions and background. We can't guarantee any specific issuing authority will accept the photo — always check their rules." },
          { q: "Does it remove glasses or hats?", a: "No — please take the photo with the right attire to begin with." },
          { q: "Is my photo stored?", a: "Background removal runs in your browser; the photo never leaves your device." },
          { q: "Can I print four-up on a 4×6?", a: "Yes — the download includes a print sheet that fits four photos on a standard 4×6 print." },
        ],
      },
      {
        slug: "watermark",
        name: "Watermark",
        blurb: "Add a text or signature watermark — pick position, size, opacity.",
        status: "live",
        seoIntro:
          "Stamp a text watermark, signature, or logo onto any image. Pick the position (corner, center, diagonal), size, color, and opacity, and download. Useful for protecting photos before posting them online, branding marketing images, or just signing a screenshot.",
        faq: [
          { q: "Can I use my own logo?", a: "Yes — upload a PNG with transparency and place it where you want." },
          { q: "Does it batch-watermark?", a: "Drop multiple images; the same watermark is applied to all of them." },
          { q: "Can I make a diagonal repeating watermark?", a: "Yes — pick the tile pattern option for a repeating diagonal stamp across the whole image." },
          { q: "Will the watermark be removable?", a: "A determined attacker can always edit it out. For deterrence and clear ownership signaling, the watermark does its job." },
          { q: "Is my image uploaded?", a: "Yes for the rendering step, but the file is discarded immediately after the response." },
        ],
      },
    ],
  },
  {
    slug: "audio-video",
    name: "Audio & Video",
    tagline: "Transcribe, caption, convert, voice.",
    tools: [
      {
        slug: "transcribe",
        name: "Transcribe",
        blurb: "Audio or video → text, optionally with timestamps.",
        status: "live",
        seoIntro:
          "Convert any audio or video file into accurate text with optional timestamps and speaker labels. Powered by Groq's Whisper-Large-V3 — among the fastest and most accurate transcription models available. Upload an MP3, MP4, WAV, M4A, or paste a YouTube link.",
        faq: [
          { q: "Which languages does it support?", a: "100+ languages, with English, Spanish, Hindi, Chinese, French, and German being the strongest." },
          { q: "How long can my file be?", a: "Up to 2 hours per file. Longer recordings should be split first." },
          { q: "Does it identify speakers?", a: "Basic speaker turn detection, yes — full speaker diarization (Speaker 1, Speaker 2) is roadmapped." },
          { q: "How accurate is it?", a: "Whisper-Large-V3 hits 95%+ accuracy on clear English audio. Noisy or heavily accented audio degrades gracefully." },
          { q: "Can I get timestamps?", a: "Yes — toggle word-level or segment-level timestamps in the output." },
        ],
      },
      {
        slug: "subtitles",
        name: "Auto-subtitle",
        blurb: "Generate SRT or WebVTT captions from audio or video.",
        status: "live",
        seoIntro:
          "Generate ready-to-use SRT or WebVTT subtitle files from any video or audio recording. Drop in your file, get back timed captions you can attach to YouTube, Vimeo, or burn into the video with a desktop editor. Multi-language support.",
        faq: [
          { q: "What output format do I get?", a: "Both SRT (most common) and WebVTT (used by HTML5 video). Pick either at download time." },
          { q: "Will the timing be accurate?", a: "Yes — word-level alignment from Whisper means captions sync within a fraction of a second." },
          { q: "Can it translate while captioning?", a: "Yes — you can ask for English captions even from a non-English source." },
          { q: "Does it handle background music?", a: "Whisper is fairly robust to music and ambient noise, but very noisy mixes will hurt accuracy." },
          { q: "Can I burn the captions into the video?", a: "Not directly — download the SRT and use the Convert media tool or a desktop editor like Handbrake or DaVinci to burn them in." },
        ],
      },
      {
        slug: "compress-video",
        name: "Compress video",
        blurb: "Smaller files for sharing — CRF knob, in your browser.",
        status: "live",
        seoIntro:
          "Shrink large MP4 and MOV videos so they're easy to share over email or messaging. Pick a quality level (CRF), and the tool re-encodes the video in your browser using ffmpeg.wasm. Nothing is uploaded — your video stays local the whole time.",
        faq: [
          { q: "How much smaller will my video be?", a: "Typically 50-80% smaller, depending on the quality setting." },
          { q: "Does it run in my browser?", a: "Yes — ffmpeg.wasm runs locally. The file never leaves your device." },
          { q: "What formats are supported?", a: "MP4, MOV, WebM, and MKV input. Output is MP4 (H.264)." },
          { q: "Why is it slower than a desktop app?", a: "Browser-based ffmpeg is roughly 3-5× slower than native ffmpeg. For very long videos, a desktop tool is faster." },
          { q: "What's the CRF value?", a: "Constant Rate Factor — lower number means higher quality and larger file. The default of 23 is a good balance." },
        ],
      },
      {
        slug: "convert-media",
        name: "Convert media",
        blurb: "MP4, MP3, WAV, MOV, WebM, M4A, FLAC, OGG — in your browser.",
        status: "live",
        seoIntro:
          "Convert between MP4, MP3, WAV, MOV, WebM, M4A, FLAC, and OGG — all running locally in your browser. Useful for extracting audio from a video, sending a WAV that someone needs in MP3, or moving between formats your phone or DAW expects.",
        faq: [
          { q: "Is my file uploaded?", a: "No — ffmpeg.wasm runs in your browser. Everything stays on your device." },
          { q: "Which formats are supported?", a: "Video: MP4, MOV, WebM, MKV. Audio: MP3, WAV, M4A, FLAC, OGG, AAC." },
          { q: "Can I extract just the audio?", a: "Yes — drop a video, pick MP3 or WAV as output, and the audio track is extracted." },
          { q: "How long can my file be?", a: "Practical limit is around 30-60 minutes due to browser memory. Longer files should be processed with a desktop tool." },
          { q: "Will quality drop?", a: "Lossless formats (FLAC, WAV) stay lossless. Lossy-to-lossy conversion introduces minor quality loss." },
        ],
      },
      {
        slug: "trim",
        name: "Trim & cut",
        blurb: "Snip a clip from a longer file — no re-encoding.",
        status: "live",
        seoIntro:
          "Snip a specific clip out of a longer audio or video file without re-encoding — so the cut is fast and lossless. Drag the start and end markers, preview the clip, and download. Runs entirely in your browser.",
        faq: [
          { q: "Why is it so fast?", a: "Stream-copying skips re-encoding — we just rewrite the container with new in/out points. Quality is identical to the source." },
          { q: "Can I cut frame-accurately?", a: "Stream-copy snaps to the nearest keyframe. For frame-accurate cuts, enable re-encode mode (slower)." },
          { q: "Which formats are supported?", a: "MP4, MOV, WebM, MP3, WAV, M4A, FLAC, OGG." },
          { q: "Is my file uploaded?", a: "No — the cut happens locally with ffmpeg.wasm." },
          { q: "Can I cut out a middle section instead?", a: "Cut twice (before and after the section you want to remove), then use Merge media — that workflow is coming." },
        ],
      },
      {
        slug: "tts",
        name: "Text-to-speech",
        blurb: "Natural Indic + English voices. Powered by Sarvam.",
        status: "live",
        seoIntro:
          "Convert any text into natural-sounding speech in Hindi, Bengali, Tamil, Telugu, Malayalam, Kannada, Gujarati, Marathi, Punjabi, Odia, and English. Powered by Sarvam — among the strongest TTS providers for Indic languages. Download as MP3 or WAV.",
        faq: [
          { q: "Which languages are supported?", a: "11 Indian languages plus English, with multiple male and female voices per language." },
          { q: "How natural does it sound?", a: "Comparable to ElevenLabs for English, and noticeably better than Google TTS for Indic languages." },
          { q: "How long can the text be?", a: "Up to 5,000 characters per request. For longer text, split into chunks." },
          { q: "Can I clone my own voice?", a: "Not currently — voices are limited to the Sarvam preset set." },
          { q: "What format is the output?", a: "MP3 by default, with WAV available for higher fidelity." },
        ],
      },
      {
        slug: "denoise",
        name: "Remove background noise",
        blurb: "Cut hiss and room tone from any recording.",
        status: "live",
        seoIntro:
          "Clean up noisy recordings by removing hiss, hum, fan noise, and room tone. Drop in an MP3, WAV, or video file and get back a cleaner version that sounds more professional. Great for podcast guests, voice memos, and meeting recordings.",
        faq: [
          { q: "Does it remove all background noise?", a: "Steady noise (hum, fan, AC, hiss) is removed well. Sudden noises like door slams need separate editing." },
          { q: "Will it affect the voice?", a: "Modern denoisers preserve voice quality. Aggressive denoising can introduce a slight artificial 'underwater' tone — use a lower strength if you hear it." },
          { q: "Which formats are supported?", a: "MP3, WAV, M4A, OGG audio and MP4, MOV, WebM video (we extract the audio, clean it, and remux)." },
          { q: "How long can my file be?", a: "Up to 30 minutes per file." },
          { q: "Is my file uploaded?", a: "Yes — denoising runs on our servers and the file is deleted immediately after processing." },
        ],
      },
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
