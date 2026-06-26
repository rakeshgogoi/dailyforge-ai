import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { rateLimits } from "@/db/schema";

const LIMIT = 10;
const WINDOW_MS = 3 * 60 * 60 * 1000;

export type RateLimitResult =
  | { allowed: true; remaining: number; resetAt: Date }
  | { allowed: false; resetAt: Date };

function getIdentity(req: Request): string {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const m = cookieHeader.match(/(?:^|;\s*)df_anon=([^;]+)/);
  if (m) return `anon-${m[1]}`;
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0].trim() || "unknown";
  return `ip-${ip}`;
}

export async function checkRateLimit(
  tool: string,
  req: Request,
): Promise<RateLimitResult> {
  const identity = getIdentity(req);
  const now = new Date();

  const existing = await db
    .select()
    .from(rateLimits)
    .where(and(eq(rateLimits.identity, identity), eq(rateLimits.tool, tool)))
    .limit(1);

  const row = existing[0];

  if (!row) {
    await db
      .insert(rateLimits)
      .values({ identity, tool, count: 1, windowStart: now })
      .onConflictDoNothing();
    return {
      allowed: true,
      remaining: LIMIT - 1,
      resetAt: new Date(now.getTime() + WINDOW_MS),
    };
  }

  const windowAlive = now.getTime() - row.windowStart.getTime() < WINDOW_MS;

  if (!windowAlive) {
    await db
      .update(rateLimits)
      .set({ count: 1, windowStart: now })
      .where(and(eq(rateLimits.identity, identity), eq(rateLimits.tool, tool)));
    return {
      allowed: true,
      remaining: LIMIT - 1,
      resetAt: new Date(now.getTime() + WINDOW_MS),
    };
  }

  const resetAt = new Date(row.windowStart.getTime() + WINDOW_MS);

  if (row.count >= LIMIT) {
    return { allowed: false, resetAt };
  }

  await db
    .update(rateLimits)
    .set({ count: row.count + 1 })
    .where(and(eq(rateLimits.identity, identity), eq(rateLimits.tool, tool)));

  return { allowed: true, remaining: LIMIT - row.count - 1, resetAt };
}

function formatTimeUntil(date: Date): string {
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return "now";
  const minutes = Math.ceil(ms / (60 * 1000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  if (remMin === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours}h ${remMin}m`;
}

export async function enforceLimit(
  tool: string,
  req: Request,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(tool, req);
  if (result.allowed) return null;
  const retryAfter = Math.max(
    1,
    Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
  );
  return NextResponse.json(
    {
      error: `Limit reached for this tool (10 uses per 3 hours). Resets in ${formatTimeUntil(result.resetAt)}.`,
      resetAt: result.resetAt.toISOString(),
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    },
  );
}
