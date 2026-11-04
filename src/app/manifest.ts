import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hot Water Experts",
    short_name: "HWE",
    description: "Estimates, installs, and the tech view for Hot Water Experts.",
    start_url: "/tech",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#0a0c10",
    icons: [
      { src: "/brand/logo-icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/logo-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
