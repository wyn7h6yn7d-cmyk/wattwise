import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** WattWise favicon: roheline taust + valge W (clean-tech). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #16a34a 0%, #15803d 100%)",
          borderRadius: 8,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 20,
            fontWeight: 800,
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
            lineHeight: 1,
            marginTop: -1,
          }}
        >
          W
        </span>
      </div>
    ),
    { ...size },
  );
}
