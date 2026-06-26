"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";

import { authClient, useSession } from "@/lib/auth-client";

export function UserMenu() {
  const session = useSession();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (session.isPending) {
    return <div className="size-7 rounded-full bg-muted animate-pulse" aria-hidden />;
  }

  const user = session.data?.user;

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Sign in
      </Link>
    );
  }

  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();

  async function handleSignOut() {
    setOpen(false);
    await authClient.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="size-7 rounded-full bg-orange-500 text-white text-xs font-semibold flex items-center justify-center hover:ring-2 hover:ring-orange-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Account"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg py-1 z-50"
        >
          <div className="px-3 py-2 border-b border-border">
            <div className="text-sm font-medium truncate flex items-center gap-2">
              <UserIcon className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{user.name || "Account"}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {user.email}
            </div>
          </div>
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60"
          >
            <LayoutDashboard className="size-4 text-muted-foreground" />
            Dashboard
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 text-left"
          >
            <LogOut className="size-4 text-muted-foreground" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
