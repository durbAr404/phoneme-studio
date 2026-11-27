"use client";
import { useReportWebVitals } from "next/web-vitals";

const TRACKED = new Set(["LCP", "INP", "CLS", "FCP", "TTFB"]);

/** Sends a 25% sample of real-user Core Web Vitals to the API for the admin System page. */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (!TRACKED.has(metric.name) || Math.random() > 0.25) return;
    const page = window.location.pathname.replace(/\/[a-z0-9-]{8,}$/i, "/[id]").slice(0, 120);
    void fetch("/api/telemetry/vitals", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", "X-Requested-With": "phonemestudio" },
      body: JSON.stringify({ name: metric.name, value: metric.value, page }),
    }).catch(() => {});
  });
  return null;
}
