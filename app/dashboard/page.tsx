import Link from "next/link";
import { sql, gte } from "drizzle-orm";

import { db } from "@/db";
import { jobs } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Dashboard — dailyforge·ai",
  robots: { index: false, follow: false },
};

const DAY_MS = 24 * 60 * 60 * 1000;

type ByToolRow = {
  tool: string;
  total: number;
  succeeded: number;
  failed: number;
  last: string | null;
};

type DailyRow = { day: string; count: number };

type VisitorsRow = { today: number; last30: number };

function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function buildLast14Days(rows: DailyRow[]): DailyRow[] {
  const map = new Map(rows.map((r) => [r.day, r.count]));
  const out: DailyRow[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, count: map.get(key) ?? 0 });
  }
  return out;
}

export default async function DashboardPage() {
  await requireAdmin();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY_MS);
  const startOfToday = new Date(now.toISOString().slice(0, 10));

  const [byToolRaw, dailyRaw, visitorsRaw, todayCountRaw] = await Promise.all([
    db
      .select({
        tool: jobs.tool,
        total: sql<number>`count(*)::int`.as("total"),
        succeeded: sql<number>`count(*) filter (where ${jobs.status} = 'succeeded')::int`.as("succeeded"),
        failed: sql<number>`count(*) filter (where ${jobs.status} = 'failed')::int`.as("failed"),
        last: sql<string | null>`max(${jobs.startedAt})::text`.as("last"),
      })
      .from(jobs)
      .where(gte(jobs.startedAt, thirtyDaysAgo))
      .groupBy(jobs.tool)
      .orderBy(sql`count(*) desc`),
    db
      .select({
        day: sql<string>`to_char(${jobs.startedAt}, 'YYYY-MM-DD')`.as("day"),
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(jobs)
      .where(gte(jobs.startedAt, fourteenDaysAgo))
      .groupBy(sql`to_char(${jobs.startedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${jobs.startedAt}, 'YYYY-MM-DD')`),
    db
      .select({
        today: sql<number>`count(distinct coalesce(${jobs.userId}, ${jobs.anonymousId})) filter (where ${jobs.startedAt} >= ${startOfToday.toISOString()})::int`.as("today"),
        last30: sql<number>`count(distinct coalesce(${jobs.userId}, ${jobs.anonymousId}))::int`.as("last30"),
      })
      .from(jobs)
      .where(gte(jobs.startedAt, thirtyDaysAgo)),
    db
      .select({ count: sql<number>`count(*)::int`.as("count") })
      .from(jobs)
      .where(gte(jobs.startedAt, startOfToday)),
  ]);

  const byTool: ByToolRow[] = byToolRaw as ByToolRow[];
  const daily = buildLast14Days(dailyRaw as DailyRow[]);
  const visitors: VisitorsRow = (visitorsRaw[0] as VisitorsRow) ?? { today: 0, last30: 0 };
  const runsToday = todayCountRaw[0]?.count ?? 0;
  const runs30 = byTool.reduce((sum, r) => sum + r.total, 0);
  const topTool = byTool[0]?.tool ?? "—";
  const maxDaily = Math.max(...daily.map((d) => d.count), 1);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Real tool runs from the database. Server-side AI tools record per-completion; in-browser tools (PDF, ffmpeg, bg-remove) record per-start via the rate-limit gate.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Runs today" value={runsToday.toLocaleString()} />
        <Kpi label="Runs · 30d" value={runs30.toLocaleString()} />
        <Kpi label="Visitors · today" value={visitors.today.toLocaleString()} />
        <Kpi label="Visitors · 30d" value={visitors.last30.toLocaleString()} />
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Daily runs · last 14 days</h2>
          <span className="text-xs text-muted-foreground">Top: {topTool}</span>
        </div>
        <div className="flex items-end gap-1 sm:gap-1.5 h-40">
          {daily.map((d) => {
            const heightPct = (d.count / maxDaily) * 100;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full bg-orange-500/80 group-hover:bg-orange-500 rounded-t-sm transition-colors"
                    style={{ height: `${Math.max(heightPct, d.count > 0 ? 2 : 0)}%` }}
                    title={`${d.day}: ${d.count} runs`}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  {d.day.slice(5)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="px-4 sm:px-5 py-3 border-b border-border">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">By tool · last 30 days</h2>
        </div>
        {byTool.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted-foreground text-center">
            No tool runs yet. Try a tool to see it appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 sm:px-5 py-3 font-medium">Tool</th>
                  <th className="px-4 py-3 font-medium text-right">Runs</th>
                  <th className="px-4 py-3 font-medium text-right">Success</th>
                  <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Failed</th>
                  <th className="px-4 sm:px-5 py-3 font-medium text-right">Last run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {byTool.map((row) => {
                  const successRate =
                    row.succeeded + row.failed === 0
                      ? 100
                      : Math.round((row.succeeded / (row.succeeded + row.failed)) * 100);
                  return (
                    <tr key={row.tool} className="hover:bg-muted/30">
                      <td className="px-4 sm:px-5 py-3 font-medium">{row.tool}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {successRate}%
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                        {row.failed.toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-right text-muted-foreground">
                        {fmtRelative(row.last)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="text-xs text-muted-foreground">
        Page is no-index. <Link href="/" className="underline">Back to site</Link>.
      </footer>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl sm:text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
