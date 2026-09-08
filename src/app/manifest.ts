import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Energiakalkulaator",
    short_name: "Energiakalkulaator",
    description: "Börsihind, PV, peak shaving ja tööstusettevõtte energiaanalüüs.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    lang: "et",
    icons: [
      {
        src: "/favicon-ek-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/icon-ek-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-ek-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
