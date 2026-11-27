import { expect, test } from "@playwright/test";

test("API rejects state changes without the CSRF header", async ({ page }) => {
  const r = await page.request.post("/api/shares", { data: { kind: "wordle", title: "x", words: [{ english: "thin", phonemes: ["θ", "ɪ", "n"] }] } });
  expect(r.status()).toBe(403);
});

test("pages send a nonce-based Content Security Policy", async ({ page }) => {
  const res = await page.goto("/");
  await page.waitForLoadState("networkidle");
  const csp = res!.headers()["content-security-policy"];
  expect(csp).toContain("'nonce-");
  expect(csp).toContain("frame-ancestors 'none'");
});

test("pages send security headers", async ({ page }) => {
  const res = await page.goto("/");
  const h = res!.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
});
