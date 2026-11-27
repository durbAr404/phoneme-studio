import { BRAND, CLASS_COLOURS, FEEDBACK } from "../design-tokens";
import { PHONEMES, SOUND_CLASSES } from "../phonemes";
import { ANDIKA_IPA_WOFF2, ANDIKA_LATIN_WOFF2 } from "./andika-subset";

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

/** JSON that is safe to place inside a <script> element. */
export function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/\u2028|\u2029/g, "");
}

/** Phoneme inventory in the compact form the exported pages need. */
export function inventoryJson(): string {
  return scriptJson({
    classes: SOUND_CLASSES.map((c) => ({ id: c.id, label: c.label })),
    phonemes: PHONEMES.map((p) => ({ s: p.symbol, c: p.soundClass, h: `/${p.symbol}/ ${p.spelling} as in ${p.example}` })),
    colours: CLASS_COLOURS,
  });
}

export const baseCss = `
@font-face { font-family: "Andika"; font-weight: 400 800; src: url(data:font/woff2;base64,${ANDIKA_LATIN_WOFF2}) format("woff2"); unicode-range: U+0000-00FF, U+2013-2014, U+2019, U+2022, U+00D7; }
@font-face { font-family: "Andika"; font-weight: 400 800; src: url(data:font/woff2;base64,${ANDIKA_IPA_WOFF2}) format("woff2"); unicode-range: U+0100-02FF; }
:root {
  --paper: ${BRAND.paper}; --surface: ${BRAND.surface}; --ink: ${BRAND.ink}; --ink-soft: ${BRAND.inkSoft};
  --line: ${BRAND.line}; --sun: ${BRAND.sun}; --consonant: ${BRAND.consonant}; --vowel: ${BRAND.vowel};
  --correct: ${FEEDBACK.correct}; --present: ${FEEDBACK.present}; --absent: ${FEEDBACK.absent};
}
* { box-sizing: border-box; margin: 0; }
html { -webkit-text-size-adjust: 100%; }
body {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--ink); background: var(--paper);
  min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 24px 16px 48px; line-height: 1.5;
}
.ipa { font-family: "Andika", "Segoe UI", "Arial Unicode MS", sans-serif; }
header.top { width: 100%; max-width: 760px; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; color: var(--ink-soft); }
.brand i { width: 26px; height: 26px; border-radius: 8px 8px 8px 3px; background: #1f7a5c; color: #fff; display: inline-grid; place-items: center; font: 800 11px system-ui, sans-serif; font-style: normal; letter-spacing: -0.5px; }
h1 { font-size: clamp(26px, 5vw, 38px); line-height: 1.1; letter-spacing: -0.02em; text-align: center; }
.sub { color: var(--ink-soft); text-align: center; margin-top: 6px; }
main { width: 100%; max-width: 760px; }
.panel { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: clamp(16px, 4vw, 28px); box-shadow: 0 14px 40px rgba(37,44,39,.055); margin-top: 20px; }
button { font: inherit; cursor: pointer; }
.btn { border: 1px solid var(--line); background: var(--surface); color: var(--ink); border-radius: 10px; padding: 8px 16px; font-weight: 600; font-size: 14px; }
.btn:hover { background: var(--paper); }
.btn.primary { background: #1f7a5c; border-color: #1f7a5c; color: #fff; }
.btn:focus-visible, .key:focus-visible, .cell:focus-visible { outline: 3px solid var(--sun); outline-offset: 2px; }
.row-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 16px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
footer.foot { margin-top: 32px; font-size: 13px; color: var(--ink-soft); text-align: center; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
`;

export function pageShell(opts: { title: string; subtitle: string; css: string; body: string; script: string }) {
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="Phoneme Studio">
<title>${escapeHtml(opts.title)}</title>
<style>${baseCss}${opts.css}</style>
</head>
<body>
<header class="top"><span class="brand"><i aria-hidden="true">ph</i>Phoneme Studio</span><span class="brand" style="font-weight:500">${escapeHtml(opts.subtitle)}</span></header>
<main>
<h1>${escapeHtml(opts.title)}</h1>
${opts.body}
</main>
<footer class="foot">Made with Phoneme Studio. Works offline: no internet connection needed.</footer>
<script>${opts.script}</script>
</body>
</html>`;
}
