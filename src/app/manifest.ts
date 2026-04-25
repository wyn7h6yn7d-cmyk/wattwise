import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Energiakalkulaator",
    short_name: "Energiakalkulaator",
    description: "Energiaotsuste tasuvuse platvorm.",
    start_url: "/",
    display: "standalone",
    background_color: "#050807",
    theme_color: "#050807",
    icons: [
      {
        src: "/icon-ek-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-ek-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
