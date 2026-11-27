import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@fontsource/fredoka/400.css";
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/andika/400.css";
import "@fontsource/andika/700.css";
import "./globals.css";
import { PREFS_SCRIPT } from "@/lib/prefs";
import { serverApi } from "@/lib/server-api";
import { SITE } from "@/lib/site";
import { ServerWake } from "@/components/site/server-wake";
import type { PublicConfig } from "@/lib/types";
import { Providers } from "@/components/site/providers";
import { WebVitals } from "@/components/site/web-vitals";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Phoneme Studio: sound games for Australian English", template: "%s | Phoneme Studio" },
  description: "Make phoneme Wordle and word search games for Australian English (HCE) in about a minute. Free, no account needed.",
  openGraph: { type: "website", siteName: "Phoneme Studio" },
  authors: [{ name: SITE.author }],
  creator: SITE.author,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4fbf7" },
    { media: "(prefers-color-scheme: dark)", color: "#121716" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const config = await serverApi<PublicConfig>("/public/config", { revalidate: 60, timeoutMs: 3000 });
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body>
        <Providers config={config}>
          {children}
          <ServerWake />
        </Providers>
        <WebVitals />
        {process.env.VERCEL && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
