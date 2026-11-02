import { ImageResponse } from "next/og";

export const alt = "DSA Daily: know what to solve today, and see exactly why it works";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 96, background: "#000000", color: "#FAFAFA" }}>
      <div style={{ fontSize: 32, fontWeight: 600, color: "#C6F135" }}>DSA Daily</div>
      <div style={{ marginTop: 24, fontSize: 72, fontWeight: 600, lineHeight: 1.1, letterSpacing: -2 }}>Know what to solve today, and see exactly why it works</div>
    </div>,
    size,
  );
}
