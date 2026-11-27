import { evaluateGuess } from "../games/wordle";
import { DIFFICULTY_LABEL, type DifficultyLevel } from "../games/difficulty";
import { inventoryJson, pageShell, scriptJson } from "./shared";

type Input = {
  name: string;
  difficulty: DifficultyLevel;
  words: { english: string; phonemes: string[] }[];
  config: { maxAttempts: number; showHints: boolean };
};

const css = `
.status { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 14px; color: var(--ink-soft); }
.dots { display: flex; gap: 6px; }
.dots span { width: 10px; height: 10px; border-radius: 50%; background: var(--line); }
.dots span.won { background: var(--correct); } .dots span.lost { background: var(--vowel); } .dots span.now { background: var(--ink); }
.board { display: grid; gap: 8px; justify-content: center; margin: 20px auto; }
.board .r { display: grid; gap: 8px; grid-auto-flow: column; grid-auto-columns: clamp(46px, 13vw, 62px); }
.tile { aspect-ratio: 1; display: grid; place-items: center; border-radius: 12px; border: 2px solid var(--line); background: var(--surface);
  font-family: "Andika", sans-serif; font-weight: 700; font-size: clamp(20px, 5vw, 26px); transition: transform .12s; }
.tile.filled { border-color: var(--ink); animation: pop .12s ease; }
.tile.correct, .tile.present, .tile.absent { color: #fff; border-color: transparent; animation: flip .5s ease both; }
.tile.correct { background: var(--correct); } .tile.present { background: var(--present); } .tile.absent { background: var(--absent); }
@keyframes pop { 50% { transform: scale(1.08); } }
@keyframes flip { 0% { transform: rotateX(0); } 50% { transform: rotateX(90deg); } 100% { transform: rotateX(0); } }
.msg { min-height: 28px; text-align: center; font-weight: 600; }
.kb { display: grid; gap: 12px; margin-top: 8px; }
.kb h2 { font-size: 13px; font-weight: 600; color: var(--ink-soft); margin-bottom: 6px; }
.keys { display: flex; flex-wrap: wrap; gap: 6px; }
.key { min-width: 44px; height: 46px; padding: 0 8px; border-radius: 10px; border: 0; font-family: "Andika", sans-serif; font-weight: 700; font-size: 19px;
  background: var(--tint); color: var(--ink2); box-shadow: inset 0 -4px 0 var(--base); transition: transform .08s; }
.key:active { transform: translateY(2px); box-shadow: inset 0 -2px 0 var(--base); }
.key.correct { background: var(--correct); color: #fff; box-shadow: none; } .key.present { background: var(--present); color: #fff; box-shadow: none; }
.key.absent { background: #E6E7EC; color: #9A9EAE; box-shadow: none; }
.controls { display: flex; gap: 8px; justify-content: center; margin-top: 14px; flex-wrap: wrap; }
.clue { text-align: center; margin-top: 8px; color: var(--ink-soft); }
.done { text-align: center; }
.done .big { font-size: 48px; font-weight: 800; letter-spacing: -0.03em; }
`;

const body = (input: Input) => `
<p class="sub">${input.words.length} word${input.words.length > 1 ? "s" : ""} to solve, ${input.config.maxAttempts} guesses each (${DIFFICULTY_LABEL[input.difficulty].toLowerCase()})</p>
<section class="panel" id="game">
  <div class="status"><span id="roundLabel"></span><span class="dots" id="dots" aria-hidden="true"></span></div>
  <div class="board" id="board" role="grid" aria-label="Guesses"></div>
  <p class="msg" id="msg" aria-live="polite"></p>
  <p class="clue" id="clue" hidden></p>
  <div class="controls">
    <button class="btn" id="del" type="button">Delete</button>
    <button class="btn primary" id="enter" type="button">Check</button>
    ${input.config.showHints ? '<button class="btn" id="hint" type="button">Show clue</button>' : ""}
    <button class="btn" id="next" type="button" hidden>Next word</button>
  </div>
</section>
<section class="panel"><div class="kb" id="kb"></div><p class="sub" style="margin-top:12px;font-size:13px">Tap a sound to add it. Keyboard: Backspace deletes, Enter checks.</p></section>
<section class="panel done" id="summary" hidden></section>
`;

/** Generate a single self-contained HTML file for a phoneme Wordle activity. */
export function generateWordleHtml(input: Input): string {
  // The scoring function is the same tested code the app uses.
  const script = `
"use strict";
const evaluateGuess = ${evaluateGuess.toString()};
const INV = ${inventoryJson()};
const WORDS = ${scriptJson(input.words)};
const MAX = ${input.config.maxAttempts};
const $ = (id) => document.getElementById(id);
const rank = { absent: 0, present: 1, correct: 2 };
let round = 0, guesses = [], current = [], status = "playing", results = [], keyState = {};

function buildKeyboard() {
  const kb = $("kb");
  for (const cls of INV.classes) {
    const group = document.createElement("div");
    const h = document.createElement("h2"); h.textContent = cls.label; group.appendChild(h);
    const keys = document.createElement("div"); keys.className = "keys";
    const col = INV.colours[cls.id];
    for (const p of INV.phonemes.filter((x) => x.c === cls.id)) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "key"; b.textContent = p.s; b.title = p.h; b.dataset.s = p.s;
      b.setAttribute("aria-label", p.h);
      b.style.setProperty("--tint", col.tint); b.style.setProperty("--base", col.base); b.style.setProperty("--ink2", col.ink);
      b.addEventListener("click", () => add(p.s));
      keys.appendChild(b);
    }
    group.appendChild(keys); kb.appendChild(group);
  }
}

function target() { return WORDS[round].phonemes; }

function render() {
  const len = target().length, board = $("board");
  board.innerHTML = "";
  for (let r = 0; r < MAX; r++) {
    const row = document.createElement("div"); row.className = "r"; row.setAttribute("role", "row");
    const g = guesses[r];
    for (let c = 0; c < len; c++) {
      const t = document.createElement("div"); t.className = "tile"; t.setAttribute("role", "gridcell");
      if (g) { t.textContent = g.p[c]; t.classList.add(g.s[c]); t.style.animationDelay = (c * 90) + "ms"; t.setAttribute("aria-label", g.p[c] + " " + g.s[c]); }
      else if (r === guesses.length && current[c]) { t.textContent = current[c]; t.classList.add("filled"); }
      row.appendChild(t);
    }
    board.appendChild(row);
  }
  document.querySelectorAll(".key").forEach((k) => { k.classList.remove("correct", "present", "absent"); const s = keyState[k.dataset.s]; if (s) k.classList.add(s); });
  $("roundLabel").textContent = "Word " + (round + 1) + " of " + WORDS.length;
  $("dots").innerHTML = WORDS.map((_, i) => '<span class="' + (results[i] || (i === round ? "now" : "")) + '"></span>').join("");
  $("next").hidden = status === "playing";
  $("enter").hidden = status !== "playing"; $("del").hidden = status !== "playing";
  const hint = $("hint"); if (hint) hint.hidden = status !== "playing";
}

function add(s) { if (status !== "playing" || current.length >= target().length) return; current.push(s); render(); }
function del() { if (status !== "playing") return; current.pop(); render(); }
function submit() {
  if (status !== "playing") return;
  if (current.length < target().length) { say("Add " + (target().length - current.length) + " more sound" + (target().length - current.length > 1 ? "s" : "")); return; }
  const s = evaluateGuess(current, target());
  guesses.push({ p: current, s });
  current.forEach((p, i) => { if (!keyState[p] || rank[s[i]] > rank[keyState[p]]) keyState[p] = s[i]; });
  current = [];
  if (s.every((x) => x === "correct")) { status = "won"; results[round] = "won"; say("You got it: " + WORDS[round].english + " /" + target().join(" ") + "/"); }
  else if (guesses.length >= MAX) { status = "lost"; results[round] = "lost"; say("The word was " + WORDS[round].english + " /" + target().join(" ") + "/"); }
  else say("");
  render();
}
function say(t) { $("msg").textContent = t; }
function next() {
  if (round + 1 >= WORDS.length) return finish();
  round++; guesses = []; current = []; status = "playing"; keyState = {}; say(""); $("clue").hidden = true; render();
}
function finish() {
  const won = results.filter((r) => r === "won").length;
  $("game").hidden = true; document.querySelector(".kb").parentElement.hidden = true;
  const s = $("summary"); s.hidden = false;
  s.innerHTML = '<p class="big">' + won + " / " + WORDS.length + '</p><p class="sub">words solved</p><div class="row-actions"><button class="btn primary" type="button" onclick="location.reload()">Play again</button></div>';
}

$("del").addEventListener("click", del);
$("enter").addEventListener("click", submit);
$("next").addEventListener("click", next);
if ($("hint")) $("hint").addEventListener("click", () => { const c = $("clue"); c.hidden = false; c.textContent = "Clue: the word is \\u201c" + WORDS[round].english + "\\u201d"; });
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "Backspace") { e.preventDefault(); del(); }
  else if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement && !e.target.classList.contains("key"))) { e.preventDefault(); status === "playing" ? submit() : next(); }
});
buildKeyboard(); render();
`;
  return pageShell({ title: input.name, subtitle: "Phoneme Wordle", css, body: body(input), script });
}
