import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/features",
          "/how-it-works",
          "/demo",
          "/pricing",
          "/privacy",
          "/terms",
          "/security"
        ],
        disallow: [
          "/tenant/",
          "/super-admin/",
          "/api/",
          "/suspended"
        ]
      }
    ],
    sitemap: "https://whereready.com/sitemap.xml"
  };
}
