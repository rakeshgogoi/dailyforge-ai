import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ANON_COOKIE = "df_anon";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function middleware(req: NextRequest) {
  if (req.cookies.get(ANON_COOKIE)) return NextResponse.next();
  const res = NextResponse.next();
  res.cookies.set(ANON_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return res;
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
