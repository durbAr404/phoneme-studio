import { describe, expect, it } from "vitest";
import { evaluateGuess, keyboardStates } from "@/lib/games/wordle";
import { generateWordSearch, matchSelection, lineBetween } from "@/lib/games/wordsearch";
import { tokenizeTranscription } from "@/lib/phonemes";

describe("wordle scoring", () => {
  it("handles repeated phonemes like the real game", () => {
    expect(evaluateGuess(["b", "b", "b"], ["b", "ɐ", "d"])).toEqual(["correct", "absent", "absent"]);
    expect(evaluateGuess(["n", "ɪ", "θ"], ["θ", "ɪ", "n"])).toEqual(["present", "correct", "present"]);
  });
  it("keeps the best state per key", () => {
    const states = keyboardStates([
      { phonemes: ["θ", "e", "n"], states: ["correct", "absent", "correct"] },
      { phonemes: ["n", "ɪ", "θ"], states: ["present", "correct", "present"] },
    ]);
    expect(states).toMatchObject({ θ: "correct", n: "correct", ɪ: "correct", e: "absent" });
  });
});

describe("word search", () => {
  const words = [
    { english: "thin", phonemes: ["θ", "ɪ", "n"] },
    { english: "ship", phonemes: ["ʃ", "ɪ", "p"] },
    { english: "chin", phonemes: ["tʃ", "ɪ", "n"] },
  ];
  it("is deterministic for a seed so shared links show the same grid", () => {
    const a = generateWordSearch(words, { rows: 8, cols: 8, seed: 42, difficulty: "HARD" });
    const b = generateWordSearch(words, { rows: 8, cols: 8, seed: 42, difficulty: "HARD" });
    expect(a.grid).toEqual(b.grid);
    expect(a.placed).toHaveLength(3);
  });
  it("matches a selection in either direction", () => {
    const p = generateWordSearch(words, { rows: 8, cols: 8, seed: 7, difficulty: "MEDIUM" });
    const w = p.placed[0];
    expect(matchSelection(p, w.cells)?.english).toBe(w.english);
    expect(matchSelection(p, [...w.cells].reverse())?.english).toBe(w.english);
    expect(lineBetween(w.cells[0], w.cells.at(-1)!)).toEqual(w.cells);
  });
});

describe("transcription parsing", () => {
  it("treats tʃ as one sound", () => {
    expect(tokenizeTranscription("tʃɪn").phonemes).toEqual(["tʃ", "ɪ", "n"]);
  });
});
