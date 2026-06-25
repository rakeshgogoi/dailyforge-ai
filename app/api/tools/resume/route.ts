import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const MAX_NOTES_CHARS = 12000;
const MAX_JD_CHARS = 8000;

const RequestSchema = z.object({
  notes: z.string().min(20).max(MAX_NOTES_CHARS),
  jobDescription: z.string().min(20).max(MAX_JD_CHARS),
  name: z.string().min(1).max(120).optional(),
});

const ResultSchema = z.object({
  summary: z
    .string()
    .describe(
      "A 2–3 sentence professional summary tailored to the job description. First person, no fluff, no 'I am a passionate…'",
    ),
  skills: z
    .array(z.string())
    .min(4)
    .max(20)
    .describe("Concrete skills from the user's notes that match the JD. Prefer specific tools/technologies/domains over generic phrases."),
  experience: z
    .array(
      z.object({
        title: z.string().describe("Role title, e.g. 'Senior Backend Engineer'."),
        company: z.string().describe("Company name. Use 'Self' or 'Freelance' if no company."),
        period: z
          .string()
          .describe("Date range as 'YYYY – YYYY' or 'YYYY – Present'. Leave the year blank if unknown."),
        bullets: z
          .array(z.string())
          .min(1)
          .max(6)
          .describe("Achievement bullets — action verb + quantified outcome where possible. Tailored to the JD. Use 1 bullet only for very short stints or single-project entries."),
      }),
    )
    .min(1)
    .max(8),
  warnings: z
    .array(z.string())
    .describe(
      "Flag anything you had to invent or could not verify from the notes (e.g. 'Quantified user count was not in your notes — confirm before submitting'). Empty array if everything is grounded.",
    ),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue?.path[0] ?? "input");
    return NextResponse.json(
      { error: `Check the ${field} field — it's empty, too short, or too long.` },
      { status: 400 },
    );
  }

  const { notes, jobDescription, name } = parsed.data;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: ResultSchema,
      system:
        "You write tailored, honest resumes. Use only what's in the user's notes — don't invent metrics, employers, or dates. If something would strengthen the resume but isn't supported by the notes, flag it in `warnings` rather than fabricating it. Match the job description's language (e.g. if it says 'TypeScript', use TypeScript, not 'JavaScript'). No exclamation marks. No 'I am passionate about…' or 'results-driven' clichés.",
      prompt: `${name ? `Candidate: ${name}\n\n` : ""}Notes / current CV:\n${notes}\n\n---\n\nTarget job description:\n${jobDescription}`,
    });
    return NextResponse.json(object);
  } catch (err) {
    console.error("[resume] generation error", err);
    return NextResponse.json(
      { error: "The resume model failed. Try again in a moment." },
      { status: 502 },
    );
  }
}
