import { expect, test } from "@playwright/test";
import { typeSounds } from "./helpers";

test("home is minimal and the navbar links work", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sound games that feel like play.");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const name of ["Play", "Word library", "Sound guide", "About"]) await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  await nav.getByRole("button", { name: "Create" }).click();
  await page.getByRole("link", { name: "ʃ Word search Find words hidden as sounds", exact: true }).click();
  await expect(page).toHaveURL(/\/create\/word-search/);
});

test("theme toggle switches to dark and remembers it", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Switch to dark mode" }).first().click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("search palette opens with Ctrl+K and finds a sound", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Control+k");
  const box = page.getByRole("dialog", { name: "Search" });
  await box.getByRole("textbox").fill("th");
  await expect(box.getByRole("option").filter({ hasText: "/θ/" })).toBeVisible();
});

test("build a Wordle from a pasted list, share it and win", async ({ page }) => {
  await page.goto("/create/wordle");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Type or paste words").fill("thin, ship, zzzzq");
  await page.getByRole("button", { name: "Add words" }).click();
  await expect(page.getByText("2 ready")).toBeVisible();
  await expect(page.getByText("Not in the library yet")).toBeVisible();
  await page.getByRole("button", { name: "Remove zzzzq" }).click();
  await page.getByRole("button", { name: /Next: settings/ }).click();
  await page.getByLabel("Title").fill("E2E game");
  await page.getByRole("button", { name: /Next: share/ }).click();
  await page.getByRole("button", { name: "Create link" }).click();
  const link = await page.getByLabel("Share link").inputValue();
  expect(link).toMatch(/\/p\/[a-z0-9]{8}$/);
  await expect(page.getByAltText("QR code for the share link")).toBeVisible();

  await page.goto(link);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "E2E game" })).toBeVisible();
  await typeSounds(page, ["θ", "ɪ", "n"]);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("The word was")).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Next word" }).click();
  await typeSounds(page, ["ʃ", "ɪ", "p"]);
  await page.getByRole("button", { name: "Check" }).click();
  await page.getByRole("button", { name: "See my results" }).click();
  await expect(page.getByRole("heading", { name: "You solved 2 of 2!" })).toBeVisible();
  await page.getByLabel(/Add a nickname/).fill("Robo");
  await page.getByRole("button", { name: "Send score" }).click();
  await expect(page.getByText("Score sent")).toBeVisible();
});

test("checking an incomplete guess shakes and explains", async ({ page }) => {
  const res = await page.request.get("/api/gallery?kind=wordle");
  const [first] = await res.json();
  await page.goto(`/play/${first.id}`);
  await page.waitForLoadState("networkidle");
  await typeSounds(page, ["θ"]);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText(/more sound/)).toBeVisible();
});

test("library selection pre-fills the builder", async ({ page }) => {
  await page.goto("/library");
  await page.waitForLoadState("networkidle");
  await page.getByRole("checkbox", { name: "Select thin", exact: true }).click();
  await page.getByRole("checkbox", { name: "Select ship", exact: true }).click();
  await page.getByRole("link", { name: "Make a Wordle" }).click();
  await expect(page.getByText("2 ready")).toBeVisible();
});

test("daily challenge accepts a guess", async ({ page }) => {
  await page.goto("/daily");
  await page.waitForLoadState("networkidle");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toContainText("sounds");
  const n = Number((await heading.textContent())!.match(/(\d+) sounds/)![1]);
  const keys = page.locator("button[data-keycap]");
  for (let i = 0; i < n; i++) await keys.first().click();
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".bg-correct, .bg-present, .bg-absent").first()).toBeVisible();
});

test("save code moves games to another browser", async ({ page, browser }) => {
  await page.goto("/create/wordle");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Type or paste words").fill("thin");
  await page.getByRole("button", { name: "Add words" }).click();
  await page.waitForTimeout(600);
  await page.goto("/my-activities");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Get a save code" }).click();
  const code = (await page.locator("code").textContent())!.trim();
  const other = await browser.newPage();
  await other.goto("/my-activities");
  await other.waitForLoadState("networkidle");
  await other.getByLabel("Restore from a code").fill(code);
  await other.getByRole("button", { name: "Restore" }).click();
  await expect(other.getByText("My Wordle")).toBeVisible();
  await other.close();
});

test("unknown pages show the friendly not-found page", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "That page isn't a word we know." })).toBeVisible();
  await page.getByRole("link", { name: "Go home" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("navbar has no links to missing pages", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const hrefs = await page.locator("header a[href^='/'], footer a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  for (const href of new Set(hrefs)) {
    const r = await page.request.get(href);
    expect(r.status(), href).toBe(200);
  }
});
