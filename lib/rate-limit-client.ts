export type GateResult = { ok: true } | { ok: false; error: string };

export async function gateRateLimit(tool: string): Promise<GateResult> {
  try {
    const res = await fetch("/api/rate-limit/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool }),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    return {
      ok: false,
      error: data?.error ?? "Limit reached. Try again later.",
    };
  } catch {
    // Network error — don't block the user on a transient hiccup.
    return { ok: true };
  }
}
