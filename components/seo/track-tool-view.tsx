"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function TrackToolView({ category, slug }: { category: string; slug: string }) {
  useEffect(() => {
    track("tool_view", { category, tool: slug });
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "tool_view", {
        category,
        tool: slug,
      });
    }
  }, [category, slug]);
  return null;
}
