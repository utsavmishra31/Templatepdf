import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Template Filler",
    short_name: "Template",
    description: "PDF and document tools for conversion, editing, and scanning.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7f2",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
