import { brand } from "./brand.ts";

export function BrandMark({ fontSize }: { fontSize: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: brand.navy,
        color: brand.accent,
        fontSize,
        fontWeight: 700,
        letterSpacing: "-0.04em",
      }}
    >
      L
    </div>
  );
}
