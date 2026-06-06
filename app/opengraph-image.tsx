import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Bacumen.ai — The agentic AI platform for enterprise";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#0A1F44",
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 85% 10%, rgba(37, 99, 235,0.35), transparent 60%), radial-gradient(ellipse 60% 80% at 5% 90%, rgba(29, 78, 216,0.25), transparent 70%)",
          color: "#F8FAFB",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ display: "flex" }}>Bacumen.ai</span>
          <span
            style={{
              display: "flex",
              width: 10,
              height: 10,
              backgroundColor: "#2563eb",
              borderRadius: 5,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 18,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#2563eb",
              fontWeight: 500,
            }}
          >
            The agentic AI platform
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
              maxWidth: 1000,
            }}
          >
            Activate AI across your enterprise, one skill at a time.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: "rgba(248,250,251,0.7)",
          }}
        >
          <span style={{ display: "flex" }}>KYC · Finance · HR · ERP</span>
          <span style={{ display: "flex" }}>bacumen.ai</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
