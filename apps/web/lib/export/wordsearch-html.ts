import { generateWordSearch, lineBetween } from "../games/wordsearch";
import { DIFFICULTY_LABEL, type DifficultyLevel } from "../games/difficulty";
import { escapeHtml, pageShell, scriptJson } from "./shared";

type Input = {
  name: string;
  difficulty: DifficultyLevel;
  words: { english: string; phonemes: string[] }[];
  config: { rows: number; cols: number; seed: number; showEnglish: boolean };
};

const css = `
.meta { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.count { font-weight: 700; }
.wrap { overflow-x: auto; padding: 4px; margin: 16px -4px; }
.grid { display: grid; gap: 4px; margin: 0 auto; width: max-content; touch-action: none; user-select: none; -webkit-user-select: none; }
.cell { width: var(--cell); height: var(--cell); display: grid; place-items: center; border-radius: 9px; border: 0; background: var(--paper);
  font-family: "Andika", sans-serif; font-weight: 700; font-size: calc(var(--cell) * 0.42); color: var(--ink); padding: 0; }
.cell.sel { background: var(--sun); }
.cell.found { background: color-mix(in srgb, var(--hue) 22%, white); color: var(--hue); }
.cell.sol { box-shadow: inset 0 0 0 2px var(--vowel); }
.bank { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; list-style: none; padding: 0; }
.bank li { border: 2px solid var(--line); border-radius: 999px; padding: 4px 12px; display: flex; gap: 8px; align-items: baseline; }
.bank li.found { border-color: transparent; background: color-mix(in srgb, var(--hue) 16%, white); text-decoration: line-through; color: var(--ink-soft); }
.bank .ipa { font-weight: 700; font-size: 18px; }
.bank small { color: var(--ink-soft); }
.msg { min-height: 26px; text-align: center; font-weight: 600; margin-top: 10px; }
@media print { body { background: #fff; padding: 0; } .row-actions, footer.foot, header.top { display: none; } .panel { border: 0; padding: 0; } .cell { border: 1px solid #ccc; background: #fff; } }
`;

const HUES = ["#3f7567", "#c9553b", "#33617a", "#6b5596", "#cf7a36", "#2c7a80", "#b8456a", "#8a6a00"];

/** Generate a single self-contained HTML file for a phoneme word search. */
export function generateWordSearchHtml(input: Input): string {
  const puzzle = generateWordSearch(input.words, { ...input.config, difficulty: input.difficulty });
  const cell = puzzle.cols > 12 ? 38 : puzzle.cols > 9 ? 44 : 52;
  const bank = puzzle.placed
    .map(
      (w, i) =>
        `<li data-i="${i}" style="--hue:${HUES[i % HUES.length]}"><span class="ipa">/${escapeHtml(w.phonemes.join(" "))}/</span>${
          input.config.showEnglish ? `<small>${escapeHtml(w.english)}</small>` : ""
        }</li>`,
    )
    .join("");

  const body = `
<p class="sub">Find ${puzzle.placed.length} hidden words, spelled in sounds (${DIFFICULTY_LABEL[input.difficulty].toLowerCase()}: ${
    input.difficulty === "EASY" ? "across and down" : input.difficulty === "MEDIUM" ? "across, down and diagonal" : "any direction, even backwards"
  })</p>
<section class="panel">
  <div class="meta"><span class="count" id="count" aria-live="polite"></span><span class="sub" style="margin:0;font-size:14px">Drag across the sounds of a word</span></div>
  <div class="wrap"><div class="grid" id="grid" role="grid" aria-label="Word search grid" style="--cell:${cell}px;grid-template-columns:repeat(${puzzle.cols}, var(--cell))"></div></div>
  <ul class="bank" id="bank" aria-label="Words to find">${bank}</ul>
  <p class="msg" id="msg" aria-live="polite"></p>
  <div class="row-actions">
    <button class="btn" type="button" id="sol">Show answers</button>
    <button class="btn" type="button" onclick="window.print()">Print</button>
  </div>
</section>`;

  const script = `
"use strict";
const lineBetween = ${lineBetween.toString()};
const P = ${scriptJson({ grid: puzzle.grid, words: puzzle.placed.map((w) => ({ p: w.phonemes, e: w.english, c: w.cells })) })};
const HUES = ${scriptJson(HUES)};
const $ = (id) => document.getElementById(id);
const found = new Map(); let start = null, sel = [], showSol = false, focus = { row: 0, col: 0 }, kbStart = null;
const gridEl = $("grid"); const cells = [];

P.grid.forEach((row, r) => { const rowEl = document.createElement("div"); rowEl.setAttribute("role", "row"); rowEl.style.display = "contents"; gridEl.appendChild(rowEl); row.forEach((s, c) => {
  const b = document.createElement("button"); b.type = "button"; b.className = "cell"; b.textContent = s; b.tabIndex = r === 0 && c === 0 ? 0 : -1;
  b.dataset.r = r; b.dataset.c = c; b.setAttribute("role", "gridcell"); b.setAttribute("aria-label", "Row " + (r + 1) + ", column " + (c + 1) + ": " + s);
  rowEl.appendChild(b); cells.push(b);
}); });
const at = (r, c) => cells[r * P.grid[0].length + c];
const key = (x) => x.row + ":" + x.col;

function match(selection) {
  if (selection.length < 2) return -1;
  const fwd = selection.map(key).join("|"), back = selection.slice().reverse().map(key).join("|");
  const picked = selection.map((x) => P.grid[x.row][x.col]).join("|"), pickedBack = selection.map((x) => P.grid[x.row][x.col]).reverse().join("|");
  for (let i = 0; i < P.words.length; i++) {
    if (found.has(i)) continue;
    const w = P.words[i].c.map(key).join("|");
    if (w === fwd || w === back || P.words[i].p.join("|") === picked || P.words[i].p.join("|") === pickedBack) return i;
  }
  return -1;
}

function paint() {
  cells.forEach((b) => { b.classList.remove("sel", "found", "sol"); b.style.removeProperty("--hue"); });
  found.forEach((cs, i) => cs.forEach((x) => { const b = at(x.row, x.col); b.classList.add("found"); b.style.setProperty("--hue", HUES[i % HUES.length]); }));
  if (showSol) P.words.forEach((w, i) => { if (!found.has(i)) w.c.forEach((x) => at(x.row, x.col).classList.add("sol")); });
  sel.forEach((x) => at(x.row, x.col).classList.add("sel"));
  document.querySelectorAll("#bank li").forEach((li) => li.classList.toggle("found", found.has(Number(li.dataset.i))));
  $("count").textContent = found.size + " of " + P.words.length + " found";
}
function commit() {
  const i = match(sel);
  if (i >= 0) { found.set(i, sel); $("msg").textContent = found.size === P.words.length ? "All found. Brilliant work!" : "Found /" + P.words[i].p.join(" ") + "/ (" + P.words[i].e + ")"; }
  sel = []; start = null; paint();
}
const cellFrom = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.classList && el.classList.contains("cell") ? { row: +el.dataset.r, col: +el.dataset.c } : null; };
gridEl.addEventListener("pointerdown", (e) => { const c = cellFrom(e); if (!c) return; e.preventDefault(); start = c; sel = [c]; paint(); });
window.addEventListener("pointermove", (e) => { if (!start) return; const c = cellFrom(e); if (!c) return; sel = lineBetween(start, c).filter((x) => x.row >= 0 && x.col >= 0 && x.row < P.grid.length && x.col < P.grid[0].length); paint(); });
window.addEventListener("pointerup", () => { if (start) commit(); });
gridEl.addEventListener("keydown", (e) => {
  const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
  if (d) {
    e.preventDefault();
    focus = { row: Math.max(0, Math.min(P.grid.length - 1, focus.row + d[0])), col: Math.max(0, Math.min(P.grid[0].length - 1, focus.col + d[1])) };
    cells.forEach((b) => (b.tabIndex = -1)); const b = at(focus.row, focus.col); b.tabIndex = 0; b.focus();
    if (kbStart) { sel = lineBetween(kbStart, focus); paint(); }
  } else if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    if (!kbStart) { kbStart = { ...focus }; sel = [kbStart]; paint(); $("msg").textContent = "Selecting: move to the last sound and press Space again"; }
    else { kbStart = null; commit(); }
  } else if (e.key === "Escape") { kbStart = null; sel = []; paint(); $("msg").textContent = ""; }
});
gridEl.addEventListener("focusin", (e) => { if (e.target.dataset && e.target.dataset.r) focus = { row: +e.target.dataset.r, col: +e.target.dataset.c }; });
$("sol").addEventListener("click", () => { showSol = !showSol; $("sol").textContent = showSol ? "Hide answers" : "Show answers"; paint(); });
paint();
`;
  return pageShell({ title: input.name, subtitle: "Phoneme word search", css, body, script });
}
