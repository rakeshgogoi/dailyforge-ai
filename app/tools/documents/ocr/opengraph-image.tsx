import { makeToolOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "edge";
export const alt = "Dailyforge AI tool";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default makeToolOgImage("documents", "ocr");
