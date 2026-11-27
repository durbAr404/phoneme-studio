import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

// The showcase pages (For Developers, admin and teacher demos) live in app/(showcase), which is
// optional. Detect it here so links to it only appear when it's part of the build.
const SHOWCASE = existsSync(join(process.cwd(), "app", "(showcase)"));

const config: NextConfig = {
  env: { NEXT_PUBLIC_SHOWCASE: SHOWCASE ? "1" : "" },
  poweredByHeader: false,
  reactStrictMode: true,
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // The browser only ever talks to this origin; Next.js forwards /api/* to the FastAPI service.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
  async headers() {
    if (!SHOWCASE) return [];
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return ["/admin/:path*", "/admin-login", "/teacher-sign-in"].map((source) => ({ source, headers: noindex }));
  },
};

export default config;
