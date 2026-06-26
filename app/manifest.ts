import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dailyforge AI",
    short_name: "dailyforge·ai",
    description:
      "Everyday tools, powered by AI. Convert documents, edit images, transcribe audio and video.",
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#f97316",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
