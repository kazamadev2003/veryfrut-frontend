import type { MetadataRoute } from "next"
import { getPublicNavRoutes } from "@/components/home/nav-items"

function getBaseUrl() {
  const fallback = "https://veryfrut.com"
  const raw = process.env.NEXT_PUBLIC_SITE_URL || fallback
  return raw.endsWith("/") ? raw.slice(0, -1) : raw
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl()
  const now = new Date()

  const routes = ["/", ...getPublicNavRoutes()]
  const uniqueRoutes = Array.from(new Set(routes))

  return uniqueRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }))
}
