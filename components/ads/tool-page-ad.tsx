"use client";

import * as React from "react";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const TOOL_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function ToolPageAd() {
  React.useEffect(() => {
    if (!ADSENSE_CLIENT || !TOOL_SLOT) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle script hasn't loaded yet, or blocked by adblocker
    }
  }, []);

  if (!ADSENSE_CLIENT || !TOOL_SLOT) return null;

  return (
    <div className="mt-10 -mb-2" aria-label="Sponsored">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        Sponsored
      </div>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={TOOL_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
