import { db } from "@/db";
import { jobs } from "@/db/schema";
import { auth } from "./auth";

function readAnonymousId(req: Request): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)df_anon=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function readIdentity(req: Request): Promise<{ userId: string | null; anonymousId: string | null }> {
  let userId: string | null = null;
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    userId = session?.user?.id ?? null;
  } catch {
    // ignore — fall through to anonymous
  }
  if (userId) return { userId, anonymousId: null };
  return { userId: null, anonymousId: readAnonymousId(req) };
}

async function recordRun(
  tool: string,
  req: Request,
  status: "succeeded" | "failed",
  startedAt: Date,
  errorMessage?: string,
) {
  const { userId, anonymousId } = await readIdentity(req);
  await db.insert(jobs).values({
    tool,
    status,
    userId,
    anonymousId,
    startedAt,
    completedAt: new Date(),
    error: errorMessage ? errorMessage.slice(0, 500) : null,
  });
}

// For browser-side tools that ping /api/rate-limit/record before starting.
// We don't have a server-side completion signal for them, so record-on-start.
export async function recordClientToolRun(tool: string, req: Request) {
  const now = new Date();
  await recordRun(tool, req, "succeeded", now);
}

type Handler = (req: Request) => Promise<Response>;

export function withTracking(tool: string, handler: Handler): Handler {
  return async (req: Request) => {
    const startedAt = new Date();
    try {
      const response = await handler(req);
      if (response.status < 400) {
        recordRun(tool, req, "succeeded", startedAt).catch(() => {});
      } else if (response.status >= 500) {
        recordRun(tool, req, "failed", startedAt, `HTTP ${response.status}`).catch(() => {});
      }
      // 4xx (rate limit, validation, auth) intentionally not recorded
      return response;
    } catch (err) {
      recordRun(
        tool,
        req,
        "failed",
        startedAt,
        err instanceof Error ? err.message : String(err),
      ).catch(() => {});
      throw err;
    }
  };
}
