import { ImageResponse } from "next/og";

export async function GET() {
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
        <span style={{ color: "#e50914", fontSize: 320, fontWeight: 800, fontFamily: "sans-serif" }}>M</span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
