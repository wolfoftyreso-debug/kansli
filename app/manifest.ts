import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Landvex",
    short_name: "Landvex",
    description:
      "Founder-led automation engineering on AWS. Offices in Stockholm and Houston.",
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#000028",
  };
}
