import type { Page } from "@playwright/test";

export const H = { "X-Requested-With": "phonemestudio" };

export async function devLogin(page: Page, email: string) {
  const r = await page.request.post("/api/auth/dev-login", { data: { email, role: email.startsWith("admin") ? "admin" : "teacher" }, headers: H });
  if (!r.ok()) throw new Error(`login failed: ${r.status()}`);
}

export async function demoLogin(page: Page) {
  const r = await page.request.post("/api/auth/demo", { headers: H });
  if (!r.ok()) throw new Error("demo login failed");
}

/** Click the on-screen keys for each phoneme (keycap aria-labels start with "/x/"). */
export async function typeSounds(page: Page, sounds: string[]) {
  for (const s of sounds) await page.locator(`button[data-keycap][aria-label^="/${s}/"]`).first().click();
}
