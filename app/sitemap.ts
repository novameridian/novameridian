import { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const entries: Array<[string, number]> = [
    ["", 1],
    ["/about", 0.8],
    ["/security", 0.8],
    ["/faq", 0.8],
    ["/contact", 0.8],
    ["/terms", 0.4],
    ["/privacy", 0.4],
  ]
  return entries.map(([path, priority]) => ({
    url: `${SITE_URL}${path}`,
    priority,
    lastModified: now,
  }))
}
