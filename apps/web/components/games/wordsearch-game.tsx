"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { generateWordSearch, lineBetween, matchSelection, type Cell } from "@/lib/games/wordsearch";
import type { Difficulty, Word } from "@/lib/types";
import { sfx } from "@/lib/sound";
import { confetti } from "@/lib/confetti";
import { cn } from "@/lib/cn";
import { Buddy, type Mood } from "./buddy";
import type { GameResult } from "./wordle-game";

const FOUND_TONES = ["bg-mint text-mint-ink", "bg-peach text-peach-ink", "bg-butter text-butter-ink", "bg-sky text-sky-ink", "bg-lilac text-lilac-ink"];
const key = (c: Cell) => `${c.row}:${c.col}`;

export function WordSearchGame({
  words,
  gridSize = 10,
  difficulty = "MEDIUM",
  seed = 1,
  showSpelling = true,
  instructions,
  onFinish,
  big,
}: {
  words: Word[];
  gridSize?: number;
  difficulty?: Difficulty;
  seed?: number;
  showSpelling?: boolean;
  instructions?: string;
  onFinish?: (r: GameResult) => void;
  big?: boolean;
}) {
  const puzzle = useMemo(() => generateWordSearch(words, { rows: gridSize, cols: gridSize, seed, difficulty }), [words, gridSize, seed, difficulty]);
  const [found, setFound] = useState<Map<number, Cell[]>>(new Map());
  const [start, setStart] = useState<Cell | null>(null);
  const [selection, setSelection] = useState<Cell[]>([]);
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [pop, setPop] = useState<Set<string>>(new Set());
  const [mood, setMood] = useState<Mood>("calm");
  const [say, setSay] = useState("Drag across the grid in a straight line.");
  const [cursor, setCursor] = useState<Cell>({ row: 0, col: 0 });
  const started = useRef(Date.now());
  const grid = useRef<HTMLDivElement>(null);
  const finished = found.size === puzzle.placed.length && puzzle.placed.length > 0;

  useEffect(() => {
    setFound(new Map());
    setMood("calm");
    started.current = Date.now();
  }, [puzzle]);

  const foundCell = useMemo(() => {
    const m = new Map<string, number>();
    found.forEach((cells, idx) => cells.forEach((c) => m.set(key(c), idx)));
    return m;
  }, [found]);

  const finish = useCallback(
    (sel: Cell[]) => {
      setStart(null);
      setSelection([]);
      if (sel.length < 2) return;
      const hit = matchSelection(puzzle, sel, new Set(found.keys()));
      if (hit) {
        const next = new Map(found).set(hit.index, sel);
        setFound(next);
        setPop(new Set(sel.map(key)));
        setTimeout(() => setPop(new Set()), 700);
        sfx.found();
        const left = puzzle.placed.length - next.size;
        setMood("happy");
        setSay(left ? `Found ${hit.english}! ${left} to go.` : "You found them all!");
        if (!left) {
          confetti();
          sfx.win();
          setTimeout(
            () =>
              onFinish?.({
                solved: next.size,
                total: puzzle.placed.length,
                durationMs: Date.now() - started.current,
                perWord: puzzle.placed.map((w) => ({ english: w.english, solved: true, guesses: 1 })),
              }),
            1400,
          );
        }
      } else {
        setWrong(new Set(sel.map(key)));
        sfx.error();
        setTimeout(() => setWrong(new Set()), 450);
        setMood("wow");
        setSay("Not quite. Check each sound in the line.");
      }
    },
    [puzzle, found, onFinish],
  );

  const cellFromPoint = (x: number, y: number): Cell | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const btn = el?.closest<HTMLElement>("[data-cell]");
    if (!btn) return null;
    const [row, col] = btn.dataset.cell!.split(":").map(Number);
    return { row, col };
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dr, dc] = moves[e.key];
      const next = { row: Math.max(0, Math.min(puzzle.rows - 1, cursor.row + dr)), col: Math.max(0, Math.min(puzzle.cols - 1, cursor.col + dc)) };
      setCursor(next);
      if (start) setSelection(lineBetween(start, next));
      grid.current?.querySelector<HTMLElement>(`[data-cell="${next.row}:${next.col}"]`)?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!start) {
        setStart(cursor);
        setSelection([cursor]);
        setSay("Now move to the last sound and press Enter.");
      } else finish(lineBetween(start, cursor));
    } else if (e.key === "Escape") {
      setStart(null);
      setSelection([]);
    }
  };

  const selected = new Set(selection.map(key));
  const cell = big ? "size-16 text-3xl" : gridSize > 11 ? "size-9 text-base sm:size-11 sm:text-lg" : "size-10 text-lg sm:size-12 sm:text-xl";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="rounded-[28px] bg-surface p-4 ring-1 ring-line sm:p-7">
        {instructions && <p className="mb-4 text-center text-ink-soft">{instructions}</p>}
        <div className="overflow-x-auto">
          <div
            ref={grid}
            role="grid"
            aria-label="Word search grid. Use arrow keys to move, Enter to start and end a selection."
            onKeyDown={onKeyDown}
            onPointerUp={() => start && finish(selection)}
            onPointerLeave={() => start && finish(selection)}
            className="mx-auto grid w-max touch-none gap-1.5 rounded-3xl bg-sunken p-3 select-none"
            style={{ gridTemplateColumns: `repeat(${puzzle.cols}, auto)` }}
          >
            {puzzle.grid.map((row, r) =>
              row.map((sym, c) => {
                const k = `${r}:${c}`;
                const foundIdx = foundCell.get(k);
                return (
                  <button
                    key={k}
                    type="button"
                    data-cell={k}
                    tabIndex={r === cursor.row && c === cursor.col ? 0 : -1}
                    aria-label={`${sym}, row ${r + 1}, column ${c + 1}${foundIdx !== undefined ? ", found" : ""}`}
                    onPointerDown={(e) => {
                      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
                      setStart({ row: r, col: c });
                      setSelection([{ row: r, col: c }]);
                      setCursor({ row: r, col: c });
                    }}
                    onPointerMove={(e) => {
                      if (!start) return;
                      const at = cellFromPoint(e.clientX, e.clientY);
                      if (at) setSelection(lineBetween(start, at).filter((x) => x.row >= 0 && x.col >= 0 && x.row < puzzle.rows && x.col < puzzle.cols));
                    }}
                    className={cn(
                      "ipa grid place-items-center rounded-xl bg-surface font-bold transition-[transform,background] duration-150",
                      cell,
                      foundIdx !== undefined && FOUND_TONES[foundIdx % FOUND_TONES.length],
                      selected.has(k) && "scale-110 bg-lilac text-lilac-ink",
                      wrong.has(k) && "animate-shake bg-peach",
                      pop.has(k) && "animate-pop",
                    )}
                  >
                    {sym}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </div>
      <aside className="grid content-start gap-4">
        <div className="rounded-[28px] bg-surface p-5 ring-1 ring-line">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Find these words</h2>
            <span className="text-ink-soft">
              {found.size} of {puzzle.placed.length}
            </span>
          </div>
          <ul className="grid gap-2">
            {puzzle.placed.map((w) => {
              const done = found.has(w.index);
              return (
                <li key={w.index} className={cn("flex items-center gap-3 rounded-2xl px-4 py-2.5 transition-colors", done ? FOUND_TONES[w.index % FOUND_TONES.length] : "bg-sunken")}>
                  <span className={cn("grid size-6 place-items-center rounded-lg", done ? "bg-correct text-white" : "bg-surface")}>{done && <Check className="size-4" />}</span>
                  {showSpelling && <span className={cn("font-medium", done && "line-through")}>{w.english}</span>}
                  <span className="ipa ml-auto">/{w.phonemes.join(" ")}/</span>
                </li>
              );
            })}
          </ul>
          {puzzle.unplaced.length > 0 && <p className="mt-3 text-sm text-ink-soft">{puzzle.unplaced.length} word(s) didn&apos;t fit this grid size.</p>}
        </div>
        <div className="flex items-center gap-4 rounded-[28px] bg-surface p-5 ring-1 ring-line">
          <Buddy mood={finished ? "happy" : mood} size={88} />
          <p className="text-lg font-medium" aria-live="polite">
            {say}
          </p>
        </div>
      </aside>
    </div>
  );
}
