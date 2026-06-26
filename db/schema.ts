import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  uuid,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// ── Better Auth core tables ────────────────────────────────────────────
// Match Better Auth's expected shape exactly so its drizzle adapter
// can read/write without surprises.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Dailyforge tables ──────────────────────────────────────────────────

export const creditEventKind = pgEnum("credit_event_kind", [
  "grant",
  "spend",
  "refund",
  "purchase",
  "expire",
]);

export const creditsLedger = pgTable("credits_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(),
  kind: creditEventKind("kind").notNull(),
  reason: text("reason"),
  jobId: uuid("job_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobStatus = pgEnum("job_status", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);

// Anonymous rate limit per (identity, tool). Identity is a long-lived
// df_anon cookie (UUID) — or the request IP if cookies are blocked.
export const rateLimits = pgTable(
  "rate_limits",
  {
    identity: text("identity").notNull(),
    tool: text("tool").notNull(),
    count: integer("count").notNull().default(0),
    windowStart: timestamp("window_start", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identity, t.tool] }),
  }),
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    anonymousId: text("anonymous_id"),
    tool: text("tool").notNull(),
    status: jobStatus("status").notNull().default("queued"),
    input: jsonb("input"),
    output: jsonb("output"),
    error: text("error"),
    creditsCost: integer("credits_cost").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    toolStartedIdx: index("jobs_tool_started_idx").on(t.tool, t.startedAt),
    startedIdx: index("jobs_started_idx").on(t.startedAt),
  }),
);
