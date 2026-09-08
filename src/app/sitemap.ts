import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const routes = [
  "/",
  "/borsihind",
  "/kalkulaatorid",
  "/kalkulaatorid/paikesejaam",
  "/kalkulaatorid/peak-shaving",
  "/kalkulaatorid/toostus",
  "/projekt",
  "/kontakt",
  "/kkk",
  "/hinnad",
  "/blogi",
  "/energiaprognoos",
  "/kasutustingimused",
  "/privaatsuspoliitika",
  "/kupsised",
  "/vastutusest-loobumine",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((path) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "/" || path === "/borsihind" ? "hourly" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/kalkulaatorid") || path === "/borsihind" ? 0.9 : 0.5,
  }));
}
