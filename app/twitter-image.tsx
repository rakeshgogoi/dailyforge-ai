import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Dailyforge AI — everyday tools, powered by AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 60%, #2a1a0a 100%)",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#a3a3a3",
            alignItems: "center",
          }}
        >
          <span>dailyforge</span>
          <span style={{ color: "#f97316", margin: "0 4px" }}>·</span>
          <span>ai</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 86,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            marginTop: 32,
            maxWidth: 980,
          }}
        >
          <span>Everyday tools,</span>
          <span style={{ color: "#f97316" }}>forged with AI.</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#d4d4d4",
            marginTop: 28,
            maxWidth: 920,
            lineHeight: 1.35,
          }}
        >
          22+ free tools — convert documents, edit images, transcribe audio and
          video. All in one place.
        </div>
      </div>
    ),
    { ...size },
  );
}
