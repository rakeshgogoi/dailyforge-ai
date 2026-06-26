import { ImageResponse } from "next/og";
import { getTool } from "./tools";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

export function makeToolOgImage(categorySlug: string, toolSlug: string) {
  return async function ToolOgImage() {
    const match = getTool(categorySlug, toolSlug);
    const toolName = match?.tool.name ?? "Tool";
    const blurb = match?.tool.blurb ?? "";
    const categoryName = match?.category.name ?? "";

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px",
            background:
              "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 60%, #2a1a0a 100%)",
            color: "#fafafa",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 28,
              fontWeight: 600,
              color: "#a3a3a3",
            }}
          >
            <span>dailyforge</span>
            <span style={{ color: "#f97316", margin: "0 4px" }}>·</span>
            <span>ai</span>
            <span style={{ color: "#525252", margin: "0 16px" }}>/</span>
            <span style={{ color: "#a3a3a3" }}>{categoryName}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 96,
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: "-0.04em",
                maxWidth: 980,
              }}
            >
              {toolName}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 32,
                color: "#d4d4d4",
                marginTop: 28,
                maxWidth: 980,
                lineHeight: 1.35,
              }}
            >
              {blurb}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#f97316",
              fontWeight: 600,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            Free · No signup
          </div>
        </div>
      ),
      { ...OG_SIZE },
    );
  };
}
