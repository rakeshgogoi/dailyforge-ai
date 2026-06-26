import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "./auth";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
  const allowed = adminEmails();
  if (allowed.length === 0) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email?.toLowerCase();
  if (!session || !email || !allowed.includes(email)) notFound();
  return session.user;
}
