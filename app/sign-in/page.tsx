import { Suspense } from "react";
import Link from "next/link";

import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign in — dailyforge·ai",
  description: "Sign in to dailyforge·ai.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground">
          Optional for the basic tools. Required for unlimited use and the
          dashboard.
        </p>
      </div>

      <div className="mt-10">
        <Suspense fallback={<div className="h-10 rounded-md bg-muted animate-pulse" />}>
          <SignInForm />
        </Suspense>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        By continuing you agree to use this site sensibly.{" "}
        <Link href="/" className="underline">
          Back to home
        </Link>
        .
      </p>
    </div>
  );
}
