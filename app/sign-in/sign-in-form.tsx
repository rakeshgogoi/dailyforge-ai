"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignInForm() {
  const [loading, setLoading] = React.useState(false);
  const params = useSearchParams();
  const callbackURL = params.get("next") || "/dashboard";

  async function signInWithGoogle() {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        size="lg"
        onClick={signInWithGoogle}
        disabled={loading}
        className="w-full"
        variant="outline"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleIcon className="size-4" />
        )}
        Continue with Google
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        We never post or read anything from your Google account beyond your
        email and name.
      </p>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.83C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
