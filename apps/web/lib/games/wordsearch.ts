/**
 * Phoneme word search engine. Each grid cell holds one phoneme symbol
 * (which may be several characters). Selections are compared as arrays,
 * so a cell "t" next to a cell "ʃ" never matches the single phoneme "tʃ".
 */
import { PHONEME_SYMBOLS } from "../phonemes";
import type { DifficultyLevel } from "./difficulty";
import { createRng, shuffle } from "./rng";

export type Cell = { row: number; col: number };
export type Direction = readonly [dr: number, dc: number];
export type PlacedWord = { index: number; english: string; phonemes: string[]; cells: Cell[] };
export type WordSearchPuzzle = {
  rows: number;
  cols: number;
  grid: string[][];
  placed: PlacedWord[];
  /** Words that could not fit; the builder warns the teacher about these. */
  unplaced: { english: string; phonemes: string[] }[];
};

const FORWARD: Direction[] = [
  [0, 1],
  [1, 0],
];
const DIAGONAL: Direction[] = [
  [1, 1],
  [-1, 1],
];
const BACKWARD: Direction[] = [
  [0, -1],
  [-1, 0],
  [-1, -1],
  [1, -1],
];

export function directionsFor(difficulty: DifficultyLevel): Direction[] {
  if (difficulty === "EASY") return FORWARD;
  if (difficulty === "MEDIUM") return [...FORWARD, ...DIAGONAL];
  return [...FORWARD, ...DIAGONAL, ...BACKWARD];
}

export type GenerateOptions = {
  rows: number;
  cols: number;
  seed: number;
  difficulty: DifficultyLevel;
};

export function generateWordSearch(
  words: readonly { english: string; phonemes: string[] }[],
  { rows, cols, seed, difficulty }: GenerateOptions,
): WordSearchPuzzle {
  const rng = createRng(seed);
  const directions = directionsFor(difficulty);
  const grid: string[][] = Array.from({ length: rows }, () => Array<string>(cols).fill(""));
  const placed: PlacedWord[] = [];
  const unplaced: WordSearchPuzzle["unplaced"] = [];

  // Place longest words first: they are the hardest to fit.
  const order = words
    .map((w, index) => ({ ...w, index }))
    .sort((a, b) => b.phonemes.length - a.phonemes.length);

  for (const word of order) {
    const len = word.phonemes.length;
    let done = false;

    // Enumerate every legal start/direction, shuffled, preferring placements
    // that overlap existing phonemes (denser, more interesting grids).
    const candidates: { cells: Cell[]; overlap: number; tie: number }[] = [];
    for (const [dr, dc] of directions) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const endR = r + dr * (len - 1);
          const endC = c + dc * (len - 1);
          if (endR < 0 || endR >= rows || endC < 0 || endC >= cols) continue;
          let overlap = 0;
          let ok = true;
          const cells: Cell[] = [];
          for (let i = 0; i < len; i++) {
            const rr = r + dr * i;
            const cc = c + dc * i;
            const existing = grid[rr][cc];
            if (existing && existing !== word.phonemes[i]) {
              ok = false;
              break;
            }
            if (existing) overlap++;
            cells.push({ row: rr, col: cc });
          }
          if (ok && overlap < len) candidates.push({ cells, overlap, tie: rng() });
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.overlap - a.overlap || a.tie - b.tie);
      // Take from the top few so grids aren't always maximally packed.
      const pickFrom = Math.min(candidates.length, 6);
      const chosen = candidates[Math.floor(rng() * pickFrom)];
      chosen.cells.forEach((cell, i) => (grid[cell.row][cell.col] = word.phonemes[i]));
      placed.push({ index: word.index, english: word.english, phonemes: word.phonemes, cells: chosen.cells });
      done = true;
    }
    if (!done) unplaced.push({ english: word.english, phonemes: word.phonemes });
  }

  // Fill blanks, biased towards phonemes already in the puzzle so the hidden
  // words don't stand out against unrelated filler.
  const used = placed.flatMap((p) => p.phonemes);
  const fillerPool = used.length > 0 ? [...used, ...shuffle(PHONEME_SYMBOLS, rng).slice(0, 18)] : PHONEME_SYMBOLS;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) grid[r][c] = fillerPool[Math.floor(rng() * fillerPool.length)];
    }
  }

  placed.sort((a, b) => a.index - b.index);
  return { rows, cols, grid, placed, unplaced };
}

/**
 * Cells on the straight line from `start` towards `end`, snapped to the
 * nearest of the 8 directions. Used for drag and keyboard selection.
 */
export function lineBetween(start: Cell, end: Cell): Cell[] {
  const dr = end.row - start.row;
  const dc = end.col - start.col;
  if (dr === 0 && dc === 0) return [start];
  const angle = Math.atan2(dr, dc);
  const octant = Math.round(angle / (Math.PI / 4));
  const stepR = Math.round(Math.sin((octant * Math.PI) / 4));
  const stepC = Math.round(Math.cos((octant * Math.PI) / 4));
  const length = Math.max(Math.abs(dr), Math.abs(dc));
  return Array.from({ length: length + 1 }, (_, i) => ({ row: start.row + stepR * i, col: start.col + stepC * i }));
}

const sameCells = (a: Cell[], b: Cell[]) => a.length === b.length && a.every((c, i) => c.row === b[i].row && c.col === b[i].col);

/**
 * Which placed word (if any) a selection matches. A selection counts if it
 * covers exactly the word's cells in either direction.
 */
export function matchSelection(
  puzzle: WordSearchPuzzle,
  selection: Cell[],
  alreadyFound: ReadonlySet<number> = new Set(),
): PlacedWord | null {
  if (selection.length < 2) return null;
  const reversed = [...selection].reverse();
  const open = puzzle.placed.filter((w) => !alreadyFound.has(w.index));
  const byCells = open.find((w) => sameCells(w.cells, selection) || sameCells(w.cells, reversed));
  if (byCells) return byCells;

  // Filler can accidentally spell a hidden word a second time. Accept it:
  // the student found the right sounds in a straight line.
  const picked = selection.map((c) => puzzle.grid[c.row]?.[c.col]);
  const same = (a: string[], b: (string | undefined)[]) => a.length === b.length && a.every((x, i) => x === b[i]);
  const bySound = open.find((w) => same(w.phonemes, picked) || same(w.phonemes, [...picked].reverse()));
  return bySound ? { ...bySound, cells: selection } : null;
}

/** Recommend a square grid size that comfortably fits the words. */
export function suggestGridSize(words: readonly { phonemes: string[] }[], base: number): number {
  const longest = Math.max(0, ...words.map((w) => w.phonemes.length));
  const totalCells = words.reduce((n, w) => n + w.phonemes.length, 0);
  const byDensity = Math.ceil(Math.sqrt(totalCells / 0.45));
  return Math.min(16, Math.max(base, longest + 1, byDensity));
}
