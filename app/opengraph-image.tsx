import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";
import { hero } from "@/lib/home";
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
          background: brand.navy,
          color: brand.white,
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
            color: brand.accent,
          }}
        >
          Landvex · Stockholm · Houston
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 600,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              maxWidth: 920,
            }}
          >
            {hero.title}
          </div>
          <div style={{ fontSize: 26, color: brand.mist, maxWidth: 720 }}>
            {site.tagline}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
