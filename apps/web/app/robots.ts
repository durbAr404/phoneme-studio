import { SHOWCASE } from "@/lib/showcase";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api", "/p/", ...(SHOWCASE ? ["/admin", "/admin-login", "/teacher-sign-in"] : [])] }], sitemap: `${base}/sitemap.xml` };
}
