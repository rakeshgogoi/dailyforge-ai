import { ImageResponse } from "next/og";
import { getTool } from "@/lib/tools";

export const runtime = "edge";
export const alt = "Dailyforge AI tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ToolOgImage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const match = getTool(category, slug);
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
            fontSize: 28,
            fontWeight: 600,
            color: "#a3a3a3",
            display: "flex",
            alignItems: "center",
          }}
        >
          dailyforge
          <span style={{ color: "#f97316", margin: "0 4px" }}>·</span>
          ai
          <span style={{ color: "#525252", margin: "0 16px" }}>/</span>
          <span style={{ color: "#a3a3a3" }}>{categoryName}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
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
    { ...size },
  );
}
