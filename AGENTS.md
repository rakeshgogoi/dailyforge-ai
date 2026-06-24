# Dailyforge AI — agent guide

A multi-tool AI utility platform: convert documents, edit images, transcribe/edit audio & video. SEO-driven, file-heavy, eventually credit-based.

## Chosen stack (locked-in)

**Framework & UI**
- Next.js **15** App Router (the current scaffold ships with Next 16 — DOWNGRADE as the first task; Next 16 has unresolved Turbopack bugs around dynamic routes + `generateStaticParams`)
- TypeScript, Tailwind CSS v4
- shadcn/ui for components

**AI (router pattern via Vercel AI SDK)**
- Claude (Anthropic) — OCR via vision, summarization, translation, rewriting, resume tasks
- Groq Whisper — transcription (fast + cheap)
- Replicate / fal.ai — image AI (bg-remove, upscale, restore)
- CloudConvert — document & media format conversion (do NOT roll our own)
- ElevenLabs — TTS

**Data & infra**
- Postgres on **Neon** (MCP available — provision via `mcp__Neon__*`)
- Drizzle ORM
- Better Auth (email magic links + Google)
- Cloudflare R2 for file storage (S3-compatible, zero egress)
- Inngest for background jobs (transcription, conversion)
- Polar.sh for credits/subscriptions

**Client-side processing (no server cost)**
- pdf-lib + pdfjs-dist — PDF merge/split/sign in browser
- ffmpeg.wasm — basic audio/video trim in browser
- sharp (server) — image compress/resize via route handlers

**Hosting**
- Vercel (Next.js), everything else is independent SaaS.

## Repo state

The scaffold is already up:
- `lib/tools.ts` — single source of truth for the tool catalog (3 categories, 23 stubs)
- `app/page.tsx` — landing with tool grid
- `app/layout.tsx` — header + footer shell
- `app/tools/[category]/[slug]/page.tsx` — dynamic tool page (currently a "coming soon" placeholder; no `generateStaticParams` — it triggers a Next 16 Turbopack bug, revisit after downgrade)

## First-session tasks (in order)

1. **Downgrade to Next 15.** Re-pin `next` and `eslint-config-next` to `^15`, run install, verify `npm run dev` and tool stub pages render without 500s.
2. **Add shadcn/ui.** `npx shadcn@latest init`, install: `button`, `card`, `input`, `dropzone` (or `react-dropzone`), `toast`, `progress`. Rebuild the landing using shadcn `Card`.
3. **Provision Neon Postgres.** Use the Neon MCP. Create one project, get the connection string into `.env.local`.
4. **Wire Drizzle ORM.** Schemas for `users`, `credits_ledger`, `jobs` (at minimum).
5. **Better Auth setup.** Email magic links + Google. Keep auth optional for v1 tools (no signup wall).
6. **AI SDK + first tool end-to-end.** Pick ONE tool to ship as the template — recommend **Summarize URL** (cheapest, no file handling): paste URL → fetch → Claude → bullets.

Do not build all 23 tools in one go. Ship one, learn, iterate.

## Do not

- Mirror gurujal's structure or copy from it. This is an independent product and repo.
- Add backwards-compat shims, future-proofing, or premature abstractions. One concrete tool at a time.
- Build OCR/transcription/conversion engines ourselves at MVP. Use the APIs listed above.
- Add `generateStaticParams` to dynamic tool routes until verified working post-downgrade.
