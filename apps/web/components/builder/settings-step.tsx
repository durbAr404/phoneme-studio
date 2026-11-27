"use client";
import { useMemo } from "react";
import { Shuffle } from "lucide-react";
import { generateWordSearch } from "@/lib/games/wordsearch";
import type { ActivityData, ActivitySettings, Difficulty } from "@/lib/types";
import { Button, Field, Input, Segmented, Toggle } from "@/components/ui";
import { classStyle } from "@/components/phoneme/keys";

export function SettingsStep({ data, update }: { data: ActivityData; update: (patch: Partial<ActivityData>) => void }) {
  const s = data.settings;
  const set = (patch: Partial<ActivitySettings>) => update({ settings: { ...s, ...patch } });
  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <div className="rounded-[28px] bg-surface px-7 py-3 ring-1 ring-line">
        <div className="space-y-4 border-b border-line py-4">
          <Field label="Title" htmlFor="title">
            <Input id="title" value={data.title} maxLength={120} onChange={(e) => update({ title: e.target.value })} />
          </Field>
          <Field label="Instructions for students" htmlFor="instr" hint="Optional. Shown above the game.">
            <Input id="instr" value={data.instructions} maxLength={300} onChange={(e) => update({ instructions: e.target.value })} placeholder="Listen for the th. Is it voiced or voiceless?" />
          </Field>
        </div>
        {data.kind === "wordle" ? (
          <div className="divide-y divide-line">
            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <span className="font-medium">Guesses per word</span>
              <Segmented label="Guesses per word" value={s.max_guesses} onChange={(v) => set({ max_guesses: v })} options={[4, 5, 6, 8].map((n) => ({ value: n, label: String(n) }))} />
            </div>
            <Toggle label="Hints" description="Hear the word and see the first sound" checked={s.hints} onChange={(v) => set({ hints: v })} />
            <Toggle label="Show spelling after each word" description="Students see thin under /θ ɪ n/" checked={s.show_spelling} onChange={(v) => set({ show_spelling: v })} />
            <Toggle label="Shuffle word order" description="A different order every time" checked={s.shuffle} onChange={(v) => set({ shuffle: v })} />
          </div>
        ) : (
          <div className="divide-y divide-line">
            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <span className="font-medium">Grid size</span>
              <Segmented label="Grid size" value={s.grid_size} onChange={(v) => set({ grid_size: v })} options={[8, 10, 12, 14].map((n) => ({ value: n, label: `${n}` }))} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <span>
                <span className="block font-medium">Difficulty</span>
                <span className="text-[15px] text-ink-soft">{s.difficulty === "EASY" ? "Across and down" : s.difficulty === "MEDIUM" ? "Adds diagonals" : "All directions, including backwards"}</span>
              </span>
              <Segmented<Difficulty> label="Difficulty" value={s.difficulty} onChange={(v) => set({ difficulty: v })} options={[{ value: "EASY", label: "Easy" }, { value: "MEDIUM", label: "Medium" }, { value: "HARD", label: "Hard" }]} />
            </div>
            <Toggle label="Show spellings in the word list" description="Off: students see sounds only" checked={s.show_spelling} onChange={(v) => set({ show_spelling: v })} />
            <Toggle label="Answer key when printing" checked={s.answer_key} onChange={(v) => set({ answer_key: v })} />
          </div>
        )}
      </div>
      <div className="lg:sticky lg:top-28">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-ink-soft">Live preview</span>
          {data.kind === "wordsearch" && (
            <Button size="sm" onClick={() => set({ seed: Math.floor(Math.random() * 1_000_000) })}>
              <Shuffle className="size-4" /> Shuffle grid
            </Button>
          )}
        </div>
        {data.kind === "wordle" ? <WordlePreview data={data} /> : <SearchPreview data={data} />}
      </div>
    </div>
  );
}

function WordlePreview({ data }: { data: ActivityData }) {
  const first = data.words[0]?.phonemes ?? [];
  return (
    <div className="grid place-items-center gap-2.5 rounded-[28px] bg-surface p-8 ring-1 ring-line">
      {data.instructions && <p className="mb-2 text-center text-ink-soft">{data.instructions}</p>}
      {Array.from({ length: data.settings.max_guesses }, (_, r) => (
        <div key={r} className="flex gap-2">
          {first.map((p, c) => (
            <span key={c} style={r === 0 ? classStyle(p) : undefined} className={r === 0 ? "keycap ipa grid size-14 place-items-center text-2xl !shadow-none" : "size-14 rounded-[16px] border-2 border-line"}>
              {r === 0 ? p : ""}
            </span>
          ))}
        </div>
      ))}
      <p className="mt-2 text-sm text-ink-soft">{data.words.length} words · first word shown</p>
    </div>
  );
}

function SearchPreview({ data }: { data: ActivityData }) {
  const s = data.settings;
  const puzzle = useMemo(() => generateWordSearch(data.words, { rows: s.grid_size, cols: s.grid_size, seed: s.seed, difficulty: s.difficulty }), [data.words, s.grid_size, s.seed, s.difficulty]);
  const placed = new Map<string, number>();
  puzzle.placed.forEach((w) => w.cells.forEach((c) => placed.set(`${c.row}:${c.col}`, w.index)));
  const tones = ["bg-mint text-mint-ink", "bg-peach text-peach-ink", "bg-butter text-butter-ink", "bg-sky text-sky-ink", "bg-lilac text-lilac-ink"];
  return (
    <div className="rounded-[28px] bg-surface p-4 ring-1 ring-line">
      <div className="grid gap-1 rounded-2xl bg-sunken p-2" style={{ gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)` }}>
        {puzzle.grid.flatMap((row, r) =>
          row.map((sym, c) => {
            const i = placed.get(`${r}:${c}`);
            return (
              <span key={`${r}:${c}`} className={`ipa grid aspect-square place-items-center rounded-lg text-sm sm:text-base ${i !== undefined ? tones[i % tones.length] : "bg-surface"}`}>
                {sym}
              </span>
            );
          }),
        )}
      </div>
      {puzzle.unplaced.length > 0 && <p className="mt-3 text-sm text-accent-ink">{puzzle.unplaced.length} word(s) don&apos;t fit. Try a bigger grid.</p>}
    </div>
  );
}
