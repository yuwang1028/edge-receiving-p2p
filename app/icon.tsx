import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A1F44",
          color: "#F8FAFB",
          fontSize: 22,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          letterSpacing: "-0.04em",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          position: "relative",
        }}
      >
        <span style={{ display: "flex" }}>B</span>
        <span
          style={{
            display: "flex",
            position: "absolute",
            right: 3,
            bottom: 3,
            width: 5,
            height: 5,
            borderRadius: 5,
            background: "#2563eb",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
