import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#000028",
          color: "#ffffff",
          padding: "72px",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 22,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#00b3b3",
          }}
        >
          Landvex · Stockholm · Houston
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: "14ch",
            }}
          >
            We automate the work that used to need people.
          </div>
          <div style={{ fontSize: 28, color: "#c3ccd3", maxWidth: "36ch" }}>
            Founder-led automation engineering on AWS.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
