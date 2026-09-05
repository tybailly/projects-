import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#141414"
        }}
      >
        <span style={{ color: "#e50914", fontSize: 110, fontWeight: 800, fontFamily: "sans-serif" }}>N</span>
      </div>
    ),
    { ...size }
  );
}
