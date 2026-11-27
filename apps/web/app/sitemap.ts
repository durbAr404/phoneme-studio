import { SHOWCASE } from "@/lib/showcase";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return ["", "/play", "/daily", "/create/wordle", "/create/word-search", "/library", "/sounds", "/about", ...(SHOWCASE ? ["/developers"] : [])].map((p) => ({ url: `${base}${p}` }));
}
