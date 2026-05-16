import type { MetadataRoute } from "next"

function getBaseUrl() {
  const fallback = "https://veryfrut.com"
  const raw = process.env.NEXT_PUBLIC_SITE_URL || fallback
  return raw.endsWith("/") ? raw.slice(0, -1) : raw
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/users", "/login"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
