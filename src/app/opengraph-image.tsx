import { ImageResponse } from "next/og";

export const alt =
  "Calgary commute — approximate CO₂e for driving vs C-Train, NW Calgary to downtown";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, #18181b 0%, #064e3b 42%, #022c22 100%)",
          padding: 72,
        }}
      >
        <div
          style={{
            fontSize: 26,
            color: "#6ee7b7",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Calgary commute
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 58,
            fontWeight: 700,
            color: "#fafafa",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
          }}
        >
          Driving vs C-Train
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: "#a1a1aa",
            lineHeight: 1.45,
            maxWidth: 820,
          }}
        >
          Approximate CO₂e — Northwest Calgary to downtown
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
