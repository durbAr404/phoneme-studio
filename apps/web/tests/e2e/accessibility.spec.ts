import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/play", "/create/wordle", "/library", "/sounds", "/about", "/settings", "/my-activities", "/daily"];

for (const theme of ["light", "dark"] as const) {
  for (const path of PAGES) {
    test(`${path} has no axe violations (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("phonemestudio:prefs:v1", JSON.stringify({ theme: t, motion: "off" })), theme);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    });
  }
}
