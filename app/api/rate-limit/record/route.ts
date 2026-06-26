import { NextResponse } from "next/server";
import { z } from "zod";

import { enforceLimit } from "@/lib/rate-limit";

const Body = z.object({ tool: z.string().min(1).max(64) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tool slug." }, { status: 400 });
  }
  const blocked = await enforceLimit(parsed.data.tool, req);
  if (blocked) return blocked;
  return NextResponse.json({ ok: true });
}
